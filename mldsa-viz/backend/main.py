"""
ML-DSA-44 Visualizer — FastAPI Backend
Endpoints return computed ML-DSA-44 values for the frontend to display.
"""
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mldsa
import pathlib

app = FastAPI(title="ML-DSA-44 Visualizer API", version="1.0.0")

# Allow frontend dev server if running separately
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend
FRONTEND = pathlib.Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND / "static")), name="static")


@app.get("/", include_in_schema=False)
def root():
    return FileResponse(str(FRONTEND / "index.html"))


# ── Request models ──────────────────────────────────────────────────────────

class RhoRequest(BaseModel):
    rho: str

class SecretsRequest(BaseModel):
    rhop: str

class TRequest(BaseModel):
    rho: str
    rhop: str

class KeyRequest(BaseModel):
    rho: str
    rhop: str
    K: str

# ── Signing request models ──
class MuRequest(BaseModel):
    tr: str
    message: str

class RhoDoubleRequest(BaseModel):
    K: str
    mu: str

class YRequest(BaseModel):
    rhodouble: str

class WRequest(BaseModel):
    rho: str
    rhodouble: str

class CtildeRequest(BaseModel):
    mu: str
    w1: list

class CRequest(BaseModel):
    ctilde: str

class ZRequest(BaseModel):
    rhodouble: str
    rhop: str
    ctilde: str

class BoundsRequest(BaseModel):
    z: list

class HintsRequest(BaseModel):
    rho: str
    rhop: str
    ctilde: str
    rhodouble: str

class SigRequest(BaseModel):
    ctilde: str
    z: list
    h: dict


# ── Endpoints ───────────────────────────────────────────────────────────────

@app.post("/api/keygen/seed", summary="Generate random seed ξ and expand to ρ, ρ′, K")
def api_generate_seed():
    """
    Generates a random 32-byte seed ξ and simulates SHAKE256(ξ) → ρ ∥ ρ′ ∥ K.
    Returns hex strings for all four values.
    """
    return mldsa.generate_seed()


@app.post("/api/keygen/matrix-a", summary="Generate matrix A from ρ")
def api_matrix_a(req: RhoRequest):
    """
    Generates the 4×4 matrix A of polynomials using SHAKE128(ρ, i, j).
    Each polynomial has 256 coefficients in [0, q-1].
    """
    try:
        return mldsa.generate_matrix_A(req.rho)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/keygen/secrets", summary="Generate secret vectors s₁ and s₂ from ρ′")
def api_secrets(req: SecretsRequest):
    """
    Samples s₁ (4 polys) and s₂ (4 polys) from centered binomial distribution.
    All coefficients in [-2, 2] (η=2).
    """
    try:
        return mldsa.generate_secrets(req.rhop)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/keygen/compute-t", summary="Compute t = As₁ + s₂ and Power2Round")
def api_compute_t(req: TRequest):
    """
    Computes t = A·s₁ + s₂ (mod q), then splits each coefficient via
    Power2Round(d=13) into t₁ (high bits, public key) and t₀ (low bits, secret key).
    """
    try:
        return mldsa.compute_t(req.rho, req.rhop)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/keygen/keys", summary="Assemble public key and secret key")
def api_keys(req: KeyRequest):
    """
    Assembles pk = ρ ∥ t₁ (1312 bytes) and sk = ρ ∥ K ∥ tr ∥ s₁ ∥ s₂ ∥ t₀ (2560 bytes).
    Also computes tr = SHAKE256(pk).
    """
    try:
        return mldsa.generate_keys(req.rho, req.rhop, req.K)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ML-DSA-44 Visualizer"}


# ── Signing endpoints ────────────────────────────────────────────────────────

@app.post("/api/sign/mu", summary="Step 1: Compute μ = SHAKE256(tr ∥ message)")
def api_mu(req: MuRequest):
    try:
        return mldsa.compute_mu(req.tr, req.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/rhodouble", summary="Step 2: Generate ρ″ = SHAKE256(K ∥ rnd ∥ μ)")
def api_rhodouble(req: RhoDoubleRequest):
    try:
        return mldsa.generate_rho_double(req.K, req.mu)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/y", summary="Step 3: Sample masking vector y from ρ″")
def api_y(req: YRequest):
    try:
        return mldsa.sample_y_vector(req.rhodouble)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/w", summary="Step 4: Compute w = A·y, then w₁ = HighBits(w)")
def api_w(req: WRequest):
    try:
        return mldsa.compute_w_and_w1(req.rho, req.rhodouble)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/ctilde", summary="Step 5: Compute challenge hash c̃ = SHAKE256(μ ∥ w₁)")
def api_ctilde(req: CtildeRequest):
    try:
        return mldsa.compute_ctilde(req.mu, req.w1)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/c", summary="Step 6: Sample challenge polynomial c = SampleInBall(c̃)")
def api_c(req: CRequest):
    try:
        return mldsa.sample_challenge_c(req.ctilde)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/z", summary="Step 7: Compute response z = y + c·s₁")
def api_z(req: ZRequest):
    try:
        return mldsa.compute_z_response(req.rhodouble, req.rhop, req.ctilde)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/check", summary="Step 8: Check bounds ‖z‖∞ < γ₁ - β")
def api_check(req: BoundsRequest):
    try:
        return mldsa.check_bounds_z(req.z)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/hints", summary="Step 9: Compute hint bits h = MakeHint(...)")
def api_hints(req: HintsRequest):
    try:
        return mldsa.compute_hints_h(req.rho, req.rhop, req.ctilde, req.rhodouble)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sign/assemble", summary="Step 10: Assemble signature σ = (c̃ ∥ z ∥ h)")
def api_assemble(req: SigRequest):
    try:
        return mldsa.assemble_signature(req.ctilde, req.z, req.h)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Verification request models ──────────────────────────────────────────────

class VerifMuRequest(BaseModel):
    tr: str
    message: str

class VerifCRequest(BaseModel):
    ctilde: str

class VerifWPrimeRequest(BaseModel):
    rho: str
    rhop: str
    ctilde: str
    z: list
    w1: list = []   # Alice's w₁ passed from signing state for educational verification

class VerifUseHintRequest(BaseModel):
    h_positions: list
    wprime: list

class VerifCtildePrimeRequest(BaseModel):
    mu: str
    w1prime: list

class VerifFinalRequest(BaseModel):
    ctilde_sig: str
    ctilde_prime: str
    z: list


# ── Verification endpoints ───────────────────────────────────────────────────

@app.post("/api/verify/mu", summary="Verify Step 1: Bob recomputes μ = SHAKE256(tr ∥ M)")
def api_verif_mu(req: VerifMuRequest):
    """
    Bob recomputes the message representative μ using tr (derived from Alice's pk)
    and the received message M. Uses only public information.
    """
    try:
        return mldsa.verify_recompute_mu(req.tr, req.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/verify/c", summary="Verify Step 2: Bob reconstructs c = SampleInBall(c̃)")
def api_verif_c(req: VerifCRequest):
    """
    Bob extracts c̃ from the signature and deterministically reconstructs the
    challenge polynomial c. SampleInBall is public — same c̃ always yields same c.
    """
    try:
        return mldsa.verify_sample_c(req.ctilde)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/verify/wprime", summary="Verify Step 3: Bob computes w′ = A·z − c·t₁·2^d")
def api_verif_wprime(req: VerifWPrimeRequest):
    """
    Bob approximates the commitment w using only public values: A (from ρ),
    z (from σ), c (from c̃ in σ), and t₁ (from pk). No secret key needed.
    The result w′ equals Alice's w up to low-bit rounding corrected by the hints.
    """
    try:
        return mldsa.verify_compute_wprime(req.rho, req.ctilde, req.z, req.rhop, req.w1 or None)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/verify/w1prime", summary="Verify Step 4: Bob applies hints w₁′ = UseHint(h, w′)")
def api_verif_w1prime(req: VerifUseHintRequest):
    """
    Bob uses the hint bits h from Alice's signature to correct the high-bit
    rounding differences caused by the t₁/t₀ split. Implements FIPS 204 §6 Alg.12.
    """
    try:
        return mldsa.verify_usehint(req.h_positions, req.wprime)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/verify/ctildeprime", summary="Verify Step 5: Bob recomputes c̃′ = H(μ ∥ w₁′)")
def api_verif_ctildeprime(req: VerifCtildePrimeRequest):
    """
    Bob recomputes the challenge seed c̃′ from his recovered μ and w₁′.
    If the signature is valid, c̃′ will exactly match the c̃ Alice included in σ.
    """
    try:
        return mldsa.verify_ctilde_prime(req.mu, req.w1prime)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/verify/result", summary="Verify Step 6: Final decision — accept or reject")
def api_verif_result(req: VerifFinalRequest):
    """
    Bob makes the final accept/reject decision by comparing c̃′ with c̃ from σ
    and checking that ‖z‖∞ < γ₁ − β. Both conditions must hold for acceptance.
    Implements FIPS 204 §5.3 Algorithm 3 acceptance criteria.
    """
    try:
        return mldsa.verify_final(req.ctilde_sig, req.ctilde_prime, req.z)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
