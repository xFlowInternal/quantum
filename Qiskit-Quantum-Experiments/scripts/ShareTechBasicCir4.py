#H-CNOT with |1> and |1>
from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit
from qiskit.visualization import plot_histogram, circuit_drawer
from qiskit_aer import AerSimulator
from qiskit import transpile
import matplotlib.pyplot as plt
# Create a quantum circuit with 2 qubits and 2 classical bits
qreg_q = QuantumRegister(2, 'q')
creg_c = ClassicalRegister(2, 'c')
circuit = QuantumCircuit(qreg_q, creg_c)
# Apply Hadamard gate on qubit 0 and CNOT between qubit 0 and 1
circuit.x(qreg_q[0])
circuit.h(qreg_q[0])
circuit.x(qreg_q[1])
circuit.cx(qreg_q[0], qreg_q[1])
# Measure only qubits 0 and 1
circuit.measure(qreg_q[0], creg_c[0])
circuit.measure(qreg_q[1], creg_c[1])
# Draw the circuit
circuit_drawer(circuit, output='mpl')
plt.show()
# Create the simulator
simulator = AerSimulator()
# Transpile for the simulator backend
compiled_circuit = transpile(circuit, simulator)
# Run the simulation
result = simulator.run(compiled_circuit, shots=10000).result()
# Get counts and plot
counts = result.get_counts()
plot_histogram(counts)
plt.show()