# ⚡ Quick Start Guide - ECC Secure Chat

## 🌐 Your Current HTTPS URL:
```
https://proadjournment-bimaculate-berniece.ngrok-free.dev
```
**Use this URL on BOTH devices!**

---

## 📱 5-Minute Test (Laptop + Phone)

### On Your Laptop:
1. Open: `https://proadjournment-bimaculate-berniece.ngrok-free.dev`
2. Username: **Alice** | Room: **test123**
3. Click "Generate My Keys" → Wait for green checkmark
4. Click "Share Public Key" when Bob appears

### On Your Phone:
1. Open Chrome: `https://proadjournment-bimaculate-berniece.ngrok-free.dev`
2. Username: **Bob** | Room: **test123**
3. Tap "Generate My Keys" → Wait for green checkmark
4. Keys exchange automatically!
5. Start chatting! 🎉

---

## ✅ What You Should See:

### After Joining:
- ✅ "Connected to server"
- ✅ "Joined room: test123 as [your name]"

### After Generating Keys:
- ✅ Button turns green: "✓ Keys Generated"
- ✅ Private and public keys displayed

### After Key Exchange:
- ✅ "Received public key from [peer]"
- ✅ "Shared secret established with [peer]"
- ✅ Peer shows "🔒 Secure" status
- ✅ "💬 Secure Chat" section appears

### After Sending Message:
- ✅ Message appears on both devices
- ✅ Decrypted automatically
- ✅ Shows sender name and timestamp

---

## 🔧 Currently Running:

**Server:** ✅ Running on port 3000
**ngrok:** ✅ Tunneling to HTTPS
**Status:** Ready to test!

---

## 🛑 To Stop Everything:

```bash
# Stop server
pkill -f "node server.js"

# Stop ngrok
pkill ngrok
```

---

## 🔄 To Restart:

### Terminal 1:
```bash
node server.js
```

### Terminal 2:
```bash
ngrok http 3000
```

### Get new URL:
```bash
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1
```

---

## 📊 Monitor Activity:

**ngrok Dashboard:** http://localhost:4040
**Server Logs:** Check terminal running `node server.js`

---

## 🐛 Quick Fixes:

**Problem:** "Web Crypto API not available"
**Fix:** Make sure using HTTPS URL (not HTTP)

**Problem:** "Cannot decrypt: no shared secret"
**Fix:** Click "Share Public Key" button first

**Problem:** Peer not showing
**Fix:** Both must use EXACT same room ID

**Problem:** ngrok URL not working
**Fix:** Get fresh URL with command above

---

## 📖 Full Documentation:

See `TESTING-ROADMAP.md` for complete guide!
