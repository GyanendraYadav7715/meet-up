const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/', (req, res) => {
    res.send('Google Meet Clone API is running');
});

// Socket.io setup for WebRTC signaling
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    // When a user joins a room
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);

        // Notify all other users in the room that a new user joined
        socket.to(roomId).emit('user-connected', userId);

        console.log(`User ${userId} joined room ${roomId}`);

        // Handle messages (e.g., chat)
        socket.on('send-message', (message, sender) => {
            io.to(roomId).emit('receive-message', message, sender);
        });

        // WebRTC Signaling Events
        socket.on('sending-signal', payload => {
            io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID });
        });

        socket.on('returning-signal', payload => {
            io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
        });

        // Handle user explicitly leaving
        socket.on('leave-room', () => {
            socket.leave(roomId);
            socket.to(roomId).emit('user-disconnected', userId);
            console.log(`User ${userId} left room ${roomId}`);
        });

        // Handle disconnect (closes tab or loses connection)
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
            console.log(`User ${userId} disconnected from room ${roomId}`);
        });
    });
});

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/google-meet-clone';

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('MongoDB connected successfully');
            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err);
        });
}

module.exports = { app, server };
