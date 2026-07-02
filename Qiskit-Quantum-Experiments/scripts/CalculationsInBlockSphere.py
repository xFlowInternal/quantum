"""
Animated Bloch spheres (side-by-side) for a 2-qubit circuit:
  - Start |00>
  - Hadamard on qubit 0
  - Smooth transition (20 frames) from "after H" to "after CNOT" by linear interpolation of statevector amplitudes
Output: bloch_evolution.gif

Dependencies:
  pip install qiskit numpy matplotlib imageio
"""

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, partial_trace
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import imageio
import os

# --- Settings ---
sphere_px = 400            # pixels per sphere
gap_px = 40                # gap between spheres
frame_hold = 4             # how many identical frames to hold at start/end
cnot_frames = 20           # user-chosen smooth frames for CNOT transition
h_transition_frames = 6    # frames to show transition from |00> -> after H (small)
outfile = "bloch_evolution.gif"
dpi = 100

# Pauli matrices
PAULI_X = np.array([[0, 1], [1, 0]], dtype=complex)
PAULI_Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
PAULI_Z = np.array([[1, 0], [0, -1]], dtype=complex)

def bloch_vector_from_rho(rho):
    """Compute Bloch vector [x,y,z] from single-qubit density matrix rho (2x2)."""
    x = np.real(np.trace(rho @ PAULI_X))
    y = np.real(np.trace(rho @ PAULI_Y))
    z = np.real(np.trace(rho @ PAULI_Z))
    return np.array([x, y, z])

def draw_single_bloch(ax, vec, radius=1.0):
    """
    Draw a Bloch sphere and a Bloch vector arrow on a given Axes3D `ax`.
    vec should be array-like with 3 components (x,y,z).
    """
    # Sphere surface
    u = np.linspace(0, 2 * np.pi, 40)
    v = np.linspace(0, np.pi, 20)
    x = radius * np.outer(np.cos(u), np.sin(v))
    y = radius * np.outer(np.sin(u), np.sin(v))
    z = radius * np.outer(np.ones_like(u), np.cos(v))
    ax.plot_surface(x, y, z, rstride=2, cstride=2, alpha=0.08, linewidth=0)

    # Axes lines
    ax.plot([-radius, radius], [0, 0], [0, 0], linewidth=0.8)
    ax.plot([0, 0], [-radius, radius], [0, 0], linewidth=0.8)
    ax.plot([0, 0], [0, 0], [-radius, radius], linewidth=0.8)

    # Bloch vector arrow
    vx, vy, vz = vec
    # Limit arrow to sphere surface for direction; if mixed (near 0) it will be short
    ax.quiver(0, 0, 0, vx, vy, vz, length=1, arrow_length_ratio=0.15, linewidth=2)

    # Labels & style
    ax.set_xlim([-1, 1]); ax.set_ylim([-1, 1]); ax.set_zlim([-1, 1])
    ax.set_xticks([]); ax.set_yticks([]); ax.set_zticks([])
    # keep aspect ratio equal
    ax.set_box_aspect((1,1,1))

def render_frame(bloch_q0, bloch_q1, frame_index, total_width_px):
    """
    Render side-by-side Bloch spheres into a numpy image (RGBA).
    """
    # Create a Matplotlib figure with two 3D axes
    fig = plt.figure(figsize=(total_width_px / dpi, sphere_px / dpi), dpi=dpi)
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')

    # Draw both spheres
    draw_single_bloch(ax1, bloch_q0)
    draw_single_bloch(ax2, bloch_q1)

    # Titles with small annotations
    ax1.set_title("Qubit 0", pad=10)
    ax2.set_title("Qubit 1", pad=10)

    # Tight layout and capture image
    plt.tight_layout()
    # render to buffer
    fig.canvas.draw()
    # convert to numpy array (RGBA)
    w, h = fig.canvas.get_width_height()
    img = np.frombuffer(fig.canvas.tostring_argb(), dtype=np.uint8).reshape((h, w, 4))
    # Matplotlib uses ARGB, convert to RGBA
    img = img[:, :, [1,2,3,0]]
    plt.close(fig)
    return img

# --- Build the three key states using Qiskit ---
# initial |00>
qc_init = QuantumCircuit(2)
state_init = Statevector.from_instruction(qc_init)  # |00>

# after Hadamard on qubit 0
qc_h = QuantumCircuit(2)
qc_h.h(0)
state_after_h = Statevector.from_instruction(qc_h)

# after Hadamard + CNOT (Bell state)
qc_bell = QuantumCircuit(2)
qc_bell.h(0)
qc_bell.cx(0, 1)
state_after_cx = Statevector.from_instruction(qc_bell)

# --- Build frames ---
frames = []

# helper to compute reduced Bloch vectors for each qubit from a 2-qubit statevector
def bloch_pair_from_statevec(statevec):
    # statevec is a qiskit Statevector or 1D numpy array length 4
    if isinstance(statevec, Statevector):
        sv = statevec.data
    else:
        sv = np.asarray(statevec, dtype=complex)
    # Build density matrix |psi><psi|
    rho_full = np.outer(sv, np.conjugate(sv))
    # Partial traces
    # For qubit 0: trace out qubit 1
    # For qubit 1: trace out qubit 0
    # Qiskit's partial_trace returns DensityMatrix but we will compute directly
    # reshape to 2x2x2x2: indices (q0,q1,q0',q1')
    rho4 = rho_full.reshape(2,2,2,2)
    # trace out qubit1 -> rho_q0[a,b] = sum_{j} rho4[a,j,b,j]
    rho_q0 = np.zeros((2,2), dtype=complex)
    rho_q1 = np.zeros((2,2), dtype=complex)
    for a in range(2):
        for b in range(2):
            rho_q0[a,b] = rho4[a,0,b,0] + rho4[a,1,b,1]
            rho_q1[a,b] = rho4[0,a,0,b] + rho4[1,a,1,b]
    bloch0 = bloch_vector_from_rho(rho_q0)
    bloch1 = bloch_vector_from_rho(rho_q1)
    return bloch0, bloch1

# Hold initial state a few frames
b0_init, b1_init = bloch_pair_from_statevec(state_init)
for _ in range(frame_hold):
    img = render_frame(b0_init, b1_init, 0, sphere_px*2 + gap_px)
    frames.append(img)

# Transition initial -> after H (small smooth interpolation)
sv0 = state_init.data
sv_h = state_after_h.data
for t in np.linspace(0.0, 1.0, h_transition_frames):
    sv_interp = (1 - t) * sv0 + t * sv_h
    sv_interp /= np.linalg.norm(sv_interp)
    b0, b1 = bloch_pair_from_statevec(sv_interp)
    img = render_frame(b0, b1, 0, sphere_px*2 + gap_px)
    frames.append(img)

# Hold after H for a couple frames
b0_h, b1_h = bloch_pair_from_statevec(state_after_h)
for _ in range(2):
    img = render_frame(b0_h, b1_h, 0, sphere_px*2 + gap_px)
    frames.append(img)

# Smoothly interpolate from after H -> after CNOT across `cnot_frames`
sv_start = state_after_h.data
sv_end = state_after_cx.data
for t in np.linspace(0.0, 1.0, cnot_frames):
    # linear interpolation of complex amplitudes then normalize
    sv_interp = (1 - t) * sv_start + t * sv_end
    sv_interp /= np.linalg.norm(sv_interp)
    b0, b1 = bloch_pair_from_statevec(sv_interp)
    img = render_frame(b0, b1, 0, sphere_px*2 + gap_px)
    frames.append(img)

# Hold final state a few frames
b0_final, b1_final = bloch_pair_from_statevec(state_after_cx)
for _ in range(frame_hold):
    img = render_frame(b0_final, b1_final, 0, sphere_px*2 + gap_px)
    frames.append(img)

# --- Save GIF ---
# Convert frames (RGBA uint8) to images for imageio
out_frames = [frame[:, :, :3] for frame in frames]  # drop alpha for smaller file
# Ensure output file not already present to avoid overwrite confusion
if os.path.exists(outfile):
    os.remove(outfile)

# imageio expects images as HxWx3 uint8
imageio.mimsave(outfile, out_frames, fps=10)  # 10 FPS smooth playback
print(f"Saved animated GIF to {outfile} (frames: {len(out_frames)})")
