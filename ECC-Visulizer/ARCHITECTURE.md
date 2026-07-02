# 🏗️ Architecture & Design

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT DEVICES                          │
├─────────────────────────────────┬───────────────────────────────┤
│         Device 1 (Alice)        │        Device 2 (Bob)         │
│  ┌───────────────────────────┐  │  ┌───────────────────────────┐│
│  │   Browser (Chrome/Safari) │  │  │   Browser (Chrome/Safari) ││
│  │                           │  │  │                           ││
│  │  ┌─────────────────────┐  │  │  │  ┌─────────────────────┐ ││
│  │  │   UI Layer          │  │  │  │  │   UI Layer          │ ││
│  │  │  - HTML5 Canvas     │  │  │  │  │  - HTML5 Canvas     │ ││
│  │  │  - Event Handlers   │  │  │  │  │  - Event Handlers   │ ││
│  │  │  - Animations       │  │  │  │  │  - Animations       │ ││
│  │  └─────────────────────┘  │  │  │  └─────────────────────┘ ││
│  │                           │  │  │                           ││
│  │  ┌─────────────────────┐  │  │  │  ┌─────────────────────┐ ││
│  │  │   Crypto Layer      │  │  │  │  │   Crypto Layer      │ ││
│  │  │  - ECC Key Gen      │  │  │  │  │  - ECC Key Gen      │ ││
│  │  │  - ECDH Exchange    │  │  │  │  │  - ECDH Exchange    │ ││
│  │  │  - AES-GCM Encrypt  │  │  │  │  │  - AES-GCM Encrypt  │ ││
│  │  │  - Web Crypto API   │  │  │  │  │  - Web Crypto API   │ ││
│  │  └─────────────────────┘  │  │  │  └─────────────────────┘ ││
│  │                           │  │  │                           ││
│  │  ┌─────────────────────┐  │  │  │  ┌─────────────────────┐ ││
│  │  │   Socket.IO Client  │  │  │  │  │   Socket.IO Client  │ ││
│  │  │  - WebSocket Conn   │  │  │  │  │  - WebSocket Conn   │ ││
│  │  │  - Event Emitters   │  │  │  │  │  - Event Emitters   │ ││
│  │  └─────────────────────┘  │  │  │  └─────────────────────┘ ││
│  └───────────┬───────────────┘  │  └───────────┬───────────────┘│
└──────────────┼──────────────────┴──────────────┼────────────────┘
               │                                  │
               │         WebSocket (WSS)          │
               │                                  │
               └──────────────┬───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   LOAD BALANCER   │
                    │   (Optional)      │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   NODE.JS SERVER  │
                    │                   │
                    │  ┌─────────────┐  │
                    │  │  Express.js │  │
                    │  │  - Routing  │  │
                    │  │  - Static   │  │
                    │  └─────────────┘  │
                    │                   │
                    │  ┌─────────────┐  │
                    │  │ Socket.IO   │  │
                    │  │  - Rooms    │  │
                    │  │  - Events   │  │
                    │  │  - Broadcast│  │
                    │  └─────────────┘  │
                    │                   │
                    │  ┌─────────────┐  │
                    │  │ Connection  │  │
                    │  │ Manager     │  │
                    │  │  - Users Map│  │
                    │  │  - Rooms Map│  │
                    │  └─────────────┘  │
                    └───────────────────┘
```

## Data Flow

### 1. Connection Flow
```
User Opens App
      ↓
Enter Username & Room ID
      ↓
Click "Join Chat"
      ↓
WebSocket Connection Established
      ↓
Emit 'join' event to server
      ↓
Server adds user to room
      ↓
Server broadcasts 'user-joined' to room
      ↓
All clients update peer list
```

### 2. Key Generation Flow
```
User Clicks "Generate Keys"
      ↓
Show Process Visualization
      ↓
Step 1: Generate Private Key (d)
  - Use Web Crypto API
  - Random number in [1, n-1]
  - Progress animation (800ms)
      ↓
Step 2: Compute Public Key (Q = d × G)
  - Scalar multiplication on curve
  - Progress animation (1000ms)
      ↓
Step 3: Display Keys
  - Private key (red box - secret)
  - Public key (green box - shareable)
      ↓
Emit 'keys-generated' to server
      ↓
Server broadcasts to peers
      ↓
Peers see "Keys Generated" notification
```

### 3. Key Exchange Flow
```
Alice                                    Server                                    Bob
─────                                    ──────                                    ───
Generate Keys (dA, QA)                                                Generate Keys (dB, QB)
      ↓                                                                     ↓
Click "Share Public Key"                                          Click "Share Public Key"
      ↓                                                                     ↓
Emit 'share-public-key'                                           Emit 'share-public-key'
  {publicKey: QA, target: Bob}                                      {publicKey: QB, target: Alice}
      ↓                                    ↓                                ↓
                                    Receive both keys
                                           ↓
                                    Route QA → Bob
                                    Route QB → Alice
                                           ↓
Receive QB ←─────────────────────────────┴─────────────────────────→ Receive QA
      ↓                                                                     ↓
Compute Shared Secret:                                            Compute Shared Secret:
  SA = dA × QB                                                      SB = dB × QA
      ↓                                                                     ↓
SA = SB (Same shared secret!)
      ↓                                                                     ↓
Display "Secure Connection"                                       Display "Secure Connection"
```

### 4. Message Flow
```
Alice Types Message: "Hello Bob!"
      ↓
Encrypt with AES-GCM
  - Key: Shared Secret (SA)
  - Generate random IV
  - Output: Ciphertext + IV + Tag
      ↓
Emit 'send-message'
  {
    encryptedMessage: "a8f3d2...",
    iv: "9c7e1a...",
    tag: "4b2f8d...",
    targetSocketId: Bob's ID
  }
      ↓
Server receives message
      ↓
Server routes to Bob's socket
      ↓
Bob receives 'receive-message'
      ↓
Decrypt with AES-GCM
  - Key: Shared Secret (SB)
  - IV from message
  - Verify authentication tag
      ↓
Display: "Hello Bob!"
```

## Component Architecture

### Frontend (public/)

#### 1. index.html
```
Structure:
├── Login Screen
│   ├── Username Input
│   ├── Room ID Input
│   └── Join Button
│
└── Chat Application
    ├── Header (User Info)
    ├── Curve Selection Panel
    │   ├── Dropdown
    │   ├── Curve Details
    │   └── Canvas Visualization
    ├── Key Generation Panel
    │   ├── Generate Button
    │   ├── Process Visualization
    │   └── Keys Display
    ├── Peer Section
    │   └── Peer Cards (dynamic)
    ├── Chat Section
    │   ├── Messages Container
    │   └── Input + Send Button
    └── Activity Log
```

#### 2. app.js (Client Logic)
```javascript
Main Components:
├── Connection Manager
│   ├── Socket.IO initialization
│   ├── Event listeners
│   └── Room management
│
├── UI Controllers
│   ├── Login handler
│   ├── Curve selection
│   ├── Key generation
│   └── Message handling
│
├── Visualization
│   ├── Curve plotting (Canvas)
│   ├── Process animations
│   └── Activity logging
│
└── Peer Management
    ├── Peer list updates
    ├── Key exchange
    └── Status tracking
```

#### 3. ecc.js (Cryptography)
```javascript
ECC Class:
├── Curve Management
│   ├── getCurveParameters()
│   ├── setCurve()
│   └── getCurveDetails()
│
├── Key Operations
│   ├── generateKeyPair()
│   ├── exportPrivateKey()
│   ├── exportPublicKey()
│   └── deriveSharedSecret()
│
└── Encryption/Decryption
    ├── encrypt() - AES-GCM
    ├── decrypt() - AES-GCM
    └── Utility functions
```

#### 4. style.css
```css
Styling Structure:
├── Global Styles
├── Login Screen
├── Main Layout
├── Curve Visualization
├── Process Animations
├── Key Display
├── Peer Cards
├── Chat Interface
└── Activity Log
```

### Backend (server.js)

```javascript
Server Architecture:
├── Express Setup
│   ├── Static file serving
│   └── Route handling
│
├── Socket.IO Server
│   ├── Connection handling
│   ├── Room management
│   └── Event routing
│
├── Data Structures
│   ├── users Map (socketId → user info)
│   └── rooms Map (roomId → Set of socketIds)
│
└── Event Handlers
    ├── 'join' - User joins room
    ├── 'curve-selected' - Broadcast curve choice
    ├── 'keys-generated' - Notify peers
    ├── 'share-public-key' - Route public key
    ├── 'send-message' - Route encrypted message
    ├── 'processing-step' - Broadcast process info
    └── 'disconnect' - Clean up user
```

## Security Architecture

### Encryption Layers

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  - User messages (plaintext)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Encryption Layer (AES-GCM)         │
│  - Symmetric encryption                 │
│  - Key: Shared Secret from ECDH         │
│  - Authenticated encryption             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Transport Layer (WebSocket)        │
│  - WSS (WebSocket Secure)               │
│  - TLS/SSL encryption                   │
└─────────────────────────────────────────┘
```

### Key Management

```
Private Keys:
- Generated locally on device
- Never transmitted
- Stored in memory only
- Cleared on page refresh

Public Keys:
- Derived from private keys
- Transmitted via WebSocket
- Stored in peers Map
- Used for ECDH

Shared Secrets:
- Derived using ECDH
- Never transmitted
- Used for AES-GCM encryption
- Unique per peer pair
```

## Scalability Considerations

### Current Design (Single Server)
```
Pros:
✅ Simple deployment
✅ Low latency
✅ Easy debugging
✅ No sync issues

Cons:
❌ Single point of failure
❌ Limited concurrent users
❌ No horizontal scaling
```

### Future Scaling Options

#### 1. Load Balancer + Multiple Servers
```
         ┌─────────────┐
         │Load Balancer│
         └──────┬──────┘
                │
      ┌─────────┼─────────┐
      │         │         │
   Server1   Server2   Server3
      │         │         │
      └─────────┼─────────┘
                │
         ┌──────▼──────┐
         │    Redis    │
         │  (Pub/Sub)  │
         └─────────────┘
```

#### 2. Microservices Architecture
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Gateway    │  │   Auth       │  │   Chat       │
│   Service    │→ │   Service    │→ │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
                                            │
                                    ┌───────┴───────┐
                                    │               │
                              ┌─────▼─────┐  ┌─────▼─────┐
                              │  Message  │  │   User    │
                              │  Queue    │  │  Database │
                              └───────────┘  └───────────┘
```

## Performance Optimization

### Current Optimizations
- ✅ Native Web Crypto API (hardware accelerated)
- ✅ Efficient WebSocket protocol
- ✅ Minimal data transmission
- ✅ Client-side encryption (offload from server)

### Future Optimizations
- [ ] Message compression
- [ ] Connection pooling
- [ ] Caching strategies
- [ ] CDN for static assets
- [ ] Database for message history

## Technology Stack

### Frontend
```
Core:
- HTML5 (Canvas API)
- CSS3 (Animations, Grid, Flexbox)
- Vanilla JavaScript (ES6+)

APIs:
- Web Crypto API (ECC, AES-GCM)
- WebSocket API
- Canvas API

Libraries:
- Socket.IO Client (v4.6+)
```

### Backend
```
Runtime:
- Node.js (v14+)

Framework:
- Express.js (v4.18+)

Real-time:
- Socket.IO (v4.6+)

Optional:
- Redis (for scaling)
- MongoDB (for persistence)
```

## Deployment Architecture

### Development
```
localhost:3000
- Single server
- Hot reload
- Debug mode
```

### Production
```
Cloud Platform (Heroku/Railway/Render)
├── Web Server (Node.js)
├── WebSocket Server (Socket.IO)
├── Static Assets (CDN)
└── SSL/TLS (Automatic)
```

---

**This architecture provides:**
- ✅ Real-time communication
- ✅ End-to-end encryption
- ✅ Visual feedback
- ✅ Scalability path
- ✅ Security best practices
