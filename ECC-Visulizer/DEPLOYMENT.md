# ECC Chat Application - Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Start the Server**
```bash
npm start
```

3. **Open in Browser**
- Open `http://localhost:3000` in your browser
- Open the same URL on another device (use your computer's IP address)
- Example: `http://192.168.1.100:3000`

4. **Test the Application**
- Device 1: Enter username "Alice" and room "test123"
- Device 2: Enter username "Bob" and room "test123"
- Both users will be connected in the same room

---

## 📱 Multi-Device Testing (Same Network)

### Find Your Local IP Address

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**On Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```
Look for "inet" address (e.g., 192.168.1.100)

### Connect from Other Devices
1. Make sure all devices are on the same WiFi network
2. On Device 1: Start the server with `npm start`
3. On Device 2: Open browser and go to `http://[YOUR-IP]:3000`
4. Both devices can now chat securely!

---

## ☁️ Cloud Deployment Options

### Option 1: Heroku (Easiest)

1. **Install Heroku CLI**
```bash
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku App**
```bash
heroku create your-ecc-chat-app
```

4. **Deploy**
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

5. **Open Your App**
```bash
heroku open
```

**Cost:** Free tier available (sleeps after 30 min of inactivity)

---

### Option 2: Railway (Modern & Fast)

1. **Visit Railway.app**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway auto-detects Node.js and deploys

3. **Get Your URL**
   - Railway provides a public URL automatically
   - Example: `your-app.railway.app`

**Cost:** Free tier with $5 credit/month

---

### Option 3: Render (Simple & Reliable)

1. **Visit Render.com**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)

**Cost:** Free tier available

---

### Option 4: DigitalOcean App Platform

1. **Create Account**
   - Go to https://www.digitalocean.com

2. **Create App**
   - Click "Create" → "Apps"
   - Connect GitHub repository
   - Select Node.js

3. **Configure**
   - Build Command: `npm install`
   - Run Command: `npm start`
   - Port: 3000

**Cost:** $5/month (no free tier)

---

### Option 5: AWS (Advanced)

#### Using AWS Elastic Beanstalk

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize**
```bash
eb init -p node.js your-app-name
```

3. **Create Environment**
```bash
eb create production
```

4. **Deploy**
```bash
eb deploy
```

**Cost:** Pay-as-you-go (can be expensive)

---

## 🔧 Environment Configuration

### Environment Variables

Create a `.env` file (optional):
```env
PORT=3000
NODE_ENV=production
```

### For Production Deployment

Update `server.js` to handle environment variables:
```javascript
const PORT = process.env.PORT || 3000;
```

---

## 🌐 Custom Domain Setup

### After Deployment

1. **Get Your App URL**
   - Heroku: `your-app.herokuapp.com`
   - Railway: `your-app.railway.app`
   - Render: `your-app.onrender.com`

2. **Add Custom Domain** (Optional)
   - Buy domain from Namecheap, GoDaddy, etc.
   - Add CNAME record pointing to your app URL
   - Configure in your hosting platform

---

## 📊 Monitoring & Scaling

### Check Server Logs

**Heroku:**
```bash
heroku logs --tail
```

**Railway/Render:**
- View logs in dashboard

### Scale Your App

**Heroku:**
```bash
heroku ps:scale web=2
```

**Railway/Render:**
- Adjust in dashboard settings

---

## 🔒 Security Considerations

### For Production:

1. **Enable HTTPS**
   - All platforms provide free SSL certificates
   - Ensure WebSocket connections use WSS (secure)

2. **Rate Limiting**
   - Add rate limiting to prevent abuse
   - Use `express-rate-limit` package

3. **CORS Configuration**
   - Configure allowed origins
   - Add CORS middleware

4. **Environment Variables**
   - Never commit sensitive data
   - Use platform's environment variable settings

---

## 🧪 Testing Deployment

### Test Checklist:

- [ ] Can join a room from 2 different devices
- [ ] Curve selection works and syncs
- [ ] Key generation shows process visualization
- [ ] Public keys can be shared between users
- [ ] Messages encrypt and decrypt correctly
- [ ] Activity log shows all events
- [ ] WebSocket connection is stable
- [ ] Works on mobile browsers

---

## 🐛 Troubleshooting

### Common Issues:

**1. WebSocket Connection Failed**
- Check if port 3000 is open
- Ensure firewall allows connections
- Verify WebSocket support on hosting platform

**2. Cannot Connect from Other Device**
- Verify both devices on same network
- Check IP address is correct
- Disable VPN if active

**3. Heroku App Sleeps**
- Free tier sleeps after 30 min
- Upgrade to hobby tier ($7/month) for always-on

**4. Build Fails**
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs for errors

---

## 📈 Recommended Deployment Path

**For Learning/Testing:**
→ Local network testing (free)

**For Demo/Portfolio:**
→ Railway or Render (free tier)

**For Production:**
→ Railway ($5/month) or DigitalOcean ($5/month)

**For Enterprise:**
→ AWS or custom VPS

---

## 🎯 Next Steps

After deployment:
1. Share your app URL with friends
2. Test with multiple devices
3. Monitor performance
4. Add features (message history, file sharing, etc.)
5. Implement user authentication

---

## 📞 Support

For issues or questions:
- Check server logs first
- Verify WebSocket connection
- Test locally before deploying
- Review platform-specific documentation
