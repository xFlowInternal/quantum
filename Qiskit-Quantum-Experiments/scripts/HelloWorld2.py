#done on the quantum computer
#Extending the Hello World example to an n-qubit GHZ state
from qiskit import QuantumCircuit
from qiskit.quantum_info import Pauli
from qiskit.quantum_info import SparsePauliOp
from qiskit_aer.primitives import Estimator
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
import matplotlib.pyplot as plt
from qiskit_ibm_runtime import EstimatorV2 as Estimator
from qiskit_ibm_runtime import EstimatorOptions

#Map the problem to circuits and operators
def get_qc(n):
    qc = QuantumCircuit(n)
    qc.h(0)
    for i in range(n-1):
        qc.cx(i, i+1)
    return qc
n = 100
qc = get_qc(n)
#qc.draw(output='mpl')
#plt.show()
operator_strings = ['Z'+'I'*i +'Z'+'I'*(n-2-i) for i in range(n-1)]
print(operator_strings)
print(len(operator_strings))

operators = [SparsePauliOp(operator_strings) for operator_strings in operator_strings]

#Optimize the problem for quantum execution
backend_name = "ibm_brisbane"
service = QiskitRuntimeService()
backend = service.backend("ibm_brisbane")
pass_manager = generate_preset_pass_manager(optimization_level=1, backend=backend)

qc_transpiled = pass_manager.run(qc)
operator_transpiled_list = [op.apply_layout(qc_transpiled.layout) for op in operators]

#Execute on the backend
options =EstimatorOptions()
options.resilience_level = 0
options.dynamical_decoupling.enable = True
options.dynamical_decoupling.sequence_type = "XY4"

estimator = Estimator(backend, options=options)

job = estimator.run([(qc_transpiled, operator_transpiled_list)])
job_id = job.job_id()
print(job_id)

#Posting/Plotting the process in a graph
service =  QiskitRuntimeService()
job = service.job(job_id)

data = list(range(1, len(operators)+1))
result = job.result()[0]
values = result.data.evs
values = [v/values[0] for v in values]

plt.scatter(data, values, marker='o', label='100-qubit GHZ state')
plt.xlabel('Distance between qubits $i$')
plt.ylabel(r'\langle Z_0 Z_i \rangle / \langle Z_0 Z_1 \rangle$')
plt.legend()
plt.show()

