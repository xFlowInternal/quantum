from qiskit import QuantumCircuit
from qiskit_aer.primitives import Sampler
from scipy.optimize import minimize
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
import time

# ==============================================================================
# PART 1: CLASSICAL SOLVER FOR THE LARGE GRAPH
#
# This section contains a function to solve the Max-Cut problem using a
# fast, classical greedy algorithm. This is the practical way to handle
# a large 100-node graph.
# ==============================================================================

def solve_classically(edges, num_nodes):
    """
    Solves the Max-Cut problem using a simple greedy algorithm.
    It iterates through each node, assigning it to the partition
    that maximizes the current cut size.
    """
    print("--- Starting Classical Greedy Solver for Large Graph ---")
    start_time_classical = time.time()
    
    partitions = {}  # Stores which partition (0 or 1) each node is in
    
    # Greedily assign each node to the partition that gives the biggest cut increase
    for i in range(num_nodes):
        cut_if_0 = 0
        cut_if_1 = 0
        for neighbor in G.neighbors(i):
            if neighbor in partitions:
                if partitions[neighbor] == 1:
                    cut_if_0 += 1
                else: # partitions[neighbor] == 0
                    cut_if_1 += 1
        
        if cut_if_1 > cut_if_0:
            partitions[i] = 1
        else:
            partitions[i] = 0
            
    # Construct the final bitstring and partitions from the dictionary
    best_bitstring = "".join([str(partitions[i]) for i in range(num_nodes)])
    partition_0 = [node for node, part in partitions.items() if part == 0]
    partition_1 = [node for node, part in partitions.items() if part == 1]
    
    cut, cut_edges = compute_cut(best_bitstring, edges)
    
    end_time_classical = time.time()
    elapsed = end_time_classical - start_time_classical
    
    print("\nClassical Solver Results:")
    print(f"Best bitstring found: ...{best_bitstring[-50:]}") # Print last 50 chars
    print(f"Cut size: {cut}")
    print(f"Classical Execution Time: {elapsed:.4f} seconds")
    
    # Return graph and partitions for visualization
    return G, partition_0, partition_1, cut, cut_edges


# ==============================================================================
# PART 2: QAOA SOLVER FOR A SMALL, MANAGEABLE GRAPH
#
# This section contains your QAOA code. It is designed to run on a
# small graph (e.g., 5 nodes) to demonstrate the quantum algorithm's
# workflow without crashing your computer.
# ==============================================================================

def solve_with_qaoa(edges, num_qubits):
    """
    Solves the Max-Cut problem using the QAOA algorithm on a local simulator.
    """
    print("\n--- Starting QAOA Solver for Small Graph ---")
    start_time_qaoa = time.time()

    # Step 3: QAOA Circuit Generator
    def qaoa_ansatz(gammas, betas):
        p = len(gammas)
        qc = QuantumCircuit(num_qubits)
        qc.h(range(num_qubits))
        for i in range(p):
            for (j, k) in edges:
                qc.rzz(gammas[i], j, k)
            qc.barrier()
            for j in range(num_qubits):
                qc.rx(2 * betas[i], j)
        qc.measure_all()
        return qc

    # Step 4: Optimization Objective
    from qiskit_aer.primitives import SamplerV2 as Sampler

    sampler = Sampler()
    p = 1
    init_params = np.random.uniform(0, np.pi, 2 * p)

    iteration_count = 0
    def objective(params):
        nonlocal iteration_count
        iteration_count += 1
        print(f"QAOA Iteration: {iteration_count}", end='\r')

        gammas = params[:p]
        betas = params[p:]
        qc = qaoa_ansatz(gammas, betas)
        
        result = sampler.run([qc], shots=1024).result()
        
        # --- FIX: Call .get_counts() on the BitArray object ---
        # `result[0].data.meas` is a BitArray. We get counts from it.
        counts = result[0].data.meas.get_counts()
        total_shots = sum(counts.values())

        expected_cut = 0
        if total_shots > 0:
            for bitstring, count in counts.items():
                prob = count / total_shots
                cut, _ = compute_cut(bitstring, edges)
                expected_cut += cut * prob
        
        return -expected_cut  # Negative for minimization

    # Step 5: Classical Optimization
    print("Starting optimization...")
    res = minimize(objective, init_params, method='COBYLA', options={'maxiter': 80})
    optimal_params = res.x
    print("\nOptimization complete!                  ") # Spaces to clear progress

    # Step 6: Sample Final Distribution
    final_circuit = qaoa_ansatz(optimal_params[:p], optimal_params[p:])
    result = sampler.run([final_circuit], shots=2048).result()
    
    # --- FIX: Get the final counts the same way ---
    final_counts = result[0].data.meas.get_counts()

    # Step 7: Extract Best Bitstring
    if not final_counts:
        print("Warning: No measurement results found. Using a default bitstring.")
        best_bitstring = "0" * num_qubits
    else:
        best_bitstring = max(final_counts, key=final_counts.get)
        
    cut, cut_edges = compute_cut(best_bitstring, edges)

    end_time_qaoa = time.time()
    elapsed = end_time_qaoa - start_time_qaoa

    print("\nQAOA Solver Results:")
    print("Best bitstring (binary):", best_bitstring)
    print("Cut size:", cut)
    print(f"QAOA Execution Time: {elapsed:.4f} seconds")
    
    G_small = nx.Graph()
    G_small.add_edges_from(edges)
    partition_0 = [i for i in range(num_qubits) if best_bitstring[i] == '0']
    partition_1 = [i for i in range(num_qubits) if best_bitstring[i] == '1']
    
    return G_small, partition_0, partition_1, cut, cut_edges

# -------------------------------
# Utility to compute cut size from bitstring (can be used by both solvers)
# -------------------------------
def compute_cut(bitstring, edges):
    cut = 0
    cut_edges = []
    for i, j in edges:
        if i < len(bitstring) and j < len(bitstring) and bitstring[i] != bitstring[j]:
            cut += 1
            cut_edges.append((i, j))
    return cut, cut_edges


# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
if __name__ == "__main__":
    # ---
    # Run the CLASSICAL solver on the IMPOSSIBLY LARGE graph
    # ---
    large_graph_edges = [
        (0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (1, 4), (2, 3), (2, 5), (3, 6), (4, 5), 
        (4, 7), (4, 8), (5, 6), (5, 9), (6, 7), (6, 10), (7, 8), (7, 11), (8, 9), (8, 12), 
        (9, 10), (9, 13), (10, 11), (10, 14), (11, 12), (11, 15), (12, 13), (12, 16), 
        (13, 14), (13, 17), (14, 15), (14, 18), (15, 16), (15, 19), (16, 17), (16, 20), 
        (17, 18), (17, 21), (18, 19), (18, 22), (19, 20), (19, 23), (20, 21), (20, 24), 
        (21, 22), (21, 25), (22, 23), (22, 26), (23, 24), (23, 27), (24, 25), (24, 28), 
        (25, 26), (25, 29), (26, 27), (26, 30), (27, 28), (27, 31), (28, 29), (28, 32), 
        (29, 30), (29, 33), (30, 31), (30, 34), (31, 32), (31, 35), (32, 33), (32, 36), 
        (33, 34), (33, 37), (34, 35), (34, 38), (35, 36), (35, 39), (36, 37), (36, 40), 
        (37, 38), (37, 41), (38, 39), (38, 42), (39, 40), (39, 43), (40, 41), (40, 44), 
        (41, 42), (41, 45), (42, 43), (42, 46), (43, 44), (43, 47), (44, 45), (44, 48), 
        (45, 46), (45, 49), (46, 47), (46, 50), (47, 48), (47, 51), (48, 49), (48, 52), 
        (49, 50), (49, 53), (50, 51), (50, 54), (51, 52), (51, 55), (52, 53), (52, 56), 
        (53, 54), (53, 57), (54, 55), (54, 58), (55, 56), (55, 59), (56, 57), (56, 60), 
        (57, 58), (57, 61), (58, 59), (58, 62), (59, 60), (59, 63), (60, 61), (60, 64), 
        (61, 62), (61, 65), (62, 63), (62, 66), (63, 64), (63, 67), (64, 65), (64, 68), 
        (65, 66), (65, 69), (66, 67), (66, 70), (67, 68), (67, 71), (68, 69), (68, 72), 
        (69, 70), (69, 73), (70, 71), (70, 74), (71, 72), (71, 75), (72, 73), (72, 76), 
        (73, 74), (73, 77), (74, 75), (74, 78), (75, 76), (75, 79), (76, 77), (76, 80), 
        (77, 78), (77, 81), (78, 79), (78, 82), (79, 80), (79, 83), (80, 81), (80, 84), 
        (81, 82), (81, 85), (82, 83), (82, 86), (83, 84), (83, 87), (84, 85), (84, 88), 
        (85, 86), (85, 89), (86, 87), (86, 90), (87, 88), (87, 91), (88, 89), (88, 92), 
        (89, 90), (89, 93), (90, 91), (90, 94), (91, 92), (91, 95), (92, 93), (92, 96), 
        (93, 94), (93, 97), (94, 95), (94, 98), (95, 96), (95, 99), (96, 97), (97, 98), 
        (98, 99)
    ]
    large_num_nodes = 100
    G = nx.Graph()
    G.add_edges_from(large_graph_edges)
    G_classical, p0_classical, p1_classical, cut_classical, cut_edges_classical = solve_classically(large_graph_edges, large_num_nodes)
    
    # NOTE: Visualization for 100 nodes is very slow and cluttered, so it's disabled by default.
    # plt.figure(figsize=(15, 12))
    # pos = nx.spring_layout(G_classical, seed=42)
    # nx.draw_networkx_nodes(G_classical, pos, nodelist=p0_classical, node_color='red', node_size=50)
    # nx.draw_networkx_nodes(G_classical, pos, nodelist=p1_classical, node_color='blue', node_size=50)
    # nx.draw_networkx_edges(G_classical, pos, edgelist=cut_edges_classical, edge_color='green', width=0.5)
    # plt.title(f"Classical MaxCut (cut size: {cut_classical})")
    # plt.show()

    # ---
    # Run the QAOA solver on a SMALL, SIMULATABLE graph
    # ---
    small_num_qubits = 5
    small_graph_edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (1, 3)]
    
    G_qaoa, p0_qaoa, p1_qaoa, cut_qaoa, cut_edges_qaoa = solve_with_qaoa(small_graph_edges, small_num_qubits)

    # ---
    # Visualize the result from the small QAOA run
    # ---
    pos = nx.spring_layout(G_qaoa, seed=42)
    plt.figure(figsize=(6, 5))
    nx.draw_networkx_nodes(G_qaoa, pos, nodelist=p0_qaoa, node_color='red', label='Partition 0')
    nx.draw_networkx_nodes(G_qaoa, pos, nodelist=p1_qaoa, node_color='blue', label='Partition 1')
    nx.draw_networkx_labels(G_qaoa, pos)
    nx.draw_networkx_edges(G_qaoa, pos, edgelist=G_qaoa.edges(), edge_color='lightgray', style='dotted')
    nx.draw_networkx_edges(G_qaoa, pos, edgelist=cut_edges_qaoa, edge_color='green', width=2)
    plt.title(f"QAOA MaxCut (cut size: {cut_qaoa})")
    plt.axis('off')
    plt.legend()
    plt.show()