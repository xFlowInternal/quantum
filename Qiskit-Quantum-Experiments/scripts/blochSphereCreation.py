from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit.visualization.bloch import Bloch
import matplotlib.pyplot as plt
from matplotlib import animation
import numpy as np

# Define the circuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)

# Stepwise statevectors
steps = [
    Statevector.from_label("00"),          # Initial
    Statevector.from_instruction(qc[:1]),  # After H
    Statevector.from_instruction(qc)       # After H + CNOT
]

# Extract Bloch vectors for both qubits at each step
bloch_vectors = []
for state in steps:
    rho = state.to_density_matrix()
    for qubit in range(2):
        # Reduced density matrix for each qubit
        rho_qubit = rho.ptrace(qubit)
        # Get Bloch vector components
        x = np.real(np.trace(rho_qubit @ np.array([[0,1],[1,0]])))
        y = np.real(np.trace(rho_qubit @ np.array([[0,-1j],[1j,0]])))
        z = np.real(np.trace(rho_qubit @ np.array([[1,0],[0,-1]])))
        bloch_vectors.append((x,y,z))
        
# Organize into [step][qubit]
bloch_vectors = [bloch_vectors[0:2], bloch_vectors[2:4], bloch_vectors[4:6]]

# --- Animation ---
fig = plt.figure(figsize=(8,4))

# Create Bloch spheres
b1 = Bloch()
b2 = Bloch()

def animate(i):
    b1.clear()
    b2.clear()
    b1.add_vectors(bloch_vectors[i][0])
    b2.add_vectors(bloch_vectors[i][1])
    b1.render(fig=fig, subplot=121, title="Qubit 1")
    b2.render(fig=fig, subplot=122, title="Qubit 2")

anim = animation.FuncAnimation(fig, animate, frames=len(bloch_vectors), interval=1500, repeat=True)

# Save as gif (optional)
# anim.save("bloch_entanglement.gif", writer="pillow")

plt.show()
