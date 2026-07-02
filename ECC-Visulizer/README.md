# 🔐 ECC Secure Chat Application

A real-time, end-to-end encrypted chat application demonstrating Elliptic Curve Cryptography (ECC) with visual processing steps.

## ✨ Features

### 🔒 Security
- **End-to-End Encryption** using ECC (Elliptic Curve Cryptography)
- **Multiple Curve Support**: P-256, P-384, P-521
- **ECDH Key Exchange** for secure communication
- **AES-GCM Encryption** for messages

### 📊 Visual Processing
- **Curve Visualization**: See the elliptic curve plotted in real-time
- **Key Generation Animation**: Watch the step-by-step process
- **Real-time Activity Log**: Track all cryptographic operations
- **Processing Steps Display**: Understand what's happening behind the scenes

### 💬 Real-time Communication
- **WebSocket-based** instant messaging
- **Multi-device Support**: Chat from any device
- **Room-based System**: Private chat rooms
- **Peer Status Tracking**: See who's online and connected

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

### Usage

1. **Open in Browser**
   - Go to `http://localhost:3000`

2. **Join a Room**
   - Enter your username (e.g., "Alice")
   - Enter a room ID (e.g., "room123")
   - Click "Join Chat"

3. **Connect from Another Device**
   - Open `http://[YOUR-IP]:3000` on another device
   - Use the same room ID
   - Enter a different username (e.g., "Bob")

4. **Start Chatting Securely!**
   - Select an elliptic curve
   - Generate your keys
   - Share public keys
   - Send encrypted messages

## 📱 Multi-Device Setup

### Same Network (Local Testing)

1. Find your computer's IP address:
   - **Windows**: `ipconfig`
   - **Mac/Linux**: `ifconfig` or `ip addr`

2. Start the server: `npm start`

3. On other devices, open: `http://[YOUR-IP]:3000`
   - Example: `http://192.168.1.100:3000`

### Internet (Cloud Deployment)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to:
- Heroku (Free tier)
- Railway (Free tier)
- Render (Free tier)
- DigitalOcean
- AWS

## 🎓 How It Works

### 1. Curve Selection
Choose from three NIST-standardized elliptic curves:
- **P-256**: 256-bit security (fastest)
- **P-384**: 384-bit security (balanced)
- **P-521**: 521-bit security (most secure)

### 2. Key Generation Process
```
Step 1: Generate random private key (d)
        d ∈ [1, n-1] where n is the curve order

Step 2: Compute public key (Q)
        Q = d × G (scalar multiplication)
        G is the generator point

Step 3: Keys ready!
        Private key: Keep secret
        Public key: Share with peers
```

### 3. Key Exchange (ECDH)
```
Alice                           Bob
-----                           ---
Private: dA                     Private: dB
Public: QA = dA × G            Public: QB = dB × G

        QA ──────────────────→
        ←──────────────────── QB

Shared Secret:                  Shared Secret:
SA = dA × QB                   SB = dB × QA
   = dA × (dB × G)               = dB × (dA × G)
   = (dA × dB) × G               = (dB × dA) × G

SA = SB (Same shared secret!)
```

### 4. Message Encryption
```
Encryption (AES-GCM):
- Input: Plaintext message
- Key: Shared secret from ECDH
- Output: Ciphertext + IV + Authentication Tag

Decryption:
- Input: Ciphertext + IV + Tag
- Key: Shared secret
- Output: Original plaintext message
```

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Browser 1     │         │   Browser 2     │
│   (Alice)       │         │   (Bob)         │
│                 │         │                 │
│  - ECC Keys     │         │  - ECC Keys     │
│  - Encryption   │         │  - Encryption   │
│  - UI/Canvas    │         │  - UI/Canvas    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │      WebSocket (WSS)      │
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Node.js   │
              │   Server    │
              │             │
              │  - Socket.IO│
              │  - Express  │
              │  - Routing  │
              └─────────────┘
```

## 📁 Project Structure

```
ecc-chat-app/
├── server.js              # WebSocket server
├── package.json           # Dependencies
├── public/
│   ├── index.html        # Main UI
│   ├── app.js            # Client logic
│   ├── ecc.js            # ECC implementation
│   └── style.css         # Styling
├── DEPLOYMENT.md         # Deployment guide
└── README.md            # This file
```

## 🔧 Technologies Used

### Backend
- **Node.js**: Server runtime
- **Express**: Web framework
- **Socket.IO**: Real-time WebSocket communication

### Frontend
- **HTML5 Canvas**: Curve visualization
- **Web Crypto API**: Native browser cryptography
- **Vanilla JavaScript**: No frameworks needed
- **CSS3**: Modern styling with animations

### Cryptography
- **ECDH**: Elliptic Curve Diffie-Hellman key exchange
- **AES-GCM**: Authenticated encryption
- **NIST Curves**: P-256, P-384, P-521

## 🎯 Use Cases

### Educational
- Learn how ECC works
- Understand key exchange protocols
- Visualize cryptographic processes
- Teaching cryptography concepts

### Demonstration
- Portfolio projects
- Security presentations
- Cryptography workshops
- Technical interviews

### Development
- Prototype secure messaging
- Test encryption implementations
- Experiment with different curves
- Build upon for production apps

## 🔐 Security Notes

### What This App Does:
✅ End-to-end encryption
✅ Secure key exchange (ECDH)
✅ Authenticated encryption (AES-GCM)
✅ No plaintext transmission

### What This App Doesn't Do:
❌ User authentication
❌ Message persistence
❌ Perfect forward secrecy
❌ Protection against MITM (no certificate pinning)

**Note**: This is an educational demonstration. For production use, add:
- User authentication
- Certificate validation
- Message history encryption
- Rate limiting
- Input sanitization

## 🧪 Testing

### Manual Testing Checklist:
- [ ] Join room from 2 devices
- [ ] Select different curves
- [ ] Generate keys on both devices
- [ ] Share public keys
- [ ] Send encrypted messages
- [ ] Verify decryption works
- [ ] Check activity log
- [ ] Test curve visualization
- [ ] Verify process animations

### Browser Compatibility:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS/Android)

## 📚 Learning Resources

### Elliptic Curve Cryptography:
- [ECC Introduction](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography)
- [NIST Curves](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

### WebSocket & Real-time:
- [Socket.IO Documentation](https://socket.io/docs/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - Feel free to use for learning and projects!

## 🎉 Acknowledgments

- NIST for standardized elliptic curves
- Web Crypto API for browser-native cryptography
- Socket.IO for real-time communication

---

**Built with ❤️ for learning and demonstration purposes**
