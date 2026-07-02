import time, numpy as np
from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler
from qiskit.providers.exceptions import QiskitBackendNotFoundError
from qiskit import transpile

# 1 ── Connect to IBM Cloud
service = QiskitRuntimeService(channel="ibm_cloud")

# 2 ── Choose least-busy real backend
try:
    backend = service.least_busy(simulator=False, operational=True, min_num_qubits=3)
except QiskitBackendNotFoundError:
    backend = service.least_busy(simulator=False, operational=True)

print("Using backend:", backend.name)

# 3 ── Build quantum circuit (|000> + i|111>)/√2
qc = QuantumCircuit(3)
qc.h(0)
qc.p(np.pi / 2, 0)
qc.cx(0, 1)
qc.cx(0, 2)
qc.measure_all()


# Transpile for target backend
qc = transpile(qc, backend)

# 4 ── Execute without session
t0 = time.time()
sampler  = Sampler(mode=backend)
job      = sampler.run([qc], shots=10000000)
counts = job.result()[0].data['meas'].get_counts()

# 5 ── Output
print("Counts:", counts)
print(f"Wall-clock time: {time.time() - t0:.2f} seconds")
