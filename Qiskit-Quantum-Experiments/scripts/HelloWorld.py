# done on a local computer
# Hello World example on a 2-Qubit bell state

from qiskit import QuantumCircuit
from qiskit.quantum_info import Pauli
from qiskit_aer.primitives import Estimator
import matplotlib.pyplot as plt

# Map the problem to circuits and operators
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0,1)
qc.draw(output='mpl')

ZZ = Pauli('ZZ')
ZI = Pauli('ZI')
IZ = Pauli('IZ')
XX = Pauli('XX')
XI = Pauli('XI')
IX = Pauli('IX')

observables = [ZZ, ZI, IZ, XX, XI, IX]

# optimize(this step is done only in complex examples like any 100-qubit example )
# Execute on the backend
estimator = Estimator()
job = estimator.run([qc] * len(observables), observables)
job.result()

#Posting/Plotting the process in a graph
data = ['ZZ', 'ZI', 'IZ', 'XX', 'XI', 'IX']
values = job.result().values
plt.plot(data, values, '-o')
plt.xlabel('observables')
plt.ylabel('Expectation values')
plt.show()

