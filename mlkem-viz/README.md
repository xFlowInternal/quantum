# ML-KEM-512 Key Generation Visualizer

A professional web-based visualization tool demonstrating the complete ML-KEM-512 (Kyber) key generation and encapsulation/decapsulation process following NIST FIPS 203 standard. This interactive application provides step-by-step visualization of post-quantum cryptography in action.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mlkem-viz.git
   cd mlkem-viz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in your browser**
   
   Navigate to `http://localhost:5173`

5. **Start visualizing!**
   
   Follow the on-screen buttons in order to generate keys, encapsulate, and decapsulate.

## ✨ Features

- **Complete ML-KEM-512 Implementation**: Full key generation, encapsulation, and decapsulation with matrix operations, NTT transforms, and error sampling
- **Step-by-Step Visualization**: Interactive coefficient tables showing all 256 coefficients across multiple computation stages
- **Alice & Bob Interface**: Simulates real-world key exchange between two parties
- **Virtual Scrolling**: Efficient rendering of large datasets using TanStack Table and Virtual
- **Performance Metrics**: Detailed timing breakdown for each cryptographic operation
- **Memory Footprint Analysis**: Precise byte-level memory calculations for all data structures
- **Excel Export**: Multi-worksheet exports with formatted coefficient data and statistics
- **Web Worker Architecture**: Off-main-thread crypto computation for responsive UI
- **Zoom Controls**: Adjustable UI scaling (50% to 200%) for optimal viewing
- **Modern Dark Theme**: Professional UI optimized for viewing numeric data

## 🛠️ Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **TanStack Table** (virtual scrolling)
- **Tailwind CSS** (UI styling)
- **SheetJS/xlsx** (Excel export)
- **Zustand** (state management)
- **Web Crypto API** (CSPRNG)
- **Vitest** (testing)

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start dev server at localhost:5173

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run oxlint for code quality checks

# Testing
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 🏗️ Architecture

```
src/
├── crypto/                    # ML-KEM-512 implementation
│   ├── types.ts               # Type definitions
│   ├── ntt.ts                 # Number Theoretic Transform
│   ├── mlkem.ts               # Core key generation, encap, decap
│   └── worker.ts              # Web Worker wrapper
├── components/                # React UI components
│   ├── AlicePanel.tsx         # Alice's key generation side
│   ├── BobPanel.tsx           # Bob's encapsulation side
│   ├── CoefficientTable.tsx   # Virtual scrolling table
│   ├── StatsDashboard.tsx     # Memory & performance stats
│   └── InfoSection.tsx        # Algorithm overview
├── store/                     # Zustand state management
│   └── keygenStore.ts
└── utils/                     # Excel export utilities
```

## 📐 How It Works

This app simulates a complete ML-KEM-512 key exchange between Alice and Bob:

1. **Alice** generates a key pair (public key + secret key)
2. **Bob** uses Alice's public key to encapsulate a shared secret, producing a ciphertext
3. **Alice** uses her secret key to decapsulate Bob's ciphertext and recover the shared secret
4. Both parties now have the same shared secret — without ever transmitting it

### Cryptographic Steps

| Step | Operation | Details |
|------|-----------|---------|
| 1 | Matrix A generation | 4 polynomials × 256 coefficients, mod q=3329 |
| 2 | Secret vector s | Sampled via Centered Binomial Distribution (η=2) |
| 3 | Error vector e | Sampled via CBD |
| 4 | AS computation | Matrix-vector multiply in NTT domain |
| 5 | t = AS + e | Error addition for LWE hardness |
| 6 | Encoding | t split into 12-bit t1 (high) and t0 (low) |

## 📊 Excel Export Format

When exporting, each worksheet contains:

| Sheet | Contents |
|-------|----------|
| `Matrix_A_16bit` | Full A matrix coefficients |
| `AS_Intermediate_16bit` | Matrix multiplication results |
| `AS+e_Raw_t_16bit` | Results after error addition |
| `t1_Encoded_12bit` | High-bit encoding |
| `t0_Encoded_12bit` | Low-bit encoding |
| `Statistics_Summary` | Memory footprint & performance metrics |

## 🌐 Browser Requirements

| Requirement | Notes |
|-------------|-------|
| Web Crypto API | For CSPRNG (all modern browsers) |
| Web Workers | For off-thread computation |
| ES2020+ | Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+ |

## 🔧 Troubleshooting

**Port already in use?**
```bash
npm run dev -- --port 3000
```

**Node version issues?**
```bash
node --version  # Should be v18+
```

**Dependency issues?**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Further Reading

- [NIST FIPS 203](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf) — ML-KEM standard specification
- [CRYSTALS-Kyber](https://pq-crystals.org/kyber/) — Original Kyber algorithm
- [Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography) — NIST PQC project

## 📄 License

MIT
