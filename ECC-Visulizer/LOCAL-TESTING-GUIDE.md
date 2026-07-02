# 🏠 Local System Testing Guide

## How to Test with 2 Devices on Your Local Network

### Step 1: Find Your Computer's IP Address

#### On Linux (Your System):
```bash
# Option 1: Using ip command
ip addr show

# Option 2: Using hostname command
hostname -I

# Option 3: Using ifconfig
ifconfig
```

Look for your local IP address, usually starts with:
- `192.168.x.x` (most common)
- `10.0.x.x`
- `172.16.x.x` to `172.31.x.x`

**Example output:**
```
192.168.1.100  ← This is your IP!
```

### Step 2: Start the Server

```bash
# In your project directory
npm start
```

You should see:
```
ECC Chat Server running on port 3000
Open http://localhost:3000 in your browser
```

### Step 3: Test with 2 Devices

#### Option A: Computer + Phone (Easiest)

**On Your Computer (Device 1):**
1. Open browser (Chrome/Firefox)
2. Go to: `http://localhost:3000`
3. Enter:
   - Username: `Alice`
   - Room ID: `test123`
4. Click "Join Chat"

**On Your Phone (Device 2):**
1. Make sure phone is on the SAME WiFi network
2. Open browser (Safari/Chrome)
3. Go to: `http://192.168.1.100:3000` (use YOUR IP from Step 1)
4. Enter:
   - Username: `Bob`
   - Room ID: `test123`
5. Click "Join Chat"

#### Option B: 2 Browser Windows (Quick Test)

**Window 1:**
1. Open: `http://localhost:3000`
2. Username: `Alice`, Room: `test123`

**Window 2 (Incognito/Private):**
1. Open: `http://localhost:3000`
2. Username: `Bob`, Room: `test123`

#### Option C: 2 Computers

**Computer 1 (Server):**
1. Start server: `npm start`
2. Open: `http://localhost:3000`
3. Username: `Alice`, Room: `test123`

**Computer 2 (Client):**
1. Open: `http://192.168.1.100:3000` (use Computer 1's IP)
2. Username: `Bob`, Room: `test123`

### Step 4: Start Chatting!

**On Both Devices:**

1. **Select Curve**
   - Choose P-256 (or any curve)
   - Click "Show Curve Details" to see visualization

2. **Generate Keys**
   - Click "Generate My Keys"
   - Watch the animation!
   - See your keys appear

3. **Share Public Keys**
   - You'll see the other user in "Connect with Peers"
   - Click "Share Public Key"
   - Wait for "🔒 Secure" status

4. **Send Messages**
   - Type in the message box
   - Click "Send"
   - Messages are encrypted end-to-end!

---

## 🔍 Troubleshooting

### Problem: Can't connect from phone

**Solution 1: Check WiFi**
```bash
# Both devices must be on SAME WiFi network
# Check on phone: Settings → WiFi → Network name
# Check on computer: Should match phone's network
```

**Solution 2: Check Firewall**
```bash
# Allow port 3000 through firewall
sudo ufw allow 3000
# or
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

**Solution 3: Verify IP Address**
```bash
# Make sure you're using the correct IP
hostname -I
# Use the first IP address shown
```

### Problem: Server won't start

**Solution:**
```bash
# Check if port 3000 is already in use
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 [PID]

# Or use a different port
PORT=3001 npm start
```

### Problem: Connection refused

**Solution:**
```bash
# Make sure server is running
npm start

# Check if it's listening
netstat -tuln | grep 3000

# Try accessing from same computer first
curl http://localhost:3000
```

---

## 📱 Device-Specific Instructions

### Testing with Android Phone:

1. **Connect to WiFi**
   - Settings → WiFi
   - Connect to same network as computer

2. **Open Browser**
   - Chrome or Firefox recommended

3. **Enter URL**
   - `http://192.168.1.100:3000` (use your computer's IP)

4. **If not working:**
   - Try `http://192.168.0.100:3000` (different subnet)
   - Check firewall on computer
   - Restart WiFi on phone

### Testing with iPhone/iPad:

1. **Connect to WiFi**
   - Settings → WiFi
   - Same network as computer

2. **Open Safari**
   - Or Chrome/Firefox

3. **Enter URL**
   - `http://192.168.1.100:3000`

4. **If not working:**
   - Disable "Private Relay" in Settings
   - Check WiFi network (not cellular)
   - Try different browser

### Testing with Another Laptop:

1. **Same WiFi Network**
   - Both laptops on same WiFi

2. **Open Browser**
   - Any modern browser

3. **Enter URL**
   - `http://192.168.1.100:3000`

4. **If not working:**
   - Ping the server: `ping 192.168.1.100`
   - Check firewall on both machines
   - Try disabling VPN if active

---

## 🎯 Quick Test Checklist

Before testing, verify:

- [ ] Server is running (`npm start`)
- [ ] Both devices on same WiFi
- [ ] Firewall allows port 3000
- [ ] You have the correct IP address
- [ ] No VPN active on either device

---

## 🚀 Complete Testing Workflow

### 1. Prepare Server (Your Computer)
```bash
# Terminal 1: Start server
cd ~/Documents/test1
npm start

# Terminal 2: Check IP address
hostname -I
# Note: 192.168.1.100 (example)

# Terminal 3: Allow firewall (if needed)
sudo ufw allow 3000
```

### 2. Device 1 (Your Computer)
```
Browser: http://localhost:3000
Username: Alice
Room: test123
```

### 3. Device 2 (Your Phone)
```
Browser: http://192.168.1.100:3000
Username: Bob
Room: test123
```

### 4. Test Communication
```
Alice: Select P-256 curve
Bob: Select P-256 curve
Alice: Generate keys
Bob: Generate keys
Alice: Share public key → Bob
Bob: Share public key → Alice
✓ Both see "🔒 Secure"
Alice: Type "Hello Bob!" → Send
Bob: Receives "Hello Bob!"
Bob: Type "Hi Alice!" → Send
Alice: Receives "Hi Alice!"
✓ SUCCESS!
```

---

## 📊 Network Diagram

```
┌─────────────────────────────────────────┐
│         Your WiFi Router                │
│         (192.168.1.1)                   │
└────────┬──────────────────┬─────────────┘
         │                  │
         │                  │
    ┌────▼─────┐      ┌────▼─────┐
    │ Computer │      │  Phone   │
    │ (Server) │      │ (Client) │
    │          │      │          │
    │ 192.168  │      │ 192.168  │
    │ .1.100   │      │ .1.101   │
    │          │      │          │
    │ Port     │      │ Browser  │
    │ 3000     │      │          │
    └──────────┘      └──────────┘
         ↑                  │
         │                  │
         └──────WebSocket───┘
```

---

## 💡 Pro Tips

### Tip 1: Use QR Code
Generate a QR code for easy phone access:
```bash
# Install qrencode
sudo apt install qrencode

# Generate QR code
qrencode -t ANSI "http://192.168.1.100:3000"
```
Scan with phone camera!

### Tip 2: Keep Server Running
```bash
# Use screen or tmux to keep server running
screen -S ecchat
npm start
# Press Ctrl+A, then D to detach
# Reconnect: screen -r ecchat
```

### Tip 3: Monitor Connections
```bash
# Watch server logs in real-time
npm start | tee server.log

# In another terminal, watch logs
tail -f server.log
```

### Tip 4: Test Multiple Rooms
- Device 1: Room "room1"
- Device 2: Room "room1"
- Device 3: Room "room2"
- Device 4: Room "room2"

Each room is isolated!

---

## 🎓 What You'll See

### On Device 1 (Alice):
```
✓ Connected to server
✓ Joined room: test123 as Alice
✓ Bob joined the room
✓ Bob selected curve: P-256
✓ Bob generated their keys
✓ Sending public key to Bob...
✓ Public key sent!
✓ Received public key from Bob
✓ Shared secret established with Bob
✓ Secure connection ready!
```

### On Device 2 (Bob):
```
✓ Connected to server
✓ Joined room: test123 as Bob
✓ Alice selected curve: P-256
✓ Alice generated their keys
✓ Received public key from Alice
✓ Sending public key to Alice...
✓ Public key sent!
✓ Shared secret established with Alice
✓ Secure connection ready!
```

---

## 🎉 Success!

When you see messages being exchanged, you've successfully:
- ✅ Set up a local WebSocket server
- ✅ Connected 2 devices on your network
- ✅ Established end-to-end encryption
- ✅ Sent encrypted messages in real-time

**You're now running a secure chat system on your local network!**

---

## 📞 Need Help?

### Check Server Status:
```bash
# Is server running?
ps aux | grep node

# Is port open?
sudo lsof -i :3000

# Can you access locally?
curl http://localhost:3000
```

### Check Network:
```bash
# Can phone reach computer?
# On phone, use a network scanner app
# Or ping from another computer:
ping 192.168.1.100
```

### Check Firewall:
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 3000

# Fedora/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --add-port=3000/tcp --permanent
```

---

**Ready to test? Run `npm start` and follow the steps above!** 🚀
