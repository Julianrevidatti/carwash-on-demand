declare module 'sql.js' {
    interface SqlJsStatic {
        Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
    }

    interface Database {
        run(sql: string, params?: any[]): Database;
        exec(sql: string, params?: any[]): QueryExecResult[];
        prepare(sql: string): Statement;
        getRowsModified(): number;
        export(): Uint8Array;
        close(): void;
    }

    interface Statement {
        bind(params?: any[]): boolean;
        step(): boolean;
        getAsObject(): Record<string, any>;
        get(): any[];
        free(): boolean;
        reset(): void;
    }

    interface QueryExecResult {
        columns: string[];
        values: any[][];
    }

    interface SqlJsOptions {
        locateFile?: (filename: string) => string;
        wasmBinary?: ArrayLike<number> | Buffer;
    }

    export type { Database as Database };
    export default function initSqlJs(options?: SqlJsOptions): Promise<SqlJsStatic>;
}
