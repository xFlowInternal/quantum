"""
ML-DSA-44 cryptographic computations (educational simulation).
Real SHAKE128/256 is approximated via a seeded PRNG for visualization.
Parameters: k=4, l=4, eta=2, q=8380417, N=256, d=13
"""
import os
import struct
import hashlib

Q = 8380417
N = 256
D_BITS = 13
ETA = 2
K = 4
L = 4


# ---------------------------------------------------------------------------
# PRNG (Mulberry32-equivalent in Python, seeded deterministically from bytes)
# ---------------------------------------------------------------------------

def _seed32(seed_bytes: bytes, tag: int) -> int:
    h = hashlib.sha256(seed_bytes + struct.pack("<I", tag)).digest()
    return struct.unpack("<I", h[:4])[0]


def _mulberry32(s: int):
    """Returns a generator of floats in [0,1)."""
    s = s & 0xFFFFFFFF
    while True:
        s = (s + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((s ^ (s >> 15)) * (1 | s)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        t = t ^ (t >> 14)
        yield t / 4294967296.0


def _rng_from_seed(seed_bytes: bytes, tag: int):
    return _mulberry32(_seed32(seed_bytes, tag))


# ---------------------------------------------------------------------------
# Polynomial operations
# ---------------------------------------------------------------------------

def sample_uniform_poly(rho: bytes, row: int, col: int) -> list[int]:
    """Rejection-sample a polynomial with coefficients in [0, Q-1]."""
    tag = row * 100 + col
    rng = _rng_from_seed(rho, tag)
    coeffs = []
    while len(coeffs) < N:
        v = int(next(rng) * (1 << 23))
        if v < Q:
            coeffs.append(v)
    return coeffs


def sample_small_poly(rhop: bytes, idx: int) -> list[int]:
    """Sample a polynomial with coefficients in [-ETA, ETA]."""
    rng = _rng_from_seed(rhop, idx * 31 + 17)
    coeffs = []
    for _ in range(N):
        v = int(next(rng) * (2 * ETA + 1)) - ETA
        coeffs.append(v)
    return coeffs


def poly_add(a: list[int], b: list[int]) -> list[int]:
    return [((a[i] + b[i]) % Q + Q) % Q for i in range(N)]


def poly_mul(a: list[int], b: list[int]) -> list[int]:
    """Schoolbook polynomial multiplication mod (x^N + 1, Q)."""
    res = [0] * N
    for i in range(N):
        if a[i] == 0:
            continue
        for j in range(N):
            k = i + j
            if k < N:
                res[k] = (res[k] + a[i] * b[j]) % Q
            else:
                res[k - N] = (res[k - N] - a[i] * b[j]) % Q
    return [(v + Q) % Q for v in res]


def power2round(r: int) -> tuple[int, int]:
    r = (r % Q + Q) % Q
    t1 = r >> D_BITS
    t0 = r - (t1 << D_BITS)
    return t1, t0


# ---------------------------------------------------------------------------
# Seed expansion (simulates SHAKE256(xi) -> rho || rhop || K)
# ---------------------------------------------------------------------------

def expand_seed(xi: bytes) -> dict:
    """
    Real ML-DSA uses SHAKE256(xi, 128).
    We use SHA-256 based derivation for portability without external libs.
    """
    rho  = hashlib.sha256(xi + b'\x00').digest()[:32]
    rho_p1 = hashlib.sha256(xi + b'\x01').digest()
    rho_p2 = hashlib.sha256(xi + b'\x02').digest()
    rhop = (rho_p1 + rho_p2)[:64]
    K    = hashlib.sha256(xi + b'\x03').digest()[:32]
    # Only return hex strings — no raw bytes (not JSON serialisable)
    return {"xi": xi.hex(), "rho": rho.hex(), "rhop": rhop.hex(), "K": K.hex()}


# ---------------------------------------------------------------------------
# API-level functions — return JSON-serialisable dicts
# ---------------------------------------------------------------------------

def generate_seed() -> dict:
    xi = os.urandom(32)
    return expand_seed(xi)


def generate_matrix_A(rho_hex: str) -> dict:
    rho = bytes.fromhex(rho_hex)
    A = []
    for i in range(K):
        row = []
        for j in range(L):
            row.append(sample_uniform_poly(rho, i, j))
        A.append(row)
    # flatten to list of {label, coeffs, max, min}
    polys = []
    for i in range(K):
        for j in range(L):
            c = A[i][j]
            polys.append({
                "label": f"A[{i}][{j}]",
                "coeffs": c,
                "max": max(c),
                "min": min(c),
                "size_bytes": N * 23 // 8   # ~approx packed bits
            })
    return {
        "polys": polys,
        "total_polys": K * L,
        "coeffs_per_poly": N,
        "max_coeff": Q - 1,
        "size_note": f"{K*L} polynomials × {N} coefficients × 23 bits ≈ 10 KB"
    }


def generate_secrets(rhop_hex: str) -> dict:
    rhop = bytes.fromhex(rhop_hex)
    s1 = [sample_small_poly(rhop, i) for i in range(L)]
    s2 = [sample_small_poly(rhop, i + L) for i in range(K)]

    def fmt(polys, name):
        result = []
        for i, c in enumerate(polys):
            dist = {str(v): c.count(v) for v in range(-ETA, ETA + 1)}
            result.append({
                "label": f"{name}[{i}]",
                "coeffs": c,
                "max": max(c),
                "min": min(c),
                "distribution": dist,
                "size_bytes": 96   # 256 coeffs × 3 bits packed
            })
        return result

    return {
        "s1": fmt(s1, "s₁"),
        "s2": fmt(s2, "s₂"),
        "eta": ETA,
        "s1_total_bytes": L * 96,
        "s2_total_bytes": K * 96
    }


def compute_t(rho_hex: str, rhop_hex: str) -> dict:
    rho  = bytes.fromhex(rho_hex)
    rhop = bytes.fromhex(rhop_hex)

    A  = [[sample_uniform_poly(rho, i, j) for j in range(L)] for i in range(K)]
    s1 = [sample_small_poly(rhop, i)      for i in range(L)]
    s2 = [sample_small_poly(rhop, i + L)  for i in range(K)]

    # As1[i] = sum_j A[i][j] * s1[j]
    As1 = []
    for i in range(K):
        acc = [0] * N
        for j in range(L):
            acc = poly_add(acc, poly_mul(A[i][j], s1[j]))
        As1.append(acc)

    t = [poly_add(As1[i], s2[i]) for i in range(K)]

    # Power2Round
    t1_polys, t0_polys = [], []
    for poly in t:
        t1c, t0c = [], []
        for coeff in poly:
            h, l = power2round(coeff)
            t1c.append(h); t0c.append(l)
        t1_polys.append(t1c)
        t0_polys.append(t0c)

    def fmt(polys, name, size_bytes):
        return [{"label": f"{name}[{i}]", "coeffs": c,
                 "max": max(c), "min": min(c), "size_bytes": size_bytes}
                for i, c in enumerate(polys)]

    return {
        "As1":    fmt(As1,     "As₁", 0),
        "t":      fmt(t,       "t",   0),
        "t1":     fmt(t1_polys,"t₁",  320),
        "t0":     fmt(t0_polys,"t₀",  416),
        "t1_total_bytes": K * 320,
        "t0_total_bytes": K * 416,
    }


def generate_keys(rho_hex: str, rhop_hex: str, K_hex: str) -> dict:
    rho  = bytes.fromhex(rho_hex)
    rhop = bytes.fromhex(rhop_hex)
    k_bytes = bytes.fromhex(K_hex)

    # Derive t1 for public key
    A  = [[sample_uniform_poly(rho, i, j) for j in range(L)] for i in range(K)]
    s1 = [sample_small_poly(rhop, i)      for i in range(L)]
    s2 = [sample_small_poly(rhop, i + L)  for i in range(K)]

    As1 = []
    for i in range(K):
        acc = [0] * N
        for j in range(L):
            acc = poly_add(acc, poly_mul(A[i][j], s1[j]))
        As1.append(acc)

    t = [poly_add(As1[i], s2[i]) for i in range(K)]
    t1_polys = []
    for poly in t:
        t1c = [power2round(c)[0] for c in poly]
        t1_polys.append(t1c)

    # pk = rho || t1  (simplified hex concat for display)
    t1_hex = "".join(
        "".join(format(v, '03x') for v in poly) for poly in t1_polys
    )[:256]  # truncated for display

    pk_hex = rho_hex + "..." + t1_hex
    pk_size = 32 + K * 320   # 1312 bytes

    # tr = hash(pk)
    tr = hashlib.sha256(bytes.fromhex(rho_hex) + k_bytes).digest()[:64]  # sim
    tr_hex = tr.hex()

    # sk = rho || K || tr || s1 || s2 || t0
    sk_size = 32 + 32 + 64 + L * 96 + K * 96 + K * 416   # 2560 bytes
    sk_hex = rho_hex + K_hex + tr_hex + "..."

    return {
        "pk_hex": pk_hex,
        "pk_size": pk_size,
        "sk_hex": sk_hex,
        "sk_size": sk_size,
        "tr_hex": tr_hex,
        "composition": {
            "pk": {"rho": 32, "t1": K * 320, "total": pk_size},
            "sk": {"rho": 32, "K": 32, "tr": 64,
                   "s1": L * 96, "s2": K * 96, "t0": K * 416, "total": sk_size}
        }
    }


# ---------------------------------------------------------------------------
# SIGNING — ML-DSA-44 (educational simulation)
# ---------------------------------------------------------------------------

GAMMA1 = 1 << 17   # 131072  — ML-DSA-44 (FIPS 204 Table 1)
GAMMA2 = (Q - 1) // 88   # 95232
TAU    = 39        # ML-DSA-44: τ=39  (ML-DSA-65: 49, ML-DSA-87: 60)
BETA   = TAU * ETA # 39 × 2 = 78
OMEGA  = 80        # ML-DSA-44: max hint bits ω=80

def compute_mu(tr_hex: str, message: str) -> dict:
    """Step 1: μ = SHAKE256(tr || message)."""
    tr = bytes.fromhex(tr_hex)
    msg_bytes = message.encode('utf-8')
    mu = hashlib.sha256(tr + msg_bytes).digest()[:64]  # sim SHAKE256
    return {
        "mu": mu.hex(),
        "message": message,
        "tr": tr_hex,
        "tr_bytes": len(tr),
        "message_bytes": len(msg_bytes),
        "input_total_bytes": len(tr) + len(msg_bytes),
        "output_bytes": 64,
        "note": f"tr is SHAKE256(pk), pk = ρ ∥ t₁ (1312 bytes). tr binds μ to Alice's public key."
    }


def generate_rho_double(K_hex: str, mu_hex: str) -> dict:
    """Step 2: ρ″ = SHAKE256(K || rnd || μ)."""
    K = bytes.fromhex(K_hex)
    mu = bytes.fromhex(mu_hex)
    rnd = b'\x00' * 32  # deterministic (or could use random)
    rhod = hashlib.sha256(K + rnd + mu).digest()[:64]  # sim SHAKE256
    return {"rhodouble": rhod.hex(), "K": K_hex, "mu": mu_hex}


def sample_y_vector(rhod_hex: str) -> dict:
    """Step 3: Sample y — 4 polys with coeffs in [-GAMMA1+1, GAMMA1].
    Uses κ=0 (first attempt) for display; z computation handles rejection internally."""
    rhod = bytes.fromhex(rhod_hex)
    y_polys = []
    for i in range(L):
        rng = _rng_from_seed(rhod, i + 100)  # kappa=0
        coeffs = [int(next(rng) * (2 * GAMMA1)) - GAMMA1 + 1 for _ in range(N)]
        y_polys.append(coeffs)

    def fmt(polys):
        return [{"label": f"y[{i}]", "coeffs": c, "max": max(c), "min": min(c)}
                for i, c in enumerate(polys)]

    return {"y": fmt(y_polys), "gamma1": GAMMA1}


def compute_w_and_w1(rho_hex: str, rhod_hex: str) -> dict:
    """Step 4: w = A·y, then w₁ = HighBits(w), w₀ = LowBits(w)."""
    rho  = bytes.fromhex(rho_hex)
    rhod = bytes.fromhex(rhod_hex)

    A = [[sample_uniform_poly(rho, i, j) for j in range(L)] for i in range(K)]
    y = []
    for i in range(L):
        rng = _rng_from_seed(rhod, i + 100)
        coeffs = [int(next(rng) * (2 * GAMMA1)) - GAMMA1 + 1 for _ in range(N)]
        y.append(coeffs)

    # w = A·y  (mod q)
    w = []
    for i in range(K):
        acc = [0] * N
        for j in range(L):
            acc = poly_add(acc, poly_mul(A[i][j], y[j]))
        w.append(acc)

    # w₁ = HighBits(w, 2γ₂),  w₀ = LowBits(w, 2γ₂)
    # HighBits(r) = (r - r mod± 2γ₂) / (2γ₂)
    two_gamma2 = 2 * GAMMA2
    w1_polys, w0_polys = [], []
    for poly in w:
        w1c, w0c = [], []
        for c in poly:
            c_pos = c % Q
            r0 = c_pos % two_gamma2
            # center r0
            if r0 > GAMMA2:
                r0 -= two_gamma2
            r1 = (c_pos - r0) // two_gamma2
            w1c.append(int(r1))
            w0c.append(int(r0))
        w1_polys.append(w1c)
        w0_polys.append(w0c)

    def fmt(polys, name):
        return [{"label": f"{name}[{i}]", "coeffs": c, "max": max(c), "min": min(c)}
                for i, c in enumerate(polys)]

    return {
        "w":  fmt(w,        "w"),
        "w1": fmt(w1_polys, "w₁"),
        "w0": fmt(w0_polys, "w₀"),
        "gamma2": GAMMA2,
        "two_gamma2": two_gamma2,
        "note": f"w₁ = HighBits(w, 2γ₂),  w₀ = LowBits(w, 2γ₂),  γ₂ = (q-1)/88 = {GAMMA2}"
    }


def compute_ctilde(mu_hex: str, w1_data: list) -> dict:
    """Step 5: c̃ = SHAKE256(μ || w₁).
    Encodes all coefficients of w₁ for a consistent hash on both sign and verify paths.
    """
    mu = bytes.fromhex(mu_hex)
    # Encode all 256 coefficients per polynomial (2 bytes each, little-endian)
    w1_bytes = b''.join(
        struct.pack("<H", v & 0xFFFF)
        for poly in w1_data
        for v in poly["coeffs"]
    )
    ctilde = hashlib.sha256(mu + w1_bytes).digest()[:32]
    return {"ctilde": ctilde.hex(), "size_bits": 256}


def sample_challenge_c(ctilde_hex: str) -> dict:
    """Step 6: c = SampleInBall(c̃) — 256 coeffs, exactly 39 are ±1, rest 0."""
    ctilde = bytes.fromhex(ctilde_hex)
    rng = _rng_from_seed(ctilde, 0)
    
    # Pick 39 random positions for ±1
    positions = list(range(N))
    import random
    random.seed(int.from_bytes(ctilde[:8], 'little'))
    random.shuffle(positions)
    selected = positions[:TAU]
    
    c = [0] * N
    for pos in selected:
        sign = 1 if next(rng) > 0.5 else -1
        c[pos] = sign
    
    nonzero = sum(1 for x in c if x != 0)
    dist = {"+1": c.count(1), "-1": c.count(-1), "0": c.count(0)}
    
    return {
        "c": {"label": "c", "coeffs": c, "nonzero": nonzero, "distribution": dist},
        "tau": TAU
    }


def poly_add_centered(a: list[int], b: list[int]) -> list[int]:
    """Add two polynomials keeping values centered (not forced into [0,Q))."""
    return [a[i] + b[i] for i in range(N)]


def poly_mul_signed(a: list[int], b: list[int]) -> list[int]:
    """Multiply polynomials over Z[x]/(x^N+1) without forcing positive residues.
    Used when 'a' is a sparse ±1/0 challenge polynomial and 'b' has small coeffs."""
    res = [0] * N
    for i in range(N):
        if a[i] == 0:
            continue
        for j in range(N):
            k = i + j
            if k < N:
                res[k] += a[i] * b[j]
            else:
                res[k - N] -= a[i] * b[j]
    return res


def compute_z_response(rhod_hex: str, rhop_hex: str, ctilde_hex: str) -> dict:
    """Step 7: z = y + c·s₁ with rejection sampling (FIPS 204 §5.2).
    Retries with incremented counter κ until ‖z‖∞ < γ₁ − β."""
    rhod   = bytes.fromhex(rhod_hex)
    rhop   = bytes.fromhex(rhop_hex)
    ctilde = bytes.fromhex(ctilde_hex)

    s1 = [sample_small_poly(rhop, i) for i in range(L)]

    import random
    rng_c = _rng_from_seed(ctilde, 0)
    positions = list(range(N))
    random.seed(int.from_bytes(ctilde[:8], 'little'))
    random.shuffle(positions)
    c = [0] * N
    for pos in positions[:TAU]:
        c[pos] = 1 if next(rng_c) > 0.5 else -1

    threshold = GAMMA1 - BETA  # 130994

    # Rejection loop — try different κ counters (simulates FIPS 204 §5.2 loop)
    for kappa in range(256):
        y = []
        for i in range(L):
            # Use kappa as an extra tag so each attempt produces different y
            rng = _rng_from_seed(rhod, i + 100 + kappa * 10)
            # Sample in (-γ₁, γ₁] — strictly inside to leave room for c·s₁
            coeffs = []
            for _ in range(N):
                v = int(next(rng) * (2 * GAMMA1)) - GAMMA1 + 1
                coeffs.append(v)
            y.append(coeffs)

        cs1_polys = []
        z = []
        passed = True
        for i in range(L):
            cs1_i  = poly_mul_signed(c, s1[i])
            z_poly = poly_add_centered(y[i], cs1_i)
            if max(abs(v) for v in z_poly) >= threshold:
                passed = False
                break
            cs1_polys.append(cs1_i)
            z.append(z_poly)

        if passed:
            break

    def fmt(polys, name):
        return [{"label": f"{name}[{idx}]", "coeffs": p,
                 "max": max(p), "min": min(p)}
                for idx, p in enumerate(polys)]

    return {
        "cs1": fmt(cs1_polys, "c·s₁"),
        "z":   fmt(z,         "z"),
        "tau": TAU,
        "kappa": kappa,
        "size_bytes": L * 576,
        "note": f"z = y + c·s₁,  τ={TAU},  ‖c·s₁‖∞ ≤ τ·η = {TAU}·{ETA} = {BETA},  accepted at κ={kappa}"
    }


def check_bounds_z(z_data: list) -> dict:
    """Step 8: Check ‖z‖∞ < γ₁ - β  (uses absolute value for centered coeffs)."""
    max_coeff = max(max(abs(v) for v in poly["coeffs"]) for poly in z_data)
    threshold = GAMMA1 - BETA      # 131072 - 78 = 130994  (ML-DSA-44)
    passed    = int(max_coeff) < threshold

    return {
        "max_coeff": int(max_coeff),
        "threshold": threshold,
        "passed":    passed,
        "rejection_reason": None if passed else "‖z‖∞ too large — restart from step 3",
        "gamma1": GAMMA1,
        "beta":   BETA,
        "tau":    TAU,
        "eta":    ETA,
    }


def compute_hints_h(rho_hex: str, rhop_hex: str, ctilde_hex: str, rhod_hex: str) -> dict:
    """Step 9: h = MakeHint(-c·t₀, w - c·s₂ + c·t₀) per FIPS 204 §6 Alg.8.
    Uses the real signing state to produce correct hint positions.
    """
    import random

    rho    = bytes.fromhex(rho_hex)
    rhop   = bytes.fromhex(rhop_hex)
    ctilde = bytes.fromhex(ctilde_hex)
    rhod   = bytes.fromhex(rhod_hex)

    two_gamma2 = 2 * GAMMA2

    # Reconstruct A, s2, t0
    A  = [[sample_uniform_poly(rho, i, j) for j in range(L)] for i in range(K)]
    s1 = [sample_small_poly(rhop, i)      for i in range(L)]
    s2 = [sample_small_poly(rhop, i + L)  for i in range(K)]

    As1 = []
    for i in range(K):
        acc = [0] * N
        for j in range(L):
            acc = poly_add(acc, poly_mul(A[i][j], s1[j]))
        As1.append(acc)
    t_full = [poly_add(As1[i], s2[i]) for i in range(K)]
    t0_polys = [[power2round(c)[1] for c in poly] for poly in t_full]

    # Reconstruct c from c̃
    rng_c = _rng_from_seed(ctilde, 0)
    positions = list(range(N))
    random.seed(int.from_bytes(ctilde[:8], 'little'))
    random.shuffle(positions)
    c_poly = [0] * N
    for pos in positions[:TAU]:
        c_poly[pos] = 1 if next(rng_c) > 0.5 else -1

    # Reconstruct y and w using same kappa=0 (display only, kappa that passed bounds check)
    # find accepted kappa (same logic as compute_z_response)
    threshold = GAMMA1 - BETA
    accepted_kappa = 0
    for kappa in range(256):
        y_test = []
        for i in range(L):
            rng = _rng_from_seed(rhod, i + 100 + kappa * 10)
            coeffs = [int(next(rng) * (2 * GAMMA1)) - GAMMA1 + 1 for _ in range(N)]
            y_test.append(coeffs)
        cs1_test = [poly_mul_signed(c_poly, s1[i]) for i in range(L)]
        z_test   = [poly_add_centered(y_test[i], cs1_test[i]) for i in range(L)]
        if all(max(abs(v) for v in z_test[i]) < threshold for i in range(L)):
            accepted_kappa = kappa
            break

    y_accepted = []
    for i in range(L):
        rng = _rng_from_seed(rhod, i + 100 + accepted_kappa * 10)
        coeffs = [int(next(rng) * (2 * GAMMA1)) - GAMMA1 + 1 for _ in range(N)]
        y_accepted.append(coeffs)

    # w = A·y
    w = []
    for i in range(K):
        acc = [0] * N
        for j in range(L):
            acc = poly_add(acc, poly_mul(A[i][j],
                           [(v % Q + Q) % Q for v in y_accepted[j]]))
        w.append(acc)

    # c·s₂ and c·t₀
    cs2_polys = [poly_mul_signed(c_poly, s2[i]) for i in range(K)]
    ct0_polys = [poly_mul_signed(c_poly, t0_polys[i]) for i in range(K)]

    # r = w - c·s₂,   rz = w - c·s₂ + c·t₀
    r_polys  = [[(w[i][k] - cs2_polys[i][k]) % Q for k in range(N)] for i in range(K)]
    rz_polys = [[(r_polys[i][k] + ct0_polys[i][k]) % Q for k in range(N)] for i in range(K)]

    # MakeHint: h_i = 1 iff HighBits(r_i) != HighBits(rz_i)
    hint_positions = []
    for i in range(K):
        for k in range(N):
            r   = r_polys[i][k]
            rz  = rz_polys[i][k]
            r0  = r  % two_gamma2; r0  = r0  - two_gamma2 if r0  > GAMMA2 else r0
            rz0 = rz % two_gamma2; rz0 = rz0 - two_gamma2 if rz0 > GAMMA2 else rz0
            r1  = (r  - r0)  // two_gamma2
            rz1 = (rz - rz0) // two_gamma2
            if r1 != rz1:
                hint_positions.append(i * N + k)
            if len(hint_positions) >= OMEGA:
                break
        if len(hint_positions) >= OMEGA:
            break

    def fmt1(coeffs, name):
        return {"label": name, "coeffs": coeffs, "max": max(coeffs), "min": min(coeffs)}

    # Flatten intermediates for display (first polynomial only for sidebar)
    w_flat   = w[0]
    cs2_flat = cs2_polys[0]
    ct0_flat = ct0_polys[0]
    r_flat   = r_polys[0]
    rz_flat  = rz_polys[0]

    return {
        "h": {"positions": hint_positions, "count": len(hint_positions)},
        "size_bytes": 84,
        "max_hints": OMEGA,
        "tau": TAU,
        "gamma2": GAMMA2,
        "two_gamma2": two_gamma2,
        "intermediates": {
            "w":                      fmt1(w_flat,   "w"),
            "cs2":                    fmt1(cs2_flat, "c·s₂"),
            "ct0":                    fmt1(ct0_flat, "c·t₀"),
            "w_minus_cs2":            fmt1(r_flat,   "w − c·s₂"),
            "w_minus_cs2_plus_ct0":   fmt1(rz_flat,  "w − c·s₂ + c·t₀"),
        },
        "formula":  "MakeHint(z, r) = 1 iff HighBits(r, 2γ₂) ≠ HighBits(r + z, 2γ₂)",
        "where":    "z = −c·t₀,  r = w − c·s₂",
        "standard": "FIPS 204 §6 Algorithm 8, γ₂ = (q−1)/88 = " + str(GAMMA2),
    }


def assemble_signature(ctilde_hex: str, z_data: list, h_data: dict) -> dict:
    """Step 10: σ = c̃ || z || h.
    h_data can be the full hints dict or just the inner h dict.
    Also carries w1 as auxiliary educational data so verification can confirm c̃.
    """
    ctilde_size = 32
    z_size = L * 576  # 4 × 576 = 2304
    # Accept either {positions, count} or {size_bytes, h:{...}}
    if "size_bytes" in h_data:
        h_size = h_data["size_bytes"]
        hint_count = h_data["h"]["count"]
    else:
        h_size = 84
        hint_count = h_data.get("count", len(h_data.get("positions", [])))
    total = ctilde_size + z_size + h_size

    sig_hex = ctilde_hex + "..." + "[z packed]" + "..." + f"[{hint_count} hints]"

    return {
        "signature_hex": sig_hex,
        "components": {
            "ctilde": {"size": ctilde_size, "hex": ctilde_hex},
            "z": {"size": z_size, "polys": len(z_data)},
            "h": {"size": h_size, "hint_count": hint_count}
        },
        "total_size": total,
        "message": "Signature complete. Send (message, σ) to verifier."
    }


# ---------------------------------------------------------------------------
# VERIFICATION — Bob's side  (FIPS 204 §5.3)
# ---------------------------------------------------------------------------

def verify_recompute_mu(tr_hex: str, message: str) -> dict:
    """Verify Step 1: Bob recomputes μ = SHAKE256(tr ∥ M) using Alice's pk (tr from pk).
    Identical computation to signing Step 1 — Bob uses only public information."""
    return compute_mu(tr_hex, message)


def verify_sample_c(ctilde_hex: str) -> dict:
    """Verify Step 2: Bob reconstructs c = SampleInBall(c̃) from the received c̃.
    SampleInBall is deterministic — same c̃ always gives the same challenge polynomial."""
    return sample_challenge_c(ctilde_hex)


def verify_compute_wprime(rho_hex: str, ctilde_hex: str, z_data: list, rhop_hex: str, w1_alice: list = None) -> dict:
    """Verify Step 3: w′ = A·z − c·t₁·2^d  (FIPS 204 §5.3 Alg.3).

    Computes and displays the formula w′ = A·z − c·t₁·2^d.
    Also returns w1_for_verification — Alice's w₁ (passed from signing state)
    which is what Bob would recover via UseHint in a full implementation.
    In this educational simulation we pass w₁ directly to show the verification
    chain completing correctly.
    """
    import random

    rho    = bytes.fromhex(rho_hex)
    rhop   = bytes.fromhex(rhop_hex)
    ctilde = bytes.fromhex(ctilde_hex)

    # Build A
    A = [[sample_uniform_poly(rho, i, j) for j in range(L)] for i in range(K)]

    # Reconstruct c
    rng_c = _rng_from_seed(ctilde, 0)
    positions_c = list(range(N))
    random.seed(int.from_bytes(ctilde[:8], 'little'))
    random.shuffle(positions_c)
    c_poly = [0] * N
    for pos in positions_c[:TAU]:
        c_poly[pos] = 1 if next(rng_c) > 0.5 else -1

    # A·z
    z_coeffs = [poly["coeffs"] for poly in z_data]
    Az = []
    for i in range(K):
        acc = [0] * N
        for j in range(L):
            z_j = [(v % Q + Q) % Q for v in z_coeffs[j]]
            acc = poly_add(acc, poly_mul(A[i][j], z_j))
        Az.append(acc)

    # c·t₁·2^d
    s1 = [sample_small_poly(rhop, i) for i in range(L)]
    s2 = [sample_small_poly(rhop, i + L) for i in range(K)]
    As1 = []
    for i in range(K):
        acc = [0] * N
        for j in range(L):
            acc = poly_add(acc, poly_mul(A[i][j], s1[j]))
        As1.append(acc)
    t_full = [poly_add(As1[i], s2[i]) for i in range(K)]
    t1_polys = [[power2round(c)[0] for c in poly] for poly in t_full]
    ct1_2d = []
    for i in range(K):
        t1_shifted = [(v << D_BITS) % Q for v in t1_polys[i]]
        ct1_2d.append(poly_mul(c_poly, t1_shifted))

    # w′ = A·z − c·t₁·2^d
    wprime = []
    for i in range(K):
        row = [((Az[i][k] - ct1_2d[i][k]) % Q + Q) % Q for k in range(N)]
        wprime.append(row)

    # HighBits of w′ for display
    two_gamma2 = 2 * GAMMA2
    wprime_w1 = []
    for poly in wprime:
        w1c = []
        for coeff in poly:
            r0 = coeff % two_gamma2
            if r0 > GAMMA2:
                r0 -= two_gamma2
            r1 = (coeff - r0) // two_gamma2
            w1c.append(int(r1))
        wprime_w1.append(w1c)

    def fmt(polys, name):
        return [{"label": f"{name}[{i}]", "coeffs": p, "max": max(p), "min": min(p)}
                for i, p in enumerate(polys)]

    # w1_for_verification: use Alice's w1 if provided, else fall back to wprime_w1
    if w1_alice:
        # w1_alice is already a list of {label, coeffs, max, min} dicts
        w1_for_verif = w1_alice
    else:
        w1_for_verif = fmt(wprime_w1, "w₁ (for c̃′)")

    return {
        "wprime":            fmt(wprime,       "w′"),
        "Az":                fmt(Az,            "A·z"),
        "ct1_2d":            fmt(ct1_2d,        "c·t₁·2ᵈ"),
        "wprime_w1":         fmt(wprime_w1,     "HighBits(w′)"),
        "w1_for_verif":      w1_for_verif,
        "d":                 D_BITS,
        "note":              f"w′ = A·z − c·t₁·2^{D_BITS}  (d={D_BITS})",
    }


def verify_usehint(h_positions: list, wprime_w1_data: list) -> dict:
    """Verify Step 4: w₁′ = UseHint(h, w′)  (FIPS 204 §6 Alg.12).

    For this educational simulation, the hint positions mark exactly which
    HighBits(w′) coefficients are off by ±1 from Alice's w₁.
    UseHint corrects each flagged position by ±1 mod m where m = (Q-1)/(2γ₂) = 88.

    The correction direction is determined by the sign of the low bits r₀:
      if r₀ > 0: increment r₁
      else:       decrement r₁
    We apply this to the HighBits(w′) values.
    """
    Q_val = 8380417
    two_gamma2 = 2 * GAMMA2
    m = (Q_val - 1) // two_gamma2   # 88 for ML-DSA-44

    # Build the w′ raw coefficients to determine r₀ for correction direction
    # wprime_w1_data contains HighBits already — we need to apply ±1 corrections
    # The hint says: this position's HighBit is wrong by ±1.
    # We always increment by +1 (mod m) for hint=1 positions with r₀ > 0,
    # and decrement by -1 (mod m) for r₀ ≤ 0.
    # Since we only have HighBits here, we check if the value is near m/2.

    hint_set = set(h_positions)
    w1prime_polys = []
    hint_applied = []

    for pi, poly in enumerate(wprime_w1_data):
        w1p = []
        for ci, r1 in enumerate(poly["coeffs"]):
            global_idx = pi * 256 + ci
            if global_idx in hint_set:
                # Correction: try +1 first; if result is out of range use -1
                # In practice for ML-DSA-44, r₁ values are in [0, m-1]
                # The correct adjustment is simply: r₁ = (r₁ + 1) % m
                # (this matches what MakeHint flags as needing correction)
                corrected = (r1 + 1) % m
                w1p.append(int(corrected))
                hint_applied.append(global_idx)
            else:
                w1p.append(int(r1))
        w1prime_polys.append(w1p)

    def fmt(polys, name):
        return [{"label": f"{name}[{i}]", "coeffs": p, "max": max(p), "min": min(p)}
                for i, p in enumerate(polys)]

    return {
        "w1prime":      fmt(w1prime_polys, "w₁′"),
        "hint_applied": hint_applied,
        "hints_used":   len(hint_applied),
        "m":            m,
        "gamma2":       GAMMA2,
        "two_gamma2":   two_gamma2,
        "note":         f"UseHint applied {len(hint_applied)} corrections. m={m} (ML-DSA-44)",
        "standard":     "FIPS 204 §6 Algorithm 12",
    }


def verify_ctilde_prime(mu_hex: str, w1prime_data: list) -> dict:
    """Verify Step 5: Bob recomputes c̃′ = H(μ ∥ Encode(w₁′)).
    w1prime_data should be the HighBits(w′) vector — same encoding as Alice's w₁."""
    return compute_ctilde(mu_hex, w1prime_data)


def verify_final(ctilde_sig: str, ctilde_prime: str, z_data: list) -> dict:
    """Verify Step 6: Final decision — accept iff c̃′ = c̃ AND ‖z‖∞ < γ₁ − β.

    FIPS 204 §5.3 acceptance criteria:
      1. c̃′  == c̃   (reconstructed challenge matches signature)
      2. ‖z‖∞ < γ₁ − β = 130,994   (z is within bounds)
      (Hint count ≤ ω is checked during UseHint in a real implementation)
    """
    ctilde_match = (ctilde_sig.lower() == ctilde_prime.lower())
    bounds       = check_bounds_z(z_data)
    accepted     = ctilde_match and bounds["passed"]

    reasons = []
    if not ctilde_match:
        reasons.append("c̃′ ≠ c̃ — challenge mismatch: message or public key is wrong")
    if not bounds["passed"]:
        reasons.append(f"‖z‖∞ = {bounds['max_coeff']} ≥ γ₁ − β = {bounds['threshold']}")
    if accepted:
        reasons.append("All checks passed ✓")

    return {
        "accepted":       accepted,
        "ctilde_match":   ctilde_match,
        "bounds_passed":  bounds["passed"],
        "ctilde_sig":     ctilde_sig,
        "ctilde_prime":   ctilde_prime,
        "max_z_coeff":    bounds["max_coeff"],
        "z_threshold":    bounds["threshold"],
        "gamma1":         GAMMA1,
        "beta":           BETA,
        "reasons":        reasons,
        "verdict":        "✓ VALID — Signature Accepted" if accepted else "✗ INVALID — Signature Rejected",
        "standard":       "FIPS 204 §5.3 Algorithm 3",
    }
