const { transports, createLogger, format } = require('winston');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');

// Determine if the environment is production or development

const isLocal = CONFIG.MOOD === 'dev'; // Set your environment variable accordingly

// Define logging options
const options = {
    file: {
        level: 'info',
        filename: CONFIG.LOG_FILE_LOCATION, // Not used in production
        handleExceptions: true,
        json: true,
        maxsize: 10485760, // 10MB
        maxFiles: 10,
        colorize: false,
        timestamp: true,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
        timestamp: true,
    },
};

// Create logger
const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports:
    isLocal? 
    [
        new transports.File(options.file),
        new transports.Console(options.console)
    ]:[
        new transports.Console(options.console) // Use console logging in all environments
    ],
    exitOnError: false, // Do not exit on handled exceptions
});

// Stream for other libraries like Morgan
logger.stream = {
    write: function(message, encoding) {
        // Log messages using the 'info' level for both transports
        logger.info(message.trim());
    },
};

module.exports = logger;
