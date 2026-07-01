from qiskit import QuantumCircuit
from qiskit_aer.primitives import Sampler
from scipy.optimize import minimize
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
import time
# Start timing
start_time = time.time()
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
    for i, j in edges:
        if bitstring[i] != bitstring[j]:
            cut += 1
            cut_edges.append((i, j))
    return cut, cut_edges
# -------------------------------
# Step 3: QAOA Circuit Generator
# -------------------------------
def qaoa_ansatz(gammas, betas):
    p = len(gammas)
    qc = QuantumCircuit(num_qubits, num_qubits)  # Add classical bits
    qc.h(range(num_qubits))
    for i in range(p):
        for (j, k) in edges:
            qc.rzz(2 * gammas[i], j, k)
        for j in range(num_qubits):
            qc.rx(2 * betas[i], j)
    qc.measure(range(num_qubits), range(num_qubits))
    return qc
# -------------------------------
# Step 4: Optimization Objective
# -------------------------------
sampler = Sampler()
p = 1
init_params = np.random.uniform(0, np.pi, 2 * p)
def objective(params):
    gammas = params[:p]
    betas = params[p:]
    qc = qaoa_ansatz(gammas, betas)
    result = sampler.run(qc, shots=1000).result()
    counts = result.quasi_dists[0].binary_probabilities()
    expected_cut = 0
    for bitstring, prob in counts.items():
        bitstring = bitstring[::-1]  # reverse to match qubit indexing
        cut, _ = compute_cut(bitstring, edges)
        expected_cut += cut * prob
    return -expected_cut  # Negative for minimization
# -------------------------------
# Step 5: Classical Optimization
# -------------------------------
res = minimize(objective, init_params, method='COBYLA')
optimal_params = res.x
# -------------------------------
# Step 6: Sample Final Distribution
# -------------------------------
final_circuit = qaoa_ansatz(optimal_params[:p], optimal_params[p:])
result = sampler.run(final_circuit, shots=1000).result()
counts = result.quasi_dists[0].binary_probabilities()
# -------------------------------
# Step 7: Extract Best Bitstring
# -------------------------------
best_bitstring = max(counts, key=counts.get)[::-1]
cut, cut_edges = compute_cut(best_bitstring, edges)
print("Best bitstring (binary):", best_bitstring)
print("Cut size:", cut)
print("Cut edges:", cut_edges)
# End timing
end_time = time.time()
elapsed = end_time - start_time
print(f"Quantum Execution Time: {elapsed:.4f} seconds")
# -------------------------------
# Step 8: Visualize the Result
# -------------------------------
G = nx.Graph()
G.add_edges_from(edges)
partition_0 = [i for i in range(num_qubits) if best_bitstring[i] == '0']
partition_1 = [i for i in range(num_qubits) if best_bitstring[i] == '1']
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
