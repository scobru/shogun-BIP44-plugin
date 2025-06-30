/**
 * Simple logging utility
 */
export function log(message, ...args) {
    console.log(`[BIP44] ${message}`, ...args);
}
/**
 * Simple error logging utility
 */
export function logError(message, error) {
    console.error(`[BIP44] ${message}`, error);
}
/**
 * Simple warning logging utility
 */
export function logWarn(message, ...args) {
    console.warn(`[BIP44] ${message}`, ...args);
}
/**
 * Error types for the BIP44 plugin
 */
export var ErrorType;
(function (ErrorType) {
    ErrorType["AUTHENTICATION"] = "AuthenticationError";
    ErrorType["WALLET"] = "WalletError";
    ErrorType["VALIDATION"] = "ValidationError";
    ErrorType["NETWORK"] = "NetworkError";
})(ErrorType || (ErrorType = {}));
/**
 * Simple error handler
 */
export class ErrorHandler {
    static handle(type, code, message, originalError) {
        const error = new Error(`[${type}] ${code}: ${message}`);
        if (originalError) {
            console.error("Original error:", originalError);
        }
        console.error(error);
    }
}
/**
 * Simple EventEmitter implementation
 */
export class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(listener => {
                try {
                    listener(...args);
                }
                catch (error) {
                    logError(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    off(event, listener) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
    }
    removeAllListeners(event) {
        if (event) {
            delete this.events[event];
        }
        else {
            this.events = {};
        }
    }
}
//# sourceMappingURL=utils.js.map