# QAOA using IBM Quantum Cloud (real backend via least_busy)
import time
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import SparsePauliOp
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler
from qiskit.providers.exceptions import QiskitBackendNotFoundError
from scipy.optimize import minimize

# 1. Define MaxCut graph and Hamiltonian
edges = [(0, 4), (0, 3), (1, 2), (1, 4), (2, 3), (3, 1)]
num_qubits = 5

def maxcut_hamiltonian(edges, num_qubits):
    pauli_list = []
    coeffs = []
    for i, j in edges:
        z_term = ["I"] * num_qubits
        z_term[num_qubits - i - 1] = "Z"
        z_term[num_qubits - j - 1] = "Z"
        pauli_list.append("".join(z_term))
        coeffs.append(-0.5)
    return SparsePauliOp(pauli_list, coeffs)

hamiltonian = maxcut_hamiltonian(edges, num_qubits)

# 2. QAOA ansatz circuit
def qaoa_ansatz(params, p):
    gamma = params[:p]
    beta = params[p:]
    qc = QuantumCircuit(num_qubits)
    qc.h(range(num_qubits))
    for layer in range(p):
        for i, j in edges:
            qc.cx(i, j)
            qc.rz(-2 * gamma[layer], j)
            qc.cx(i, j)
        for i in range(num_qubits):
            qc.rx(2 * beta[layer], i)
    qc.measure_all()
    return qc

# 3. Compute expectation from quasi-distribution
def compute_expectation(bitstring_probs, hamiltonian):
    energy = 0
    for bitstring, prob in bitstring_probs.items():
        if isinstance(bitstring, int):
            bitstring = format(bitstring, f'0{num_qubits}b')
        z = [1 if b == '0' else -1 for b in bitstring[::-1]]
        e = sum(z[i] * z[j] for (i, j) in edges)
        energy += -0.5 * e * prob
    return energy

# 4. Connect to IBM Cloud
service = QiskitRuntimeService(channel="ibm_cloud")

# Choose least-busy real backend
try:
    backend = service.least_busy(simulator=False, operational=True, min_num_qubits=num_qubits)
except QiskitBackendNotFoundError:
    backend = service.least_busy(simulator=False, operational=True)

service.backend = backend  # Set default backend for runtime

print("Using backend:", backend.name)

# 5. Classical optimization loop
p = 2
np.random.seed(42)
initial_params = np.random.uniform(0, np.pi, 2 * p)

def objective(params):
    qc = qaoa_ansatz(params, p)
    transpiled = transpile(qc, backend)
    sampler = Sampler(mode=backend)  # Use QiskitRuntime Sampler
    job = sampler.run([(transpiled, None, 1000)])
    result = job.result()

    try:
        bitstring_probs = result[0].data.meas.get_counts()
        total_shots = sum(bitstring_probs.values())
        bitstring_probs = {k: v / total_shots for k, v in bitstring_probs.items()}
    except AttributeError as e:
        print("Error accessing result data:", e)
        print("Result object:", result)
        print("Available attributes in result[0].data:", dir(result[0].data))
        raise

    return compute_expectation(bitstring_probs, hamiltonian)

# Start optimization
start = time.time()
result = minimize(objective, initial_params, method="COBYLA", options={"maxiter": 100})
optimal_params = result.x
print("Optimal parameters (gamma, beta):", optimal_params)

# 6. Final sampling using optimal parameters
qc_final = qaoa_ansatz(optimal_params, p)
qc_final = transpile(qc_final, backend)
sampler = Sampler(mode=backend)
job = sampler.run([(qc_final, None, 1000)])
final_result = job.result()

try:
    bitstring_probs = final_result[0].data.meas.get_counts()
    total_shots = sum(bitstring_probs.values())
    bitstring_probs = {k: v / total_shots for k, v in bitstring_probs.items()}
except AttributeError as e:
    print("Error accessing final result data:", e)
    print("Final result object:", final_result)
    print("Available attributes in final_result[0].data:", dir(final_result[0].data))
    raise

# 7. Output
print("\nFinal bitstring probabilities:")
for bitstring, prob in sorted(bitstring_probs.items(), key=lambda x: x[1], reverse=True):
    print(f"{bitstring}: {prob:.4f}")

print(f"\nTotal wall-clock time: {time.time() - start:.2f} seconds")
