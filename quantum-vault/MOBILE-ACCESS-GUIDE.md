# Quantum Vault: Mobile Access Guide

**Version:** 1.0.0  
**Last Updated:** December 2, 2025

---

## 📱 Accessing Quantum Vault from Mobile Devices

This guide explains how to access your locally running Quantum Vault application from mobile devices on the same network.

---

## Prerequisites

- Quantum Vault running on your computer
- Mobile device connected to the **same WiFi network** as your computer
- Your computer's local IP address

---

## Quick Setup

### Your Network Information

```
Computer IP:    172.16.7.16
Frontend URL:   http://172.16.7.16:5173
Backend API:    http://172.16.7.16:3000
```

### Step 1: Ensure Servers are Running

Both backend and frontend servers should be running with network access enabled.

**Check if servers are accessible:**
```bash
# From your computer, test backend
curl http://172.16.7.16:3000/api/health

# Should return: {"status":"healthy",...}
```

### Step 2: Connect from Mobile

1. **Open your mobile browser** (Chrome, Safari, Firefox)
2. **Navigate to:** `http://172.16.7.16:5173`
3. **Register or login** to your account
4. **Start chatting!**

---

## Detailed Configuration

### What Was Changed

To enable mobile access, the following configurations were updated:

**1. Backend (backend/src/index.js)**
```javascript
// Changed from:
httpServer.listen(PORT, () => {...})

// To:
httpServer.listen(PORT, '0.0.0.0', () => {...})
// Now listens on all network interfaces
```

**2. Frontend (frontend/vite.config.js)**
```javascript
server: {
  host: '0.0.0.0',  // Added this line
  port: 5173,
  // ... rest of config
}
```

**3. Environment (.env)**
```bash
# Updated CORS to allow mobile access
CORS_ORIGIN=http://localhost:5173,http://172.16.7.16:5173
```

---

## Testing Mobile Access

### From Your Mobile Device

**1. Test Backend API:**
- Open browser on mobile
- Go to: `http://172.16.7.16:3000/api/health`
- Should see: `{"status":"healthy",...}`

**2. Test Frontend:**
- Open browser on mobile
- Go to: `http://172.16.7.16:5173`
- Should see: Quantum Vault login/register page

**3. Test Full Flow:**
- Register a new account from mobile
- Login from mobile
- Try sending messages
- Test real-time features

---

## Network Requirements

### Same Network

**Both devices must be on the same WiFi network:**
- Computer: Connected to WiFi
- Mobile: Connected to **same** WiFi network

**Check your network:**
```bash
# On computer
ip addr show | grep "inet " | grep -v "127.0.0.1"

# Should show: 172.16.7.16
```

### Firewall

**If you have a firewall enabled:**

```bash
# Check firewall status
sudo ufw status

# If active, allow ports
sudo ufw allow 3000/tcp  # Backend
sudo ufw allow 5173/tcp  # Frontend

# Reload firewall
sudo ufw reload
```

---

## Troubleshooting

### Cannot Connect from Mobile

**Problem:** Mobile browser shows "Cannot connect" or "Site can't be reached"

**Solutions:**

1. **Verify same network:**
   - Check WiFi name on computer
   - Check WiFi name on mobile
   - Must be identical

2. **Check IP address:**
   ```bash
   # On computer
   hostname -I | awk '{print $1}'
   ```
   - Use this IP in mobile browser

3. **Check servers are running:**
   ```bash
   # On computer
   curl http://localhost:3000/api/health
   curl http://localhost:5173
   ```

4. **Check firewall:**
   ```bash
   sudo ufw status
   # If active, allow ports 3000 and 5173
   ```

5. **Restart servers:**
   - Stop backend and frontend
   - Start them again with network access

### Slow Performance on Mobile

**Problem:** App is slow or laggy on mobile

**Solutions:**

1. **Check WiFi signal:**
   - Move closer to router
   - Check WiFi speed

2. **Close other apps:**
   - Free up mobile memory
   - Close background apps

3. **Use mobile browser:**
   - Chrome (recommended)
   - Safari (iOS)
   - Firefox

### Messages Not Sending

**Problem:** Messages stuck on "Sending..."

**Solutions:**

1. **Check WebSocket connection:**
   - Backend must be accessible
   - Check browser console for errors

2. **Refresh the page:**
   - Pull down to refresh
   - Or close and reopen browser

3. **Check network:**
   - Ensure still on same WiFi
   - Check internet connection

---

## Security Considerations

### Local Network Only

**Important:** This setup only works on your local network.

- ✅ Safe for home/office WiFi
- ✅ Devices on same network can access
- ❌ Not accessible from internet
- ❌ Not accessible from other networks

### Production Deployment

For internet access, you need to:

1. **Deploy to a hosting service:**
   - Render.com
   - Railway.app
   - Fly.io
   - AWS
   - Your own server

2. **Get a domain name:**
   - Register a domain
   - Point to your server

3. **Enable HTTPS:**
   - Get SSL certificate
   - Configure HTTPS

4. **Update CORS:**
   - Allow your domain
   - Configure production settings

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for production deployment.

---

## Multiple Devices

### Testing with Multiple Devices

You can test messaging between devices:

**Scenario 1: Computer ↔ Mobile**
1. Register user1 on computer: `http://localhost:5173`
2. Register user2 on mobile: `http://172.16.7.16:5173`
3. Send messages between them

**Scenario 2: Mobile ↔ Mobile**
1. Register user1 on mobile1: `http://172.16.7.16:5173`
2. Register user2 on mobile2: `http://172.16.7.16:5173`
3. Send messages between them

**Scenario 3: Multiple Computers**
1. Register user1 on computer1: `http://172.16.7.16:5173`
2. Register user2 on computer2: `http://172.16.7.16:5173`
3. Send messages between them

---

## Advanced Configuration

### Custom Port

If port 5173 is in use:

**1. Change frontend port:**
```javascript
// frontend/vite.config.js
server: {
  host: '0.0.0.0',
  port: 8080,  // Change to any available port
  // ...
}
```

**2. Update CORS:**
```bash
# .env
CORS_ORIGIN=http://localhost:8080,http://172.16.7.16:8080
```

**3. Access from mobile:**
```
http://172.16.7.16:8080
```

### Different Network

If your IP changes (different network):

**1. Find new IP:**
```bash
hostname -I | awk '{print $1}'
```

**2. Update CORS:**
```bash
# .env
CORS_ORIGIN=http://localhost:5173,http://NEW_IP:5173
```

**3. Restart servers**

**4. Access from mobile:**
```
http://NEW_IP:5173
```

---

## Mobile Browser Compatibility

### Recommended Browsers

**iOS:**
- ✅ Safari (best performance)
- ✅ Chrome
- ✅ Firefox

**Android:**
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Samsung Internet
- ✅ Edge

### Known Issues

**iOS Safari:**
- WebSocket may disconnect on background
- Refresh page when returning to app

**Android Chrome:**
- Works perfectly
- Best performance

---

## Performance Tips

### For Better Mobile Experience

1. **Use WiFi (not mobile data):**
   - Faster connection
   - Lower latency
   - More stable

2. **Close other apps:**
   - Free up memory
   - Better performance

3. **Use latest browser:**
   - Update to latest version
   - Better compatibility

4. **Clear browser cache:**
   - If experiencing issues
   - Settings → Clear cache

---

## QR Code Access (Optional)

### Generate QR Code for Easy Access

**1. Install qrencode:**
```bash
sudo apt install qrencode
```

**2. Generate QR code:**
```bash
qrencode -t UTF8 "http://172.16.7.16:5173"
```

**3. Scan with mobile:**
- Open camera app
- Point at QR code
- Tap notification to open

---

## Stopping Mobile Access

### Revert to Localhost Only

If you want to disable mobile access:

**1. Update backend (backend/src/index.js):**
```javascript
// Change back to:
httpServer.listen(PORT, () => {...})
```

**2. Update frontend (frontend/vite.config.js):**
```javascript
server: {
  // Remove: host: '0.0.0.0',
  port: 5173,
  // ...
}
```

**3. Update CORS (.env):**
```bash
CORS_ORIGIN=http://localhost:5173
```

**4. Restart servers**

---

## Summary

### Quick Reference

**Access URLs:**
```
Computer:  http://localhost:5173
Mobile:    http://172.16.7.16:5173
API:       http://172.16.7.16:3000
Health:    http://172.16.7.16:3000/api/health
```

**Requirements:**
- ✅ Same WiFi network
- ✅ Servers running with network access
- ✅ Firewall allows ports (if enabled)

**Troubleshooting:**
1. Check same network
2. Verify IP address
3. Check servers running
4. Check firewall
5. Restart servers

---

## Support

For mobile access issues:
- Check [Troubleshooting](#troubleshooting) section
- Review [BUILD-GUIDE.md](BUILD-GUIDE.md)
- Check [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
- GitHub Issues: https://github.com/muhammadalihussnain/quantum-vault/issues

---

**Last Updated:** December 2, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
