import random
import time
from collections import Counter

# Start timing
start_time = time.time()

# We simulate 1000 samples from the known state: (|000> + i|111>)/sqrt(2)

# The probabilities:
# |1/sqrt(2)|^2 = 0.5 for both states

samples = []
for _ in range(10000000):
    # Choose either '000' or '111' with equal probability
    outcome = random.choices(['000', '111'], weights=[0.5, 0.5])[0]
    samples.append(outcome)

# Count the occurrences
counts = Counter(samples)

# End timing
end_time = time.time()
elapsed = end_time - start_time

print("Classical Simulated Counts:", counts)
print(f"Classical Execution Time: {elapsed:.4f} seconds")
