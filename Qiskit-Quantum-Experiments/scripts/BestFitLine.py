import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
import numpy as np

  
# 1. Load CSV
  
df = pd.read_csv("D:\\CWQ\\4SICS-GeekLounge-151020.csv")

# Use only Time and Length
X = df[['Time']]
y = df['Length']

# Convert to numeric (sometimes Wireshark time is stored as string)
X = X.apply(pd.to_numeric, errors='coerce')
y = pd.to_numeric(y, errors='coerce')

# Drop missing values
df_clean = df.dropna(subset=['Time', 'Length'])
X = df_clean[['Time']]
y = df_clean['Length']

  
# 2. Train Linear Regression
  
model = LinearRegression()
model.fit(X, y)

# Predict for best-fit line
y_pred = model.predict(X)

  
# 3. Plot best-fit line
  
plt.scatter(X, y, s=5)
plt.plot(X, y_pred)   # best-fit line
plt.xlabel("Time (seconds)")
plt.ylabel("Packet Length")
plt.title("Linear Regression Best-Fit Line")
plt.show()
