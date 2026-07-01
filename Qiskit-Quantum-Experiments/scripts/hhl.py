import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

  
# 1. Load CSV

df = pd.read_csv(r"D:\\CWQ\\4SICS-GeekLounge-151020.csv")  # CSV must have 'Time' and 'Length' columns
df = df[['Time', 'Length']].dropna()
x_vals = df['Time'].values.reshape(-1, 1)
y_vals = df['Length'].values
# 2. Feature scaling

scaler = StandardScaler()
x_scaled = scaler.fit_transform(x_vals)
# 3. Add polynomial features (optional, for non-linear trends)

poly = PolynomialFeatures(degree=1)  # change degree for more complexity
X_poly = poly.fit_transform(x_scaled)  # adds x^2 term and intercept automatically
# 4. Train/test split

X_train, X_test, y_train, y_test = train_test_split(X_poly, y_vals, test_size=0.2, random_state=42)
# 5. Build normal equation matrix

A = X_train.T @ X_train
b = X_train.T @ y_train  
# 6. Normalize b (for quantum encoding demo)

b_norm = np.linalg.norm(b)
b_normalized = b / b_norm
# 7. Encode b into quantum state (HHL demo)

theta = 2 * np.arccos(b_normalized[0])  # simple 2D rotation for demo
qc = QuantumCircuit(1)
qc.ry(theta, 0)
sim = AerSimulator()
result = sim.run(qc).result()
state = Statevector.from_instruction(qc)
print("Quantum state encoding b:", state.data)
# 8. Solve Ax = b classically

x_solution = np.linalg.solve(A, b)
print("Trained coefficients:", x_solution)
  
# 9. Prediction function
  
def predict(X_input):
    # Handle raw 1D array or already-transformed matrix
    if X_input.ndim == 1 or X_input.shape[1] == 1:
        X_scaled_input = scaler.transform(X_input.reshape(-1, 1))
        X_poly_input = poly.transform(X_scaled_input)
    else:
        X_poly_input = X_input
    return X_poly_input @ x_solution

# 10. Evaluate on test set

y_pred_test = predict(X_test)
mse = mean_squared_error(y_test, y_pred_test)
print(f"Test MSE: {mse:.4f}")
# 11. Future predictions

future_times = np.array([x_vals[-1,0] + i for i in range(1, 6)])
future_lengths = predict(future_times)
for t, l in zip(future_times, future_lengths):
    print(f"Predicted Length at Time {t}: {l:.4f}")
# 12. Plot regression and predictions

plt.scatter(x_vals, y_vals, s=5, label="Original Data")

# Regression line over original range
x_plot = np.linspace(x_vals.min(), x_vals.max(), 100)
y_plot = predict(x_plot)
plt.plot(x_plot, y_plot, linewidth=2, label="Regression Line")
# Future predictions

plt.scatter(future_times, future_lengths, color='red', label="Predictions")
plt.xlabel("Time")
plt.ylabel("Length")
plt.title("Polynomial Regression with HHL Demo")
plt.legend()
plt.show()