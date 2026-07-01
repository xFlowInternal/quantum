import numpy as np
import networkx as nx
import cvxpy as cp
import matplotlib.pyplot as plt
import time
# Start timing
start_time = time.time()
# Define Max-Cut graph
edges = [(0, 4), (0, 3), (1, 2), (1, 4), (2, 3), (3, 1)]
num_nodes = 5
# Create graph using NetworkX
G = nx.Graph()
G.add_nodes_from(range(num_nodes))
G.add_edges_from(edges)
# 1. Construct weight matrix
W = np.zeros((num_nodes, num_nodes))
for u, v in edges:
    W[u, v] = W[v, u] = 1
# 2. Semidefinite relaxation of Max-Cut
X = cp.Variable((num_nodes, num_nodes), symmetric=True)
objective = cp.Maximize(0.25 * cp.sum(cp.multiply(W, 1 - X)))
constraints = [X >> 0]
constraints += [cp.diag(X) == 1]
problem = cp.Problem(objective, constraints)
problem.solve()
# 3. Randomized rounding
def random_hyperplane_rounding(X_opt, num_trials=1000):
    best_cut = []
    best_value = -np.inf
    # Cholesky or eigen decomposition for rounding
    eigvals, eigvecs = np.linalg.eigh(X_opt)
    eigvecs = eigvecs @ np.diag(np.sqrt(np.maximum(eigvals, 0)))
    for _ in range(num_trials):
        r = np.random.randn(num_nodes)
        r /= np.linalg.norm(r)
        assignment = np.sign(eigvecs @ r)
        cut = []
        cut_value = 0
        for u, v in edges:
            if assignment[u] != assignment[v]:
                cut.append((u, v))
                cut_value += 1
        if cut_value > best_value:
            best_value = cut_value
            best_cut = cut
    return best_cut, best_value
# Perform rounding
cut_edges, cut_size = random_hyperplane_rounding(X.value)
# 4. Output
print("Approximated Max-Cut edges:", cut_edges)
print("Approximated Max-Cut value:", cut_size)
# End timing
end_time = time.time()
elapsed = end_time - start_time
print(f"Quantum Execution Time: {elapsed:.4f} seconds")
# 5. Visualization
colors = ['red' if node in [u for u, v in cut_edges] else 'blue' for node in G.nodes()]
pos = nx.spring_layout(G, seed=42)
nx.draw(G, pos, with_labels=True, node_color=colors, edge_color='gray', node_size=600)
nx.draw_networkx_edges(G, pos, edgelist=cut_edges, edge_color='green', width=2)
plt.title("Goemans–Williamson Max-Cut Approximation")
plt.show()