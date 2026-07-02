from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler
from scipy.optimize import minimize
from qiskit.providers.exceptions import QiskitBackendNotFoundError
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
# -------------------------------
# Step 1: Define the Graph
# -------------------------------
edges = [(0, 4), (0, 3), (1, 2), (1, 4), (2, 3), (3, 1)]
num_qubits = 5
# -------------------------------
# Step 2: Utility to compute cut size from bitstring
# -------------------------------
def compute_cut(bitstring, edges):
    cut = 0
    cut_edges = []
    # Ensure bitstring is padded correctly if it's shorter than expected
    padded_bitstring = bitstring.zfill(num_qubits)
    for i, j in edges:
        if i < len(padded_bitstring) and j < len(padded_bitstring) and padded_bitstring[i] != padded_bitstring[j]:
            cut += 1
            cut_edges.append((i, j))
    return cut, cut_edges
# -------------------------------
# Step 3: QAOA Circuit Generator
# -------------------------------
def qaoa_ansatz(gammas, betas):
    p = len(gammas)
    qc = QuantumCircuit(num_qubits)
    qc.h(range(num_qubits))
    for i in range(p):
        for (j, k) in edges:
            qc.rzz(gammas[i], j, k)
        for j in range(num_qubits):
            qc.rx(2 * betas[i], j)
    qc.measure_all()
    return qc
# -------------------------------
# Step 4: Setup IBM Quantum Service
# -------------------------------
service = QiskitRuntimeService(channel="ibm_cloud")
try:
    backend = service.least_busy(simulator=False, operational=True, min_num_qubits=num_qubits)
    print(f"Using backend: {backend.name}")
except QiskitBackendNotFoundError:
    print("No suitable backend found. Falling back to simulator.")
    backend = service.backend("ibmq_qasm_simulator")
    print(f"Using backend: {backend.name}")
# Initialize parameters
p = 1
init_gammas = np.random.uniform(0, np.pi / 2, p)
init_betas = np.random.uniform(0, np.pi, p)
init_params = np.concatenate([init_gammas, init_betas])
# Initialize the Sampler
sampler = Sampler(mode=backend)
# -------------------------------
# Step 5: Optimization Objective
# -------------------------------
def objective(params):
    gammas = params[:p]
    betas = params[p:]
    qc = qaoa_ansatz(gammas, betas)
    isa_circuit = transpile(qc, backend=backend, optimization_level=1)
    result = sampler.run([isa_circuit], shots=1000).result()
    counts = result[0].data.meas.get_counts()
    expected_cut = 0
    total_shots = sum(counts.values())
    if total_shots == 0: return 0
    for bitstring_key, count in counts.items():
        # --- FIX: Handle both hex/int keys and binary string keys ---
        try:
            # Assumes key is like '0x1a' or '26'
            bitstring_int = int(bitstring_key, 0)
            bitstring = f"{bitstring_int:0{isa_circuit.num_qubits}b}"
        except ValueError:
            # If conversion fails, assumes key is already a binary string like '01001'
            bitstring = bitstring_key
        prob = count / total_shots
        cut, _ = compute_cut(bitstring, edges)
        expected_cut += cut * prob
    return -expected_cut
# -------------------------------
# Step 6: Classical Optimization
# -------------------------------
print("Starting optimization...")
res = minimize(objective, init_params, method='COBYLA', options={'maxiter': 50})
optimal_params = res.x
print("Optimization complete!")
# -------------------------------
# Step 7: Sample Final Distribution
# -------------------------------
optimal_gammas = optimal_params[:p]
optimal_betas = optimal_params[p:]
final_qc = qaoa_ansatz(optimal_gammas, optimal_betas)
final_isa_circuit = transpile(final_qc, backend=backend, optimization_level=1)
result = sampler.run([final_isa_circuit], shots=2000).result()
final_counts = result[0].data.meas.get_counts()
# -------------------------------
# Step 8: Extract Best Bitstring
# -------------------------------
if not final_counts:
    print("No measurement results found.")
else:
    num_physical_qubits = final_isa_circuit.num_qubits
    best_bitstring_key = max(final_counts, key=final_counts.get)
    # --- FIX: Handle both hex/int keys and binary string keys ---
    try:
        # Assumes key is like '0x1a' or '26'
        best_bitstring_int = int(best_bitstring_key, 0)
        best_bitstring = f"{best_bitstring_int:0{num_physical_qubits}b}"
    except ValueError:
        # If conversion fails, assumes key is already a binary string like '01001'
        best_bitstring = best_bitstring_key
    # Ensure final bitstring has correct padding (important if key was binary)
    best_bitstring = best_bitstring.zfill(num_qubits)
    cut, cut_edges = compute_cut(best_bitstring, edges)
    print("\nResults:")
    print("Best bitstring (binary):", best_bitstring)
    print("Cut size:", cut)
    print("Cut edges:", cut_edges)
    # -------------------------------
    # Step 9: Visualize the Result
    # -------------------------------
    G = nx.Graph()
    G.add_edges_from(edges)
    partition_0 = [i for i in range(num_qubits) if i < len(best_bitstring) and best_bitstring[i] == '0']
    partition_1 = [i for i in range(num_qubits) if i < len(best_bitstring) and best_bitstring[i] == '1']
    pos = nx.spring_layout(G, seed=42)
    plt.figure(figsize=(6, 5))
    nx.draw_networkx_nodes(G, pos, nodelist=partition_0, node_color='red', label='Partition 0')
    nx.draw_networkx_nodes(G, pos, nodelist=partition_1, node_color='blue', label='Partition 1')
    nx.draw_networkx_labels(G, pos)
    nx.draw_networkx_edges(G, pos, edgelist=edges, edge_color='lightgray', style='dotted')
    nx.draw_networkx_edges(G, pos, edgelist=cut_edges, edge_color='green', width=2)
    plt.title(f"QAOA MaxCut (cut size: {cut})")
    plt.axis('off')
    plt.legend()
    plt.show()