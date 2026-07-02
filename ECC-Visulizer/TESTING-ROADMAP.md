# 🚀 Complete Testing Roadmap - ECC Secure Chat

## Prerequisites Checklist
- ✅ Node.js installed
- ✅ ngrok installed
- ✅ Both devices on same WiFi network (for local testing)
- ✅ Chrome/Firefox on both devices

---

## 🔧 Setup (One-Time)

### Step 1: Install Dependencies
```bash
cd ~/Documents/test1
npm install
```

### Step 2: Start the Server
```bash
node server.js
```
**Expected Output:**
```
ECC Chat Server running on port 3000
Open http://localhost:3000 in your browser
```

### Step 3: Start ngrok (for HTTPS)
Open a **new terminal** and run:
```bash
ngrok http 3000
```

**Expected Output:**
```
Forwarding: https://your-unique-url.ngrok-free.dev -> http://localhost:3000
```

**Copy the HTTPS URL** - you'll use this on both devices!

---

## 📱 Testing Scenario 1: Laptop + Mobile Phone

### Device 1: Laptop (Firefox/Chrome)

**Step 1: Open the App**
- Open browser
- Go to: `https://your-unique-url.ngrok-free.dev`
- If you see ngrok warning, click "Visit Site"

**Step 2: Join Room**
- Username: `Alice`
- Room ID: `test123`
- Click "Join Chat"

**Step 3: Select Curve**
- Choose: `P-256 (secp256r1) - 256-bit`
- (Optional) Click "Show Curve Details" to see visualization

**Step 4: Generate Keys**
- Click "Generate My Keys"
- Wait for animation (1-2 seconds)
- Button turns green: "✓ Keys Generated"
- You'll see your private and public keys displayed

**Step 5: Wait for Peer**
- You'll see: "Waiting for peers to join..."
- Activity Log shows: "Joined room: test123 as Alice"

---

### Device 2: Mobile Phone (Chrome)

**Step 1: Open the App**
- Open Chrome on your phone
- Go to: `https://your-unique-url.ngrok-free.dev`
- If you see ngrok warning, tap "Visit Site"

**Step 2: Join Same Room**
- Username: `Bob`
- Room ID: `test123` (SAME as Device 1)
- Tap "Join Chat"

**Step 3: Select Curve**
- Choose: `P-256 (secp256r1) - 256-bit` (SAME as Device 1)

**Step 4: Generate Keys**
- Tap "Generate My Keys"
- Wait for animation
- Button turns green: "✓ Keys Generated"

**Step 5: Check Both Devices**
- **On Laptop:** You'll see "Bob joined the room"
- **On Mobile:** You'll see "Alice" in the peers list
- Both devices show each other as peers!

---

### Key Exchange (Either Device)

**Option A: From Laptop**
- Under "👥 Step 3: Connect with Peers"
- You'll see: **Bob** with status "⏳ Pending"
- Click "Share Public Key" button next to Bob's name

**What Happens Automatically:**
1. Laptop sends public key to Mobile
2. Mobile receives it and logs: "Received public key from Alice"
3. Mobile **automatically** sends its public key back
4. Laptop receives it and logs: "Received public key from Bob"
5. Both establish shared secrets
6. Both show: "🔒 Secure" and "✓ Keys Exchanged"
7. **💬 Secure Chat section appears on BOTH devices!**

**Option B: From Mobile**
- Same process, just tap "Share Public Key" from mobile first
- Automatic bidirectional exchange happens!

---

### Send Encrypted Messages

**From Laptop:**
- Type message: "Hello from Alice!"
- Click "Send"
- Message appears encrypted in transit
- Mobile receives and decrypts it automatically

**From Mobile:**
- Type message: "Hi Alice, this is Bob!"
- Tap "Send"
- Laptop receives and decrypts it

**Both devices show decrypted messages in the chat!** 🎉

---

## 💻 Testing Scenario 2: Two Laptops (Same Network)

### Laptop 1:
1. Open: `https://your-unique-url.ngrok-free.dev`
2. Username: `Alice`, Room: `test123`
3. Generate keys
4. Share public key

### Laptop 2:
1. Open: `https://your-unique-url.ngrok-free.dev`
2. Username: `Bob`, Room: `test123`
3. Generate keys
4. Automatic key exchange happens
5. Start chatting!

---

## 📱 Testing Scenario 3: Two Mobile Phones

### Phone 1:
1. Open Chrome: `https://your-unique-url.ngrok-free.dev`
2. Username: `Alice`, Room: `test123`
3. Generate keys
4. Tap "Share Public Key"

### Phone 2:
1. Open Chrome: `https://your-unique-url.ngrok-free.dev`
2. Username: `Bob`, Room: `test123`
3. Generate keys
4. Automatic key exchange
5. Chat securely!

---

## 🔍 Activity Log - What to Watch For

### Successful Flow:
```
✅ Joined room: test123 as Alice
✅ Connected to server
✅ Curve changed to: P-256
✅ Your keys have been generated successfully
✅ Bob joined the room
✅ Sending public key to Bob...
✅ Received public key from Bob
✅ Auto-sharing your public key with Bob...
✅ Shared secret established with Bob
```

### Common Issues:
```
❌ Error generating Keys: Web Crypto API requires HTTPS
   → Solution: Use ngrok HTTPS URL, not HTTP

❌ Cannot decrypt: no shared secret
   → Solution: Share public keys first (click the button)

❌ Error deriving shared secret: Must be a CryptoKey
   → Solution: Already fixed in latest code!
```

---

## 🎯 Complete Test Checklist

### Basic Functionality:
- [ ] Both devices can access the ngrok URL
- [ ] Both can join the same room
- [ ] Both can select curves
- [ ] Both can generate keys (no errors)
- [ ] Peers list shows other user
- [ ] Activity log shows all events

### Key Exchange:
- [ ] Click "Share Public Key" on one device
- [ ] Other device auto-responds
- [ ] Both show "🔒 Secure" status
- [ ] Both show "✓ Keys Exchanged"
- [ ] Chat section appears on both

### Messaging:
- [ ] Send message from Device 1
- [ ] Device 2 receives and decrypts it
- [ ] Send message from Device 2
- [ ] Device 1 receives and decrypts it
- [ ] Messages show correct sender name
- [ ] Timestamps are displayed

### Advanced:
- [ ] Test with 3+ devices in same room
- [ ] Test different curves (P-256, P-384, P-521)
- [ ] Test disconnecting and reconnecting
- [ ] Test multiple rooms simultaneously

---

## 🐛 Troubleshooting Guide

### Issue: "Web Crypto API not available"
**Cause:** Using HTTP instead of HTTPS on mobile
**Solution:** 
- Make sure you're using the ngrok HTTPS URL
- Check that ngrok is running: `curl http://localhost:4040/api/tunnels`

### Issue: "Cannot decrypt: no shared secret"
**Cause:** Keys not exchanged yet
**Solution:**
- Make sure both users generated keys
- Click "Share Public Key" button
- Wait for automatic exchange to complete

### Issue: "Connection failed"
**Cause:** Server not running or ngrok tunnel closed
**Solution:**
```bash
# Check if server is running
ps aux | grep "node server.js"

# Check if ngrok is running
ps aux | grep ngrok

# Restart if needed
node server.js
ngrok http 3000
```

### Issue: Peer not showing up
**Cause:** Different room IDs or connection issue
**Solution:**
- Verify both devices entered EXACT same room ID
- Check Activity Log for "joined the room" message
- Refresh both pages and rejoin

### Issue: ngrok URL changed
**Cause:** ngrok free tier generates new URL on restart
**Solution:**
- Get new URL: `curl -s http://localhost:4040/api/tunnels | grep public_url`
- Use the new HTTPS URL on all devices
- Or upgrade to ngrok paid plan for static URLs

---

## 🎬 Quick Start Commands

### Terminal 1: Start Server
```bash
cd ~/Documents/test1
node server.js
```

### Terminal 2: Start ngrok
```bash
ngrok http 3000
```

### Get ngrok URL:
```bash
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1
```

### Stop Everything:
```bash
# Stop server
pkill -f "node server.js"

# Stop ngrok
pkill ngrok
```

---

## 📊 Monitoring

### View Server Logs:
```bash
# If running in foreground, just watch the terminal

# If running in background:
tail -f server.log
```

### View ngrok Dashboard:
Open in browser: `http://localhost:4040`
- See all HTTP requests
- See WebSocket connections
- Debug traffic

### Check Active Connections:
- Look at server terminal for "New client connected" messages
- Check ngrok dashboard for active connections

---

## 🚀 Production Deployment (Optional)

### For permanent HTTPS without ngrok:

**Option 1: Railway (Recommended)**
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```
Get permanent URL: `https://your-app.railway.app`

**Option 2: Render**
1. Go to https://render.com
2. Connect GitHub repo
3. Deploy
4. Get URL: `https://your-app.onrender.com`

**Option 3: Heroku**
```bash
heroku login
heroku create your-ecc-chat
git push heroku main
heroku open
```

---

## 📝 Notes

- **ngrok free tier:** URL changes on restart, 40 requests/min limit
- **Room IDs:** Case-sensitive, must match exactly
- **Curves:** Both users should select same curve (recommended: P-256)
- **Browser compatibility:** Works on Chrome, Firefox, Safari, Edge
- **Mobile:** Requires HTTPS (ngrok or production deployment)
- **Security:** Keys never leave devices, all encryption client-side

---

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ Both devices show "✓ Keys Generated"
2. ✅ Both show peer with "🔒 Secure" status
3. ✅ Chat section appears on both
4. ✅ Messages sent from one appear on the other
5. ✅ Activity log shows "Shared secret established"

---

## 📞 Need Help?

Check in order:
1. Activity Log on both devices
2. Browser console (F12 → Console tab)
3. Server terminal output
4. ngrok dashboard (http://localhost:4040)

Common fixes:
- Refresh both pages
- Restart server
- Restart ngrok
- Clear browser cache
- Check WiFi connection
