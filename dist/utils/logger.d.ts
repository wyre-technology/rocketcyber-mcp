export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogFormat = 'json' | 'simple';
export declare class Logger {
    private winston;
    constructor(level?: LogLevel, format?: LogFormat);
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    setLevel(level: LogLevel): void;
}
//# sourceMappingURL=logger.d.ts.map