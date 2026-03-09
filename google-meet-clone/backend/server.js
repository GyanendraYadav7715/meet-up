const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const createDOMPurify = require('dompurify');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const logRoutes = require('./routes/logs');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Logging Middleware
app.use(morgan('combined', { stream: logger.stream }));

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5000", "http://localhost:3000"], // Note: In production you would use specific domains
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            workerSrc: ["'self'", "blob:"],
        }
    }
})); // Strict HTTP Headers

app.use(cors({
    origin: ['http://localhost:3000'], // Only allow frontend server
    credentials: true,
}));

// Apply Rate Limiting globally or on specific routes (currently limiting everything uniformly for MVP protection)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
    message: 'Too many requests from this IP, please try again after a minute',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body. Limit to 10kb
app.use(cookieParser()); // Parse cookies
app.use(mongoSanitize()); // Prevent NoSQL Injection

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/logs', logRoutes);

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

const roomParticipants = new Map();

io.on('connection', (socket) => {
    logger.info('User connected to socket', { meta: { socketId: socket.id } });

    // When a user joins a room
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);

        if (!roomParticipants.has(roomId)) {
            roomParticipants.set(roomId, new Set());
        }
        roomParticipants.get(roomId).add(socket.id);

        const peerCount = roomParticipants.get(roomId).size;

        // Notify all other users in the room that a new user joined, providing current peer count
        socket.to(roomId).emit('user-connected', userId, peerCount);

        // Let the joining user know the total count to decide topology
        socket.emit('room-info', { peerCount });

        logger.info('User joined room', { meta: { socketId: socket.id, roomId, userId, peerCount } });

        // Handle messages (e.g., chat)
        socket.on('send-message', (message, sender) => {
            const cleanMessage = DOMPurify.sanitize(message);
            const cleanSender = DOMPurify.sanitize(sender);
            io.to(roomId).emit('receive-message', cleanMessage, cleanSender);
        });

        // Handle live captions
        socket.on('send-caption', (payload) => {
            // payload: { text, senderName, language, isFinal }
            const cleanText = DOMPurify.sanitize(payload.text);
            const cleanSender = DOMPurify.sanitize(payload.senderName);
            const cleanLang = DOMPurify.sanitize(payload.language);

            io.to(roomId).emit('receive-caption', {
                text: cleanText,
                senderName: cleanSender,
                language: cleanLang,
                isFinal: !!payload.isFinal,
                timestamp: Date.now()
            });
        });

        // WebRTC Signaling Events
        socket.on('sending-signal', payload => {
            io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID });
        });

        socket.on('returning-signal', payload => {
            io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
        });

        // --- SFU Simulation via Socket Relay ---
        socket.on('relay-media', payload => {
            // Forward the chunk to all other peers in the room
            socket.to(roomId).emit('relayed-media', payload);
        });

        const handleLeave = () => {
            if (roomParticipants.has(roomId)) {
                roomParticipants.get(roomId).delete(socket.id);
                if (roomParticipants.get(roomId).size === 0) {
                    roomParticipants.delete(roomId);
                }
            }
            socket.to(roomId).emit('user-disconnected', userId);
        };

        // Handle user explicitly leaving
        socket.on('leave-room', () => {
            socket.leave(roomId);
            handleLeave();
            logger.info('User left room', { meta: { socketId: socket.id, roomId, userId } });
        });

        // Handle disconnect (closes tab or loses connection)
        socket.on('disconnect', () => {
            handleLeave();
            logger.warn('User disconnected abruptly', { meta: { socketId: socket.id, roomId, userId } });
        });
    });
});

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/google-meet-clone';

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(MONGO_URI)
        .then(() => {
            logger.info('MongoDB connected successfully');
            server.listen(PORT, () => {
                logger.info(`Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            logger.error('MongoDB connection error', { meta: { error: err.message }, stack: err.stack });
        });
}

module.exports = { app, server };
