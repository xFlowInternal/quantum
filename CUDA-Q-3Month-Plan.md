# NVIDIA CUDA-Q — 3-Month Learning & Delivery Plan

**Prepared for:** Muhammad Ali Hussnain  
**Repository:** https://github.com/xFlowInternal/quantum  
**Duration:** 3 months (12 weeks)  
**Goal:** Go from zero to building, running, and deploying real hybrid quantum-classical applications using NVIDIA CUDA-Q

---

## Executive Summary (Share with Boss)

> Over the next 3 months, I will master NVIDIA CUDA-Q — NVIDIA's open-source platform for hybrid quantum-classical computing. I will progress from fundamentals to GPU-accelerated quantum simulation, implement real quantum algorithms, and deploy applications that run on both simulators and real quantum hardware providers (IonQ, Quantinuum, Amazon Braket). By the end, I will have built and published 3 working quantum applications in the team repository.

---

## What I Will Be Able to Do After 3 Months

| Skill | Level |
|-------|-------|
| Write quantum kernels in Python and C++ | ✓ Proficient |
| Simulate quantum circuits on GPU (NVIDIA cuStateVec) | ✓ Proficient |
| Run VQE, QAOA, quantum chemistry algorithms | ✓ Proficient |
| Submit jobs to real QPUs (IonQ, Quantinuum via cloud) | ✓ Working knowledge |
| Use multi-GPU workflows (mgpu, mqpu) | ✓ Working knowledge |
| Implement quantum error correction basics | ✓ Awareness |
| Quantum dynamics simulation | ✓ Awareness |

---

## Month 1 — Foundations (Weeks 1–4)

### Week 1 — Environment + Core Concepts

**Goal:** Install CUDA-Q, understand what a quantum kernel is, run first programs.

| Topic | What to Study | Time |
|-------|--------------|------|
| Install CUDA-Q | Local install (Python pip) or Docker | 1 day |
| Validate installation | Run built-in tests | half day |
| What is a CUDA-Q Kernel? | CUDA-Q docs: Basics section | 1 day |
| Building your first program | Write Bell state, GHZ state | 1 day |
| Sample / Run / Observe | Understand the 3 execution modes | 1 day |

**Deliverable:** Bell state program running locally, results printed.

```python
import cudaq

@cudaq.kernel
def bell():
    q = cudaq.qvector(2)
    h(q[0])
    cx(q[0], q[1])

# Sample — get measurement histogram
counts = cudaq.sample(bell)
print(counts)   # expected: {00: ~500, 11: ~500}
```

---

### Week 2 — Building Kernels

**Goal:** Master how to define, compose, and parameterize kernels.

| Topic | What to Study |
|-------|--------------|
| Defining Kernels | Kernel syntax, input rules |
| Initializing states | qvector, qubit, initial states |
| Applying Gates | H, X, Y, Z, CNOT, T, S, Rx, Ry, Rz |
| Controlled Operations | ctrl, adjoint |
| Custom Operations | Define your own unitary |
| Parameterized Kernels | Pass angles as arguments |
| Building Kernels with Kernels | Call one kernel from another |

**Deliverable:** Parameterized single-qubit rotation kernel + controlled-U gate.

---

### Week 3 — Quantum Operations and Measurements

**Goal:** Understand measurement strategies and mid-circuit logic.

| Topic | What to Study |
|-------|--------------|
| Quantum States | State vector understanding |
| Quantum Gates | Full gate set in CUDA-Q |
| Measurements | mz, mx, my |
| Multi-Controlled Operations | Multi-qubit controlled gates |
| Adjoint Operations | Inverse gates |
| Mid-circuit Measurement | Measure during circuit, branch on result |
| Measurement Handles | Access individual qubit results |

**Deliverable:** Quantum teleportation circuit with mid-circuit measurement.

---

### Week 4 — Executing Kernels + Visualization

**Goal:** Use all execution modes, visualize circuits.

| Topic | What to Study |
|-------|--------------|
| sample vs run vs observe | When to use which |
| Async execution | sample_async, run_async, observe_async |
| Get State | Extract full state vector |
| Return Custom Data Types | Return structs from run |
| Qubit Visualization | Draw qubit states |
| Kernel Visualization | Draw circuit diagram |

**Deliverable:** QFT (Quantum Fourier Transform) circuit — visualized and sampled.

---

## Month 2 — GPU Acceleration + Algorithms (Weeks 5–8)

### Week 5 — Moving to GPU

**Goal:** Understand how CUDA-Q uses the GPU and why it matters.

| Topic | What to Study |
|-------|--------------|
| From CPU to GPU | nvidia-sim:statevec_fp32/fp64 targets |
| cuStateVec backend | What it accelerates |
| Running on a GPU | --target nvidia in Python |
| Performance differences | CPU vs GPU for 20-30 qubit circuits |

**Hardware needed here:** NVIDIA GPU (GTX 1060 minimum, RTX 3080+ recommended).  
If no local GPU: use **Google Colab (free T4 GPU)** or **NVIDIA LaunchPad** (free).

```python
# Run on GPU simulator
cudaq.set_target("nvidia")   # uses cuStateVec on GPU
counts = cudaq.sample(bell)
```

**Deliverable:** Benchmark same circuit on CPU vs GPU. Record speedup numbers.

---

### Week 6 — Variational Algorithms (VQE / QAOA)

**Goal:** Implement the two most important near-term quantum algorithms.

| Algorithm | Use Case |
|-----------|---------|
| VQE (Variational Quantum Eigensolver) | Find ground state energy of molecules |
| QAOA (Quantum Approximate Optimization) | Combinatorial optimization (MaxCut) |

**What to study:**
- Computing Expectation Values (`cudaq.observe`)
- SpinOperator / Hamiltonian construction
- Optimizers & Gradients (Adam, SPSA, gradient-free COBYLA)
- Parameter shift gradients

```python
# VQE sketch
hamiltonian = cudaq.SpinOperator(...)

@cudaq.kernel
def ansatz(theta: float):
    q = cudaq.qvector(2)
    ry(theta, q[0])
    cx(q[0], q[1])

optimizer = cudaq.optimizers.Adam()
result = cudaq.vqe(ansatz, hamiltonian, optimizer, parameter_count=1)
print("Ground state energy:", result.energy)
```

**Deliverable:** VQE for H₂ molecule energy. QAOA for 4-node MaxCut.

---

### Week 7 — Multi-GPU Workflows

**Goal:** Scale beyond a single GPU.

| Topic | What to Study |
|-------|--------------|
| mgpu — Pooling multiple GPUs | Simulate more qubits by sharing memory |
| mqpu — Multiple QPUs in parallel | Run parameter sweeps simultaneously |
| Batching Hamiltonian Terms | Distribute Hamiltonian evaluation |
| Circuit Batching | Submit many circuits at once |
| Parallelizing across Multiple Processors | cudaq.parallel |

```python
# mqpu — parallel parameter sweep
cudaq.set_target("nvidia-mqpu")
# Each GPU evaluates a different parameter value simultaneously
```

**Deliverable:** VQE with parameter sweep parallelized across multiple GPUs (or cloud).

---

### Week 8 — Noisy Simulations + Error Mitigation

**Goal:** Simulate realistic quantum hardware noise.

| Topic | What to Study |
|-------|--------------|
| Noisy Simulations | Add depolarizing, bit-flip, phase-flip noise |
| Noise channels | Kraus operators |
| Readout Error Mitigation | Correct measurement errors |
| Detector Error Models | For QEC research |
| Pre-Trajectory Sampling | Batch execution with noise |

**Deliverable:** Bell state with and without noise — compare QBER and fidelity.

---

## Month 3 — Real Applications + Hardware (Weeks 9–12)

### Week 9 — Quantum Chemistry Application

**Goal:** Build a real quantum chemistry pipeline end-to-end.

| Topic | What to Study |
|-------|--------------|
| Generating the electronic Hamiltonian | From molecular geometry |
| UCCSD Wavefunction ansatz | Standard chemistry ansatz |
| VQE for H₂ molecule | Full pipeline |
| Multi-reference Krylov Algorithm | Advanced ground-state method |

**Deliverable:** Full H₂ molecule ground-state energy calculation using VQE + UCCSD.

---

### Week 10 — Quantum Optimization + Cryptography-Adjacent

**Goal:** Apply CUDA-Q to optimization and security-relevant problems.

| Application | Description |
|-------------|-------------|
| Shor's Algorithm | Integer factoring — directly relevant to post-quantum crypto |
| Quantum Volume | Measure quality of a quantum computer |
| QAOA for optimization | Graph problems |
| Spin-Hamiltonian Simulation | Condensed matter physics |

**Deliverable:** Shor's algorithm for small integers (e.g. factor 15) + quantum volume measurement.

---

### Week 11 — Real Quantum Hardware Providers

**Goal:** Submit a job to a real QPU.

| Provider | Technology | Access |
|----------|-----------|--------|
| **IonQ** | Trapped ion | Cloud API, free tier available |
| **Quantinuum** | Trapped ion | Cloud API, academic access |
| **Amazon Braket** | Multiple (IonQ, Rigetti, QuEra) | AWS account |
| **IQM** | Superconducting | European cloud |
| **QuEra** | Neutral atom | Amazon Braket |

```python
# Submit to IonQ via CUDA-Q
import os
os.environ["IONQ_API_KEY"] = "your_key_here"
cudaq.set_target("ionq", machine="simulator")   # or machine="aria-1"
counts = cudaq.sample(bell, shots_count=1000)
```

**Deliverable:** Bell state run on IonQ cloud simulator + real QPU (if budget allows).

---

### Week 12 — Final Project + Presentation

**Goal:** Build, document, and present one complete application.

**Suggested final projects (pick one):**

| Option | Description | Relevance to Boss |
|--------|-------------|-------------------|
| QKD + CUDA-Q BB84 simulator | Simulate BB84 with noise on GPU | Directly links to existing QKD work |
| Quantum-accelerated key search | Grover's algorithm for search | Post-quantum security relevance |
| H₂ VQE Dashboard | Web UI showing energy convergence | Demonstrates full-stack skills |
| Quantum Volume benchmarker | Test and compare QPU backends | Hardware evaluation tool |

**Deliverable:** Code in repository + README + short presentation (5 slides).

---

## Hardware Dependencies

### Minimum (CPU only — no GPU)

| Component | Spec |
|-----------|------|
| CPU | Any modern x86-64 (Intel/AMD) |
| RAM | 8 GB minimum, 16 GB recommended |
| OS | Ubuntu 22.04 / 24.04 (recommended), macOS, Windows WSL2 |
| Python | 3.10+ |
| Storage | 5 GB |

> All of Months 1–2 basics can be done on CPU simulation.

---

### Recommended (GPU simulation)

| Component | Spec | Notes |
|-----------|------|-------|
| NVIDIA GPU | RTX 3070 / RTX 4080 / A100 | Ampere architecture or newer preferred |
| VRAM | 8 GB minimum, 16 GB+ for 30+ qubits | Each qubit doubles memory: 30 qubits = 16 GB |
| CUDA Toolkit | 11.8 or 12.x | Must match GPU driver |
| RAM | 32 GB | For hybrid classical-quantum workflows |
| OS | Ubuntu 22.04 | Best CUDA support |

> Simulating N qubits requires 2^N complex amplitudes.  
> 30 qubits = 2³⁰ × 16 bytes = **16 GB VRAM**  
> 33 qubits = **128 GB VRAM** — requires multi-GPU (mgpu)

---

### Cloud GPU Options (No Local GPU Needed)

| Platform | GPU | Cost | Notes |
|----------|-----|------|-------|
| **Google Colab** | T4 (16 GB) | Free | Best free option, install CUDA-Q via pip |
| **NVIDIA LaunchPad** | A100 | Free (apply) | https://www.nvidia.com/en-us/launchpad/ |
| **AWS EC2 p3.2xlarge** | V100 (16 GB) | ~$3/hr | On-demand |
| **Azure NC6s_v3** | V100 | ~$3/hr | On-demand |
| **Lambda Cloud** | A100 (40 GB) | ~$1.10/hr | Cheapest A100 |

---

### Real QPU Hardware (Month 3)

| Provider | Technology | Qubits | Access Method | Cost |
|----------|-----------|--------|---------------|------|
| **IonQ Aria** | Trapped ion | 25 | Cloud API | Pay per shot |
| **IonQ Forte** | Trapped ion | 36 | Cloud API | Pay per shot |
| **Quantinuum H2** | Trapped ion | 56 | Cloud API | Academic access available |
| **Amazon Braket** | Multiple QPUs | varies | AWS account | Pay per task |
| **QuEra Aquila** | Neutral atom | 256 | Amazon Braket | Pay per shot |
| **IQM Resonance** | Superconducting | 20 | Cloud API | European access |

> You do not need to own any QPU. All are accessed via cloud APIs. CUDA-Q handles the submission automatically.

---

## Software Dependencies

### Core Installation

```bash
# Option 1 — pip (CPU + GPU simulation)
pip install cudaq

# Option 2 — Docker (recommended for reproducibility)
docker pull ghcr.io/nvidia/cuda-quantum:latest
docker run -it --gpus all ghcr.io/nvidia/cuda-quantum:latest

# Option 3 — from source (advanced)
git clone https://github.com/NVIDIA/cuda-quantum.git
```

### Python Package Dependencies

```bash
pip install cudaq              # core CUDA-Q
pip install numpy              # numerical operations
pip install scipy              # optimizers, linear algebra
pip install matplotlib         # plotting results
pip install openfermion         # quantum chemistry Hamiltonians
pip install pyscf              # molecular integrals for chemistry
pip install networkx           # graph problems (QAOA)
pip install jupyter            # notebooks for exploration
pip install pandas             # data handling for results
```

### For GPU Simulation

```bash
# CUDA Toolkit (Ubuntu)
wget https://developer.download.nvidia.com/compute/cuda/12.3.0/local_installers/cuda_12.3.0_545.23.06_linux.run
sudo sh cuda_12.3.0_545.23.06_linux.run

# Verify GPU is detected
python3 -c "import cudaq; print(cudaq.get_targets())"
```

### For Real QPU Access

```bash
# IonQ
export IONQ_API_KEY="your_key"
cudaq.set_target("ionq", machine="simulator")

# Quantinuum
export QUANTINUUM_USER="your_email"
export QUANTINUUM_PASSWD="your_password"
cudaq.set_target("quantinuum", machine="H1-1E")  # emulator

# Amazon Braket
pip install amazon-braket-sdk
# Configure AWS credentials
aws configure
cudaq.set_target("braket", machine="arn:aws:braket:::device/quantum-simulator/amazon/sv1")
```

### Version Matrix

| Component | Version |
|-----------|---------|
| Python | 3.10, 3.11, 3.12 |
| CUDA-Q | 0.10.0+ (latest stable) |
| CUDA Toolkit | 11.8 or 12.x |
| NVIDIA Driver | 525.85.12+ |
| GCC | 11+ (for C++ mode) |
| Ubuntu | 22.04 LTS |

---

## 3 Applications to Build (with Full Dependencies)

### Application 1 — VQE Molecular Energy Calculator
**What:** Calculate ground state energy of H₂, LiH molecules  
**Why relevant:** Quantum chemistry, drug discovery, materials science  
**Hardware:** NVIDIA GPU (RTX 3070+) or Google Colab T4  
**Software:** `cudaq`, `openfermion`, `pyscf`, `matplotlib`  
**CUDA-Q topics used:** observe, SpinOperator, VQE, Adam optimizer, multi-GPU batching  
**Deliverable:** Web dashboard showing energy convergence curve

---

### Application 2 — Shor's Algorithm Visualizer
**What:** Factor integers using quantum phase estimation  
**Why relevant:** Directly demonstrates threat to RSA — connects to post-quantum work  
**Hardware:** CPU sufficient for small N; GPU for N > 15  
**Software:** `cudaq`, `numpy`, `matplotlib`  
**CUDA-Q topics used:** QFT kernel, controlled-U gates, sample, mid-circuit measurement  
**Deliverable:** Interactive tool — input integer, see quantum factoring steps

---

### Application 3 — BB84 QKD Noise Simulation on GPU
**What:** Simulate BB84 with realistic quantum channel noise using CUDA-Q  
**Why relevant:** Directly extends current QKD + ML-DSA work in this repo  
**Hardware:** NVIDIA GPU for scale; CPU works for small simulations  
**Software:** `cudaq`, `numpy`, `matplotlib`, custom BB84 kernel  
**CUDA-Q topics used:** noisy simulation, Kraus noise channels, sample, state fidelity  
**Deliverable:** QBER vs noise level plot; eavesdropper detection demo

---

## Week-by-Week Summary Table

| Week | Topic | Deliverable |
|------|-------|-------------|
| 1 | Install + first kernel | Bell state running |
| 2 | Kernels, gates, parameterization | Parameterized rotation kernel |
| 3 | Measurements, mid-circuit logic | Teleportation circuit |
| 4 | Execution modes + visualization | QFT circuit visualized |
| 5 | GPU acceleration | CPU vs GPU benchmark |
| 6 | VQE + QAOA | H₂ energy, MaxCut solved |
| 7 | Multi-GPU workflows | Parallel VQE sweep |
| 8 | Noisy simulation | Bell state with noise |
| 9 | Quantum chemistry pipeline | H₂ VQE full pipeline |
| 10 | Shor's algorithm | Factor 15 on quantum circuit |
| 11 | Real QPU submission | Bell state on IonQ cloud |
| 12 | Final project + presentation | Full application in repo |

---

## Resources

| Resource | Link |
|----------|------|
| CUDA-Q Official Docs | https://nvidia.github.io/cuda-quantum/latest |
| CUDA-Q GitHub | https://github.com/NVIDIA/cuda-quantum |
| CUDA-Q Academic | https://www.nvidia.com/en-us/solutions/quantum-computing/cuda-q-academic |
| NVIDIA LaunchPad (free GPU) | https://www.nvidia.com/en-us/launchpad |
| Google Colab (free T4) | https://colab.research.google.com |
| IonQ Cloud | https://cloud.ionq.com |
| Quantinuum Portal | https://um.qapi.quantinuum.com |
| Amazon Braket | https://aws.amazon.com/braket |
| OpenFermion docs | https://quantumai.google/openfermion |

---

## Cost Estimate

| Item | Cost |
|------|------|
| CUDA-Q software | Free (open source) |
| Google Colab GPU (Months 1–2) | Free |
| IonQ simulator access | Free |
| IonQ real QPU (Week 11, 100 shots) | ~$10–$50 |
| Amazon Braket (optional) | ~$0.30/task + $0.00035/shot |
| NVIDIA LaunchPad | Free (apply at nvidia.com/launchpad) |
| **Total minimum** | **$0 (simulation only)** |
| **Total with real QPU** | **~$50–$100** |

---

*Content paraphrased from NVIDIA CUDA-Q documentation and developer blogs for compliance with licensing restrictions. Sources: [nvidia.github.io/cuda-quantum](https://nvidia.github.io/cuda-quantum/latest), [developer.nvidia.com](https://developer.nvidia.com/cuda-q)*
