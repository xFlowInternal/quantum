# ML-DSA-44 Interactive Visualizer

An interactive, step-by-step web application that visualizes the **ML-DSA-44** (Module Lattice-based Digital Signature Algorithm) as defined in [NIST FIPS 204](https://doi.org/10.6028/NIST.FIPS.204). It walks through key generation, the signing process, and Bob's signature verification — with live computed values at every step.

**GitHub:** https://github.com/muhammadalihussnain/mldsa-guide

---

## What the App Does

| Section | Description |
|---------|-------------|
| Abbreviations & Definitions | Reference table for all ML-DSA terms |
| History of Digital Signatures | Context from RSA to post-quantum |
| ML-DSA-44 Complete Flow Guide | Plain-language explanation of the full protocol |
| Key Generation Flow | Interactive flowchart: ξ → ρ, ρ′, K → A, s₁, s₂, t → pk, sk |
| Signing Process (Alice) | Steps ①–⑩: μ, ρ″, y, w, c̃, c, z, bounds check, hints h, σ |
| Verification Process (Bob) | Steps ⑪–⑯: recompute μ, c, w′, UseHint, c̃′, accept/reject |
| Main Visualization Panel | Live polynomial column vectors for every computed value |

---

## Requirements

- **Python 3.10+**
- **pip**
- A modern browser (Chrome, Firefox, Edge)

---

## Local Deployment

### 1. Clone the repository

```bash
git clone https://github.com/muhammadalihussnain/mldsa-guide.git
cd mldsa-guide
```

### 2. Install Python dependencies

```bash
cd mldsa-app/backend
pip install -r requirements.txt
```

This installs:
- `fastapi==0.111.0`
- `uvicorn==0.29.0`

### 3. Start the server

```bash
uvicorn main:app --port 8000
```

Or with auto-reload during development:

```bash
uvicorn main:app --port 8000 --reload
```

### 4. Open the app

Open your browser and go to:

```
http://localhost:8000
```

The FastAPI backend serves both the API and the frontend from a single process. No separate frontend server is needed.

### Useful URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:8000` | The ML-DSA-44 Visualizer |
| `http://localhost:8000/docs` | Auto-generated Swagger API documentation |
| `http://localhost:8000/api/health` | Health check endpoint |

---

## How to Use the App

Follow the sections in order from top to bottom in the left sidebar.

### Step 1 — Key Generation

1. Expand **🔄 Key Generation Flow**
2. Click **▶ Run Key Generation** — generates random seed ξ and derives ρ, ρ′, K
3. Click **Generate Matrix A** — builds the 4×4 public matrix
4. Click **Show s₁ and s₂** — samples the secret vectors
5. Click **Compute t** — calculates t = As₁ + s₂
6. Click **Show Power2Round** — splits t into t₁ (public) and t₀ (secret)
7. Expand **🔑 Public Key & Secret Key** — view the assembled pk (1312 bytes) and sk (2560 bytes)

The **Main Visualization Panel** on the right shows live polynomial column vectors for each computed value. Scroll horizontally to see all columns.

### Step 2 — Signing

1. Expand **✍️ Signing Process — Alice Signs a Message**
2. Type a message in the text box
3. Click **▶ Start Signing**
4. Work through steps **①–⑩** in order — each button activates after the previous step completes:
   - ① Compute μ
   - ② Generate ρ″
   - ③ Sample y
   - ④ Compute w and w₁
   - ⑤ Compute c̃
   - ⑥ Sample c
   - ⑦ Compute z
   - ⑧ Check bounds
   - ⑨ Compute hints h
   - ⑩ Assemble Signature σ

After step ⑩, the signature σ = (c̃ ∥ z ∥ h) is assembled — 2420 bytes total.

### Step 3 — Verification (Bob)

The verification sections are always visible below the signing sections. Complete all 10 signing steps first, then:

1. Scroll down to **⑪ Bob Recomputes μ** — click the button
2. Continue through **⑫ Reconstruct c**
3. **⑬ Compute w′** — shows A·z − c·t₁·2^d
4. **⑭ Apply Hints** — UseHint corrects w′ → w₁′
5. **⑮ Recompute c̃′** — hashes μ ∥ w₁′
6. **⑯ Verify Signature** — compares c̃′ with c̃ from σ

A green **✓ VALID** or red **✗ INVALID** verdict appears with full details.

> **Note:** Each button shows an inline message in its output box if a required previous step has not been completed yet.

### Sidebar Controls

| Control | Action |
|---------|--------|
| **◀** toggle (left edge) | Collapse/expand the sidebar |
| **▶** toggle (right edge of main panel) | Collapse/expand the visualization panel |
| **A− / A+** buttons (top bar) | Decrease/increase font size |
| **Reset** button | Reset font size to 140% |
| Section header (click) | Expand or collapse any section |

---

## Project Structure

```
mldsa-guide/
├── mldsa-app/
│   ├── backend/
│   │   ├── main.py          # FastAPI app — all API endpoints
│   │   ├── mldsa.py         # ML-DSA-44 cryptographic functions
│   │   └── requirements.txt # Python dependencies
│   └── frontend/
│       ├── index.html       # Main UI — all sidebar sections and main panel
│       └── static/
│           ├── app.js       # Frontend logic — API calls, state, rendering
│           └── style.css    # All styles
├── BB84-QKD-Guide.md        # Guide for BB84 QKD hardware implementation
├── README.md                # This file
└── .gitignore
```

---

## API Endpoints

All endpoints are `POST`. Full interactive docs at `http://localhost:8000/docs`.

### Key Generation

| Endpoint | Description |
|----------|-------------|
| `POST /api/keygen/seed` | Generate random seed ξ → ρ, ρ′, K |
| `POST /api/keygen/matrix-a` | Generate matrix A from ρ |
| `POST /api/keygen/secrets` | Generate s₁, s₂ from ρ′ |
| `POST /api/keygen/compute-t` | Compute t = As₁ + s₂ and Power2Round |
| `POST /api/keygen/keys` | Assemble pk (1312 bytes) and sk (2560 bytes) |

### Signing

| Endpoint | Description |
|----------|-------------|
| `POST /api/sign/mu` | Step ①: μ = SHAKE256(tr ∥ M) |
| `POST /api/sign/rhodouble` | Step ②: ρ″ = SHAKE256(K ∥ rnd ∥ μ) |
| `POST /api/sign/y` | Step ③: sample masking vector y |
| `POST /api/sign/w` | Step ④: w = A·y, w₁ = HighBits(w) |
| `POST /api/sign/ctilde` | Step ⑤: c̃ = SHAKE256(μ ∥ w₁) |
| `POST /api/sign/c` | Step ⑥: c = SampleInBall(c̃, τ=39) |
| `POST /api/sign/z` | Step ⑦: z = y + c·s₁ |
| `POST /api/sign/check` | Step ⑧: check ‖z‖∞ < γ₁ − β |
| `POST /api/sign/hints` | Step ⑨: h = MakeHint(−c·t₀, w − c·s₂ + c·t₀) |
| `POST /api/sign/assemble` | Step ⑩: σ = c̃ ∥ z ∥ h (2420 bytes) |

### Verification

| Endpoint | Description |
|----------|-------------|
| `POST /api/verify/mu` | Step ⑪: Bob recomputes μ = SHAKE256(tr ∥ M) |
| `POST /api/verify/c` | Step ⑫: c = SampleInBall(c̃ from σ) |
| `POST /api/verify/wprime` | Step ⑬: w′ = A·z − c·t₁·2^d |
| `POST /api/verify/w1prime` | Step ⑭: w₁′ = UseHint(h, w′) |
| `POST /api/verify/ctildeprime` | Step ⑮: c̃′ = SHAKE256(μ ∥ w₁′) |
| `POST /api/verify/result` | Step ⑯: accept if c̃′ = c̃ and ‖z‖∞ < γ₁ − β |

---

## Web Deployment

To make the app accessible over a network (e.g., within your office or on a cloud server):

### Option A — Local Network (office/LAN)

Run the server bound to all interfaces:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Anyone on the same network can access it at:

```
http://<your-machine-ip>:8000
```

Find your IP with:

```bash
hostname -I   # Linux
```

### Option B — Cloud Deployment (e.g., Railway, Render, Fly.io)

#### Using Railway (free tier available)

1. Push your code to GitHub (already done)
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click **New Project → Deploy from GitHub repo**
4. Select `muhammadalihussnain/mldsa-guide`
5. Set the **root directory** to `mldsa-app/backend`
6. Set the **start command**:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
7. Railway assigns a public URL automatically

#### Using Render (free tier available)

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repo `muhammadalihussnain/mldsa-guide`
4. Settings:
   - **Root directory:** `mldsa-app/backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**

#### Using a VPS (DigitalOcean, Linode, AWS EC2)

```bash
# On the server
git clone https://github.com/muhammadalihussnain/mldsa-guide.git
cd mldsa-guide/mldsa-app/backend
pip install -r requirements.txt

# Run with a process manager
pip install gunicorn
gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

To keep it running after logout:

```bash
# Using systemd
sudo nano /etc/systemd/system/mldsa.service
```

```ini
[Unit]
Description=ML-DSA-44 Visualizer
After=network.target

[Service]
WorkingDirectory=/home/ubuntu/mldsa-guide/mldsa-app/backend
ExecStart=uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable mldsa
sudo systemctl start mldsa
```

---

## ML-DSA-44 Parameters (FIPS 204 Table 1)

| Parameter | Value | Description |
|-----------|-------|-------------|
| k, ℓ | 4, 4 | Matrix dimensions |
| η | 2 | Secret coefficient bound |
| q | 8,380,417 | Prime modulus |
| d | 13 | Power2Round bits |
| τ | 39 | Challenge polynomial weight |
| γ₁ | 2¹⁷ = 131,072 | Masking bound |
| γ₂ | (q−1)/88 = 95,232 | Rounding range |
| β | τ·η = 78 | Response bound |
| ω | 80 | Max hint bits |
| \|pk\| | 1312 bytes | Public key size |
| \|sk\| | 2560 bytes | Secret key size |
| \|σ\| | 2420 bytes | Signature size |

---

## References

- [NIST FIPS 204 — ML-DSA Standard (August 2024)](https://doi.org/10.6028/NIST.FIPS.204)
- [CSRC FIPS 204 page](https://csrc.nist.gov/pubs/fips/204/final)
- [Dilithium — ML-DSA predecessor](https://pq-crystals.org/dilithium/)
