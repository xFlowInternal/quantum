# 🚀 Quick Start Guide

## Get Started in 3 Minutes!

### Step 1: Install Dependencies (30 seconds)
```bash
npm install
```

### Step 2: Start the Server (5 seconds)
```bash
npm start
```

You should see:
```
ECC Chat Server running on port 3000
Open http://localhost:3000 in your browser
```

### Step 3: Test with 2 Devices

#### Device 1 (Your Computer):
1. Open `http://localhost:3000`
2. Username: `Alice`
3. Room ID: `test123`
4. Click "Join Chat"

#### Device 2 (Phone/Another Computer):
1. Find your computer's IP:
   - Windows: Open CMD, type `ipconfig`
   - Mac/Linux: Open Terminal, type `ifconfig`
   - Look for something like `192.168.1.100`

2. On your phone/other device:
   - Open browser
   - Go to `http://192.168.1.100:3000` (use YOUR IP)
   - Username: `Bob`
   - Room ID: `test123`
   - Click "Join Chat"

### Step 4: Start Chatting Securely! 🔐

**On Both Devices:**

1. **Select Curve** (Step 1)
   - Choose P-256, P-384, or P-521
   - Click "Show Curve Details" to see visualization

2. **Generate Keys** (Step 2)
   - Click "Generate My Keys"
   - Watch the process animation!
   - See your private and public keys

3. **Connect with Peer** (Step 3)
   - You'll see the other user appear
   - Click "Share Public Key"
   - Wait for "Keys Exchanged" status

4. **Send Messages** (Step 4)
   - Type your message
   - Click "Send"
   - Messages are encrypted end-to-end!

---

## 🎨 What You'll See

### Visual Processing Steps:

1. **Curve Visualization**
   - Real-time plot of the elliptic curve
   - Generator point marked on the curve

2. **Key Generation Animation**
   - Step 1: Generating random private key
   - Step 2: Computing public key (d × G)
   - Step 3: Keys ready!
   - Progress bars show each step

3. **Activity Log**
   - Every action is logged with timestamps
   - Color-coded by type (info, success, error)
   - See what's happening behind the scenes

4. **Peer Status**
   - See who's online
   - Connection status (Pending/Secure)
   - Public key exchange status

---

## 🔍 Understanding the Process

### When You Select a Curve:
```
You choose: P-256
↓
System loads curve parameters:
- Prime field (p)
- Generator point (G)
- Order (n)
↓
Curve is visualized on canvas
```

### When You Generate Keys:
```
Step 1: Generate random private key
        d = random number in [1, n-1]
        ⏱️ ~800ms

Step 2: Compute public key
        Q = d × G (scalar multiplication)
        ⏱️ ~1000ms

Step 3: Keys ready!
        Private: Keep secret (red box)
        Public: Share with peers (green box)
```

### When You Share Public Keys:
```
Alice                           Bob
-----                           ---
Click "Share Public Key"
        ↓
Public Key (QA) ──────────→ Receives QA
                              ↓
                         Computes: SA = dB × QA
                              
Receives QB ←────────── Public Key (QB)
        ↓
Computes: SB = dA × QB

Result: SA = SB (Shared Secret!)
```

### When You Send a Message:
```
Your Message: "Hello!"
        ↓
Encrypt with AES-GCM
Key: Shared Secret
        ↓
Ciphertext + IV + Tag
        ↓
Send via WebSocket
        ↓
Peer receives
        ↓
Decrypt with Shared Secret
        ↓
Original: "Hello!"
```

---

## 🎯 Try These Features

### 1. Curve Comparison
- Generate keys with P-256
- Note the key size
- Switch to P-521
- Generate keys again
- Compare the key lengths!

### 2. Multiple Peers
- Open 3+ browser tabs
- All join the same room
- Share keys with each peer
- Chat with multiple people

### 3. Process Visualization
- Watch the key generation animation
- Check the activity log
- See the curve visualization
- Understand each step

---

## 📱 Mobile Testing

### Same WiFi Network:
1. Start server on computer
2. Find computer's IP address
3. Open `http://[IP]:3000` on phone
4. Join same room
5. Chat securely!

### Different Networks:
- Deploy to cloud (see DEPLOYMENT.md)
- Use Heroku, Railway, or Render
- Share the public URL
- Chat from anywhere!

---

## 🐛 Troubleshooting

### "Cannot connect from phone"
- ✅ Both devices on same WiFi?
- ✅ Firewall blocking port 3000?
- ✅ Using correct IP address?
- ✅ Server running on computer?

### "Keys not exchanging"
- ✅ Both users generated keys?
- ✅ Clicked "Share Public Key"?
- ✅ Same room ID?
- ✅ Check activity log for errors

### "Messages not decrypting"
- ✅ Keys exchanged successfully?
- ✅ Both using same curve?
- ✅ Shared secret established?

---

## 🎓 Learning Path

### Beginner:
1. Run the app locally
2. Test with 2 devices
3. Read the activity log
4. Understand the steps

### Intermediate:
1. Explore different curves
2. Read the code (ecc.js)
3. Understand ECDH
4. Learn about AES-GCM

### Advanced:
1. Deploy to cloud
2. Add new features
3. Implement message history
4. Add user authentication

---

## 🎉 You're Ready!

Now you have a working ECC chat application with:
- ✅ Real-time communication
- ✅ End-to-end encryption
- ✅ Visual processing steps
- ✅ Multi-device support
- ✅ Educational demonstrations

**Next Steps:**
- Read README.md for detailed documentation
- Check DEPLOYMENT.md to deploy online
- Explore the code to learn more
- Build upon it for your projects!

---

**Happy Secure Chatting! 🔐💬**
