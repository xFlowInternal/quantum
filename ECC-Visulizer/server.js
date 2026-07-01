// ECC Chat Server - Real-time multi-device chat with WebSocket
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins with username
    socket.on('join', (data) => {
        const { username, roomId } = data;
        
        socket.username = username;
        socket.roomId = roomId;
        socket.join(roomId);

        // Store user info
        users.set(socket.id, { username, roomId, socketId: socket.id });

        // Get or create room
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);

        // Notify room about new user
        io.to(roomId).emit('user-joined', {
            username,
            socketId: socket.id,
            usersInRoom: Array.from(rooms.get(roomId)).map(id => ({
                socketId: id,
                username: users.get(id)?.username
            }))
        });

        console.log(`${username} joined room ${roomId}`);
    });

    // Curve selection broadcast
    socket.on('curve-selected', (data) => {
        socket.to(socket.roomId).emit('peer-curve-selected', {
            curve: data.curve,
            from: socket.username,
            socketId: socket.id
        });
    });

    // Key generation notification
    socket.on('keys-generated', (data) => {
        socket.to(socket.roomId).emit('peer-keys-generated', {
            from: socket.username,
            socketId: socket.id
        });
    });

    // Public key sharing
    socket.on('share-public-key', (data) => {
        const { publicKey, targetSocketId, isReply } = data;
        
        io.to(targetSocketId).emit('receive-public-key', {
            publicKey,
            from: socket.username,
            fromSocketId: socket.id,
            isReply: isReply || false
        });
    });

    // Encrypted message
    socket.on('send-message', (data) => {
        const { encryptedMessage, targetSocketId, iv, tag } = data;
        
        io.to(targetSocketId).emit('receive-message', {
            encryptedMessage,
            iv,
            tag,
            from: socket.username,
            fromSocketId: socket.id,
            timestamp: Date.now()
        });
    });

    // Processing step visualization
    socket.on('processing-step', (data) => {
        socket.to(socket.roomId).emit('peer-processing-step', {
            step: data.step,
            details: data.details,
            from: socket.username,
            socketId: socket.id
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        if (socket.roomId && rooms.has(socket.roomId)) {
            rooms.get(socket.roomId).delete(socket.id);
            
            io.to(socket.roomId).emit('user-left', {
                username: socket.username,
                socketId: socket.id,
                usersInRoom: Array.from(rooms.get(socket.roomId)).map(id => ({
                    socketId: id,
                    username: users.get(id)?.username
                }))
            });

            if (rooms.get(socket.roomId).size === 0) {
                rooms.delete(socket.roomId);
            }
        }
        
        users.delete(socket.id);
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`ECC Chat Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
    console.log(`\nFor mobile testing, use your local IP address:`);
    console.log(`Example: http://192.168.x.x:${PORT}`);
    console.log(`\nNote: Mobile Chrome requires HTTPS for Web Crypto API.`);
    console.log(`For production, deploy to Heroku/Railway for automatic HTTPS.`);
});
