/**
 * Simple logging utility
 */
export declare function log(message: string, ...args: any[]): void;
/**
 * Simple error logging utility
 */
export declare function logError(message: string, error?: any): void;
/**
 * Simple warning logging utility
 */
export declare function logWarn(message: string, ...args: any[]): void;
/**
 * Error types for the BIP44 plugin
 */
export declare enum ErrorType {
    AUTHENTICATION = "AuthenticationError",
    WALLET = "WalletError",
    VALIDATION = "ValidationError",
    NETWORK = "NetworkError"
}
/**
 * Simple error handler
 */
export declare class ErrorHandler {
    static handle(type: ErrorType, code: string, message: string, originalError?: any): void;
}
/**
 * Simple EventEmitter implementation
 */
export declare class EventEmitter {
    private events;
    on(event: string, listener: Function): void;
    emit(event: string, ...args: any[]): void;
    off(event: string, listener: Function): void;
    removeAllListeners(event?: string): void;
}
