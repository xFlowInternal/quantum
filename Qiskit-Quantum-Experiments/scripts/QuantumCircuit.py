import numpy as np
import time
from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler
import matplotlib.pyplot as plt
from qiskit.visualization import plot_histogram, circuit_drawer

# Start timing
start_time = time.time()

# 1. A quantum circuit for preparing the quantum state |000> + i |111> / √2
qc = QuantumCircuit(3)
qc.h(0)             # generate superposition
qc.p(np.pi / 2, 0)  # add quantum phase
qc.cx(0, 1)         # 0th-qubit-Controlled-NOT gate on 1st qubit
qc.cx(0, 2)         # 0th-qubit-Controlled-NOT gate on 2nd qubit


# 2. Add the classical output in the form of measurement of all qubits
qc_measured = qc.measure_all(inplace=False)

circuit_drawer(qc, output='mpl')
plt.show()

# 3. Execute using the Sampler primitive(Use a statevector-based sampler to simulate quantum measurement)
sampler = StatevectorSampler()
job = sampler.run([qc_measured], shots=1000)

# Wait for job to complete
result = job.result()
counts = result[0].data['meas'].get_counts()

# End timing
end_time = time.time()
elapsed = end_time - start_time

print("Quantum Measurement Counts:", counts)
print(f"Quantum Execution Time: {elapsed:.4f} seconds")