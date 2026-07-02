// ECC Chat Application - Client Side
let socket;
let ecc;
let myKeyPair = null;
let myUsername = '';
let currentRoom = '';
let peers = new Map(); // socketId -> {username, publicKey, sharedSecret}

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatApp = document.getElementById('chatApp');
const usernameInput = document.getElementById('usernameInput');
const roomIdInput = document.getElementById('roomIdInput');
const joinBtn = document.getElementById('joinBtn');

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    try {
        ecc = new ECC();
        if (!ecc) {
            console.error('Failed to initialize ECC');
            alert('Error: Cryptography initialization failed. Please refresh the page.');
            return;
        }
        setupLoginHandlers();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing application: ' + error.message);
    }
});

// Login Handlers
function setupLoginHandlers() {
    joinBtn.addEventListener('click', joinChat);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinChat();
    });
    roomIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinChat();
    });
}

function joinChat() {
    const username = usernameInput.value.trim();
    const roomId = roomIdInput.value.trim();
    
    if (!username || !roomId) {
        alert('Please enter both username and room ID');
        return;
    }
    
    myUsername = username;
    currentRoom = roomId;
    
    // Hide login, show chat
    loginScreen.classList.add('hidden');
    chatApp.classList.remove('hidden');
    
    // Update UI
    document.getElementById('currentUsername').textContent = username;
    document.getElementById('currentRoom').textContent = roomId;
    
    // Connect to server
    connectToServer();
    setupChatHandlers();
    
    addLog(`Joined room: ${roomId} as ${username}`, 'success');
}

// Server Connection
function connectToServer() {
    socket = io();
    
    socket.on('connect', () => {
        addLog('Connected to server', 'success');
        socket.emit('join', { username: myUsername, roomId: currentRoom });
    });
    
    socket.on('user-joined', (data) => {
        addLog(`${data.username} joined the room`, 'info');
        updatePeersList(data.usersInRoom);
    });
    
    socket.on('user-left', (data) => {
        addLog(`${data.username} left the room`, 'info');
        peers.delete(data.socketId);
        updatePeersList(data.usersInRoom);
    });
    
    socket.on('peer-curve-selected', (data) => {
        addLog(`${data.from} selected curve: ${data.curve}`, 'info');
    });
    
    socket.on('peer-keys-generated', (data) => {
        addLog(`${data.from} generated their keys`, 'info');
    });
    
    socket.on('receive-public-key', async (data) => {
        addLog(`Received public key from ${data.from}`, 'success');
        
        const peer = peers.get(data.fromSocketId);
        if (peer) {
            try {
                // Import the received public key JWK
                const importedPublicKey = await ecc.importPublicKey(data.publicKey);
                peer.publicKey = importedPublicKey;
                
                // Generate shared secret
                if (myKeyPair) {
                    const sharedSecret = await ecc.deriveSharedSecret(
                        myKeyPair.privateKeyRaw,
                        importedPublicKey
                    );
                    peer.sharedSecret = sharedSecret;
                    addLog(`Shared secret established with ${data.from}`, 'success');
                    
                    // Auto-reply with our public key if we haven't shared yet
                    if (!data.isReply && myKeyPair) {
                        addLog(`Auto-sharing your public key with ${data.from}...`, 'info');
                        socket.emit('share-public-key', {
                            publicKey: myKeyPair.publicKey,
                            targetSocketId: data.fromSocketId,
                            isReply: true
                        });
                    }
                    
                    // Enable chat
                    const chatSection = document.getElementById('chatSection');
                    if (chatSection) {
                        chatSection.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('Error processing public key:', error);
                addLog(`Error deriving shared secret: ${error.message}`, 'error');
            }
        }
        
        updatePeersList(Array.from(peers.values()).map(p => ({
            socketId: p.socketId,
            username: p.username
        })));
    });
    
    socket.on('receive-message', async (data) => {
        try {
            const peer = peers.get(data.fromSocketId);
            if (!peer || !peer.sharedSecret) {
                addLog('Cannot decrypt: no shared secret', 'error');
                return;
            }
            
            // Calculate encrypted message size
            const encryptedSize = Math.ceil(data.encryptedMessage.length * 3 / 4);
            const ivSize = Math.ceil(data.iv.length * 3 / 4);
            const tagSize = Math.ceil(data.tag.length * 3 / 4);
            const totalEncryptedSize = encryptedSize + ivSize + tagSize;
            
            // Show decryption process
            addLog(`📨 Received encrypted message from ${data.from}`, 'info');
            addLog(`📦 Received size: ${totalEncryptedSize} bytes (ciphertext: ${encryptedSize}b + IV: ${ivSize}b + tag: ${tagSize}b)`, 'info');
            addLog(`🔒 Encrypted ciphertext: ${data.encryptedMessage.substring(0, 40)}...`, 'info');
            
            // Start timing
            const startTime = performance.now();
            addLog(`🔓 Decrypting with shared secret...`, 'process');
            
            const decrypted = await ecc.decrypt(
                data.encryptedMessage,
                peer.sharedSecret,
                data.iv,
                data.tag
            );
            
            // End timing
            const endTime = performance.now();
            const decryptionTime = (endTime - startTime).toFixed(2);
            
            // Calculate decrypted size
            const decryptedSize = new Blob([decrypted]).size;
            
            addLog(`⏱️ Decryption time: ${decryptionTime} ms`, 'success');
            addLog(`📏 Decrypted size: ${decryptedSize} bytes`, 'info');
            addLog(`✅ Decrypted message: "${decrypted}"`, 'success');
            
            displayMessage(data.from, decrypted, false, data.encryptedMessage, {
                decryptionTime,
                originalSize: decryptedSize,
                encryptedSize: totalEncryptedSize
            });
        } catch (error) {
            addLog(`Decryption error: ${error.message}`, 'error');
        }
    });
    
    socket.on('peer-processing-step', (data) => {
        addLog(`${data.from}: ${data.step} - ${data.details}`, 'process');
    });
}

// Chat Handlers
function setupChatHandlers() {
    const curveSelect = document.getElementById('curveSelect');
    const showCurveDetailsBtn = document.getElementById('showCurveDetailsBtn');
    const generateKeysBtn = document.getElementById('generateKeysBtn');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');
    
    curveSelect.addEventListener('change', (e) => {
        ecc.setCurve(e.target.value);
        addLog(`Curve changed to: ${e.target.value}`, 'info');
        socket.emit('curve-selected', { curve: e.target.value });
        
        // Visualize curve
        visualizeCurve(e.target.value);
    });
    
    showCurveDetailsBtn.addEventListener('click', () => {
        const details = document.getElementById('curveDetails');
        if (details.classList.contains('hidden')) {
            details.classList.remove('hidden');
            showCurveDetailsBtn.textContent = 'Hide Curve Details';
            displayCurveDetails();
            visualizeCurve(curveSelect.value);
        } else {
            details.classList.add('hidden');
            showCurveDetailsBtn.textContent = 'Show Curve Details';
        }
    });
    
    generateKeysBtn.addEventListener('click', generateKeys);
    
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Curve Visualization
function visualizeCurve(curveName) {
    const canvas = document.getElementById('curveCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Draw axes
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    // Draw simplified elliptic curve
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    for (let x = -width / 2; x < width / 2; x += 0.5) {
        const y = Math.sqrt(Math.abs(x * x * x + x * 20)) * 2;
        const px = x + width / 2;
        const py1 = height / 2 - y;
        const py2 = height / 2 + y;
        
        if (x === -width / 2) {
            ctx.moveTo(px, py1);
        } else {
            ctx.lineTo(px, py1);
        }
    }
    ctx.stroke();
    
    ctx.beginPath();
    for (let x = -width / 2; x < width / 2; x += 0.5) {
        const y = Math.sqrt(Math.abs(x * x * x + x * 20)) * 2;
        const px = x + width / 2;
        const py2 = height / 2 + y;
        
        if (x === -width / 2) {
            ctx.moveTo(px, py2);
        } else {
            ctx.lineTo(px, py2);
        }
    }
    ctx.stroke();
    
    // Draw generator point
    ctx.fillStyle = '#48bb78';
    ctx.beginPath();
    ctx.arc(width / 2 + 50, height / 2 - 100, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#2d3748';
    ctx.font = '14px Arial';
    ctx.fillText('G (Generator)', width / 2 + 60, height / 2 - 95);
    
    document.getElementById('curveName').textContent = curveName;
}

function displayCurveDetails() {
    if (!ecc) {
        addLog('Error: ECC not initialized', 'error');
        return;
    }
    
    const params = ecc.getCurveDetails();
    if (!params) {
        addLog('Error: Could not get curve details', 'error');
        return;
    }
    
    const primeFieldEl = document.getElementById('primeField');
    const generatorPointEl = document.getElementById('generatorPoint');
    const groupOrderEl = document.getElementById('groupOrder');
    
    if (primeFieldEl && params.primeField) {
        primeFieldEl.textContent = params.primeField;
    }
    
    if (generatorPointEl && params.generatorX && params.generatorY) {
        generatorPointEl.innerHTML = 
            `Gx = ${params.generatorX.substring(0, 40)}...<br>Gy = ${params.generatorY.substring(0, 40)}...`;
    }
    
    if (groupOrderEl && params.orderDecimal) {
        groupOrderEl.textContent = params.orderDecimal;
    }
}

// Key Generation with Visualization
async function generateKeys() {
    const btn = document.getElementById('generateKeysBtn');
    if (!btn) {
        addLog('Error: Generate button not found', 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Generating...';
    
    const processDiv = document.getElementById('keyGenerationProcess');
    if (processDiv) {
        processDiv.classList.remove('hidden');
    }
    
    try {
        // Step 1: Generate private key
        animateStep('step1');
        if (socket && socket.connected) {
            socket.emit('processing-step', { 
                step: 'Generating private key', 
                details: 'Selecting random number' 
            });
        }
        await sleep(800);
        
        // Step 2: Compute public key
        animateStep('step2');
        if (socket && socket.connected) {
            socket.emit('processing-step', { 
                step: 'Computing public key', 
                details: 'Performing scalar multiplication' 
            });
        }
        await sleep(1000);
        
        myKeyPair = await ecc.generateKeyPair();
        
        // Step 3: Complete
        animateStep('step3');
        if (socket && socket.connected) {
            socket.emit('processing-step', { 
                step: 'Keys generated', 
                details: 'Ready to share public key' 
            });
        }
        
        displayMyKeys();
        if (socket && socket.connected) {
            socket.emit('keys-generated', {});
        }
        
        btn.textContent = '✓ Keys Generated';
        btn.style.background = '#48bb78';
        
        addLog('Your keys have been generated successfully', 'success');
    } catch (error) {
        console.error('Key generation error:', error);
        addLog(`Error generating Keys: ${error.message}`, 'error');
        btn.disabled = false;
        btn.textContent = 'Generate My Keys';
        if (processDiv) {
            processDiv.classList.add('hidden');
        }
    }
}

function animateStep(stepId) {
    const step = document.getElementById(stepId);
    if (!step) {
        console.warn(`Step element not found: ${stepId}`);
        return;
    }
    step.classList.add('active');
    const progress = step.querySelector('.progress');
    if (progress) {
        progress.style.width = '100%';
    }
}

function displayMyKeys() {
    const keysDiv = document.getElementById('myKeys');
    if (!keysDiv) {
        console.error('Keys display div not found');
        return;
    }
    keysDiv.classList.remove('hidden');
    
    const privateKeyEl = document.getElementById('myPrivateKey');
    const publicKeyEl = document.getElementById('myPublicKey');
    
    if (privateKeyEl && myKeyPair && myKeyPair.privateKey) {
        privateKeyEl.textContent = ecc.formatKeyForDisplay(myKeyPair.privateKey, 80);
    }
    
    if (publicKeyEl && myKeyPair && myKeyPair.publicKey) {
        const displayKey = ecc.formatPublicKeyForDisplay(myKeyPair.publicKey);
        publicKeyEl.textContent = displayKey.substring(0, 100) + '...';
    }
    
    // Calculate and display key sizes
    displayKeySizes();
}

function displayKeySizes() {
    if (!myKeyPair) return;
    
    // Calculate sizes
    const privateKeySize = myKeyPair.privateKey ? myKeyPair.privateKey.length : 0;
    const publicKeyJwk = myKeyPair.publicKey;
    const publicKeySize = publicKeyJwk ? (publicKeyJwk.x.length + publicKeyJwk.y.length) : 0;
    
    // Calculate in bytes (base64 encoding: 4 chars = 3 bytes)
    const privateKeyBytes = Math.ceil(privateKeySize * 3 / 4);
    const publicKeyBytes = Math.ceil(publicKeySize * 3 / 4);
    const totalBytes = privateKeyBytes + publicKeyBytes;
    
    // Update metrics panel
    const privateKeySizeEl = document.getElementById('privateKeySize');
    const publicKeySizeEl = document.getElementById('publicKeySize');
    const totalKeySizeEl = document.getElementById('totalKeySize');
    
    if (privateKeySizeEl) {
        privateKeySizeEl.textContent = `${privateKeyBytes} bytes`;
    }
    if (publicKeySizeEl) {
        publicKeySizeEl.textContent = `${publicKeyBytes} bytes`;
    }
    if (totalKeySizeEl) {
        totalKeySizeEl.textContent = `${totalBytes} bytes`;
    }
    
    // Log to activity log
    addLog(`🔑 Private Key Size: ${privateKeyBytes} bytes (${privateKeySize} chars)`, 'info');
    addLog(`🔓 Public Key Size: ${publicKeyBytes} bytes (${publicKeySize} chars)`, 'info');
    addLog(`📊 Total Key Pair Size: ${totalBytes} bytes`, 'info');
}

// Peer Management
function updatePeersList(usersInRoom) {
    const peersList = document.getElementById('peersList');
    peersList.innerHTML = '';
    
    const otherUsers = usersInRoom.filter(u => u.socketId !== socket.id);
    
    if (otherUsers.length === 0) {
        peersList.innerHTML = '<p class="waiting-message">Waiting for peers to join...</p>';
        return;
    }
    
    otherUsers.forEach(user => {
        if (!peers.has(user.socketId)) {
            peers.set(user.socketId, {
                socketId: user.socketId,
                username: user.username,
                publicKey: null,
                sharedSecret: null
            });
        }
        
        const peer = peers.get(user.socketId);
        const peerCard = document.createElement('div');
        peerCard.className = 'peer-card';
        peerCard.innerHTML = `
            <div class="peer-info">
                <strong>${user.username}</strong>
                <span class="peer-status ${peer.publicKey ? 'connected' : 'pending'}">
                    ${peer.publicKey ? '🔒 Secure' : '⏳ Pending'}
                </span>
            </div>
            ${myKeyPair && !peer.publicKey ? 
                `<button class="btn btn-small" onclick="sharePublicKey('${user.socketId}')">
                    Share Public Key
                </button>` : ''}
            ${peer.publicKey ? '<span class="key-shared">✓ Keys Exchanged</span>' : ''}
        `;
        peersList.appendChild(peerCard);
    });
}

function sharePublicKey(targetSocketId) {
    if (!myKeyPair) {
        addLog('Generate your keys first!', 'error');
        return;
    }
    
    socket.emit('share-public-key', {
        publicKey: myKeyPair.publicKey,
        targetSocketId,
        isReply: false
    });
    
    const peer = peers.get(targetSocketId);
    if (peer) {
        addLog(`Sending public key to ${peer.username}...`, 'info');
    }
}

// Messaging
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Find first peer with shared secret
    const peer = Array.from(peers.values()).find(p => p.sharedSecret);
    
    if (!peer) {
        addLog('No secure connection established yet', 'error');
        return;
    }
    
    try {
        // Calculate original message size
        const originalSize = new Blob([message]).size;
        addLog(`📝 Original message: "${message}"`, 'process');
        addLog(`📏 Original size: ${originalSize} bytes`, 'info');
        
        // Start timing
        const startTime = performance.now();
        addLog(`🔐 Encrypting with AES-GCM...`, 'process');
        
        const encrypted = await ecc.encrypt(message, peer.sharedSecret);
        
        // End timing
        const endTime = performance.now();
        const encryptionTime = (endTime - startTime).toFixed(2);
        
        // Calculate encrypted size
        const encryptedSize = Math.ceil(encrypted.ciphertext.length * 3 / 4);
        const ivSize = Math.ceil(encrypted.iv.length * 3 / 4);
        const tagSize = Math.ceil(encrypted.tag.length * 3 / 4);
        const totalEncryptedSize = encryptedSize + ivSize + tagSize;
        
        // Show encrypted data with metrics
        addLog(`🔒 Encrypted ciphertext: ${encrypted.ciphertext.substring(0, 40)}...`, 'info');
        addLog(`🔑 IV: ${encrypted.iv.substring(0, 20)}...`, 'info');
        addLog(`⏱️ Encryption time: ${encryptionTime} ms`, 'success');
        addLog(`📦 Encrypted size: ${totalEncryptedSize} bytes (ciphertext: ${encryptedSize}b + IV: ${ivSize}b + tag: ${tagSize}b)`, 'info');
        addLog(`📊 Size overhead: ${((totalEncryptedSize - originalSize) / originalSize * 100).toFixed(1)}%`, 'info');
        addLog(`✅ Sending encrypted message to ${peer.username}`, 'success');
        
        socket.emit('send-message', {
            encryptedMessage: encrypted.ciphertext,
            iv: encrypted.iv,
            tag: encrypted.tag,
            targetSocketId: peer.socketId
        });
        
        displayMessage('You', message, true, encrypted.ciphertext, {
            encryptionTime,
            originalSize,
            encryptedSize: totalEncryptedSize
        });
        input.value = '';
    } catch (error) {
        addLog(`Encryption error: ${error.message}`, 'error');
    }
}

function displayMessage(from, text, isMine, encryptedText, metrics) {
    const container = document.getElementById('messagesContainer');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMine ? 'mine' : 'theirs'}`;
    
    let encryptionInfo = '';
    if (encryptedText) {
        const shortEncrypted = encryptedText.substring(0, 60) + '...';
        
        let metricsHtml = '';
        if (metrics) {
            const time = metrics.encryptionTime || metrics.decryptionTime;
            const timeLabel = metrics.encryptionTime ? 'Encryption' : 'Decryption';
            const overhead = metrics.encryptedSize - metrics.originalSize;
            
            metricsHtml = `
                <div class="metrics-row">
                    <span class="metric">⏱️ ${timeLabel}: ${time}ms</span>
                    <span class="metric">📏 ${metrics.originalSize}b → ${metrics.encryptedSize}b</span>
                    <span class="metric">📊 +${overhead}b overhead</span>
                </div>
            `;
        }
        
        encryptionInfo = `
            <div class="encryption-visualization">
                <div class="encryption-step">
                    <span class="step-label">${isMine ? '🔐 Encrypted:' : '🔓 Decrypted from:'}</span>
                    <span class="encrypted-preview" title="${encryptedText}">${shortEncrypted}</span>
                </div>
                ${metricsHtml}
            </div>
        `;
    }
    
    msgDiv.innerHTML = `
        <div class="message-header">${from}</div>
        <div class="message-text">${text}</div>
        ${encryptionInfo}
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// Activity Log
function addLog(message, type = 'info') {
    const log = document.getElementById('activityLog');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `
        <span class="log-time">${new Date().toLocaleTimeString()}</span>
        <span class="log-message">${message}</span>
    `;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Make sharePublicKey available globally
window.sharePublicKey = sharePublicKey;
