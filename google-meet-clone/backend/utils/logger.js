const winston = require('winston');
require('winston-mongodb');
require('winston-daily-rotate-file');

// Redact sensitive keys from log metadata
const redactSensitiveData = winston.format((info) => {
    if (info.meta) {
        const sensitiveKeys = ['password', 'token', 'refreshToken', 'JWT', 'secret'];
        const redact = (obj) => {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (sensitiveKeys.includes(key.toLowerCase())) {
                        obj[key] = '[REDACTED]';
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        redact(obj[key]);
                    }
                }
            }
        };
        // Clone to avoid mutating the actual request object during logging
        const metaClone = JSON.parse(JSON.stringify(info.meta));
        redact(metaClone);
        info.meta = metaClone;
    }
    return info;
});

const logFormat = winston.format.combine(
    redactSensitiveData(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define Transports based on Environment
const transports = [];

// Base Console output for immediate developer feedback
transports.push(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, meta, stack }) => {
                let logMsg = `[${timestamp}] ${level}: ${message}`;
                if (meta && Object.keys(meta).length) {
                    logMsg += ` | ${JSON.stringify(meta)}`;
                }
                if (stack) logMsg += `\n${stack}`;
                return logMsg;
            })
        ),
        level: 'debug'
    })
);

if (process.env.NODE_ENV === 'production') {
    // Production: Low overhead, highly scalable daily rotated files
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '5m',
            maxFiles: '7d',
            level: 'info'
        })
    );
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '5m',
            maxFiles: '14d',
            level: 'error'
        })
    );
} else {
    // Development / Staging: Queryable MongoDB transport
    // Note: Winston-MongoDB requires the URI string or a promised connection.
    // For simplicity, we assume MONGO_URI is set before logger invokes, or fallback.
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/google-meet-clone';
    transports.push(
        new winston.transports.MongoDB({
            db: mongoUri,
            options: { useUnifiedTopology: true },
            collection: 'logs',
            level: 'debug',
            storeHost: true,
            capped: true,
            cappedSize: 10485760, // 10MB
            metaKey: 'meta'
        })
    );
}

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: transports,
    exitOnError: false
});

// Stream for Morgan integration
logger.stream = {
    write: function (message) {
        // Morgan attaches a trailing newline, remove it
        logger.info(message.substring(0, message.lastIndexOf('\n')));
    }
};

module.exports = logger;
