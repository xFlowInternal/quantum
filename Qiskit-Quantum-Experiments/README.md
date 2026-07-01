# Qiskit Quantum Experiments

Collection of Qiskit-based quantum circuits,linear regression model, QAOA/MaxCut experiments, Bloch-sphere utilities, and supporting analysis scripts used for research and tutorials.

## Highlights
- QAOA MaxCut experiments (Qiskit Runtime)
- linear regression model (HHL)
- Bloch-sphere creation and visualization utilities
- Quantum circuit examples and learning scripts
- Integration-ready examples and notebooks

## Repository structure
- `scripts/` — runnable Python scripts
- `examples/` — short examples to reproduce experiments
- `tests/` — unit tests

## Quick start

1. Clone:
```bash
git clone https://github.com/shahyarmalik/Qiskit-Quantum-Experiments.git
cd Qiskit-Quantum-Experiments
```
If you want to clone a specific branch (e.g., main), you could use:
```bash
git clone --branch main https://github.com/shahyarmalik/Qiskit-Quantum-Experiment
```
2. Create and activate a virtual environment
```bash
python -m venv venv
source venv/bin/activate     # On Linux/Mac
venv\Scripts\activate        # On Windows
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Run experiments
```bash
python scripts/qaoa_experiment.py
```
