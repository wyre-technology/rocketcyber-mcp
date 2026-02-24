"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value))
                return '[Circular Reference]';
            seen.add(value);
        }
        if (value instanceof Error) {
            return { name: value.name, message: value.message, stack: value.stack };
        }
        return value;
    });
}
class Logger {
    constructor(level = 'info', format = 'json') {
        this.winston = winston_1.default.createLogger({
            level,
            format: format === 'json'
                ? winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                    return safeStringify({ level, message, timestamp, ...meta });
                }))
                : winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length > 0 ? ` ${safeStringify(meta)}` : '';
                    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
                })),
            transports: [
                new winston_1.default.transports.Console({
                    stderrLevels: ['error', 'warn', 'info', 'debug']
                })
            ]
        });
    }
    error(message, meta) { this.winston.error(message, meta); }
    warn(message, meta) { this.winston.warn(message, meta); }
    info(message, meta) { this.winston.info(message, meta); }
    debug(message, meta) { this.winston.debug(message, meta); }
    setLevel(level) { this.winston.level = level; }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map