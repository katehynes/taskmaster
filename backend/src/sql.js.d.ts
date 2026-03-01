declare module "sql.js" {
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }
  export interface Database {
    run(sql: string, params?: unknown[] | Record<string, unknown>): this;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    getRowsModified(): number;
    export(): Uint8Array;
    close(): void;
  }
  export interface Statement {
    bind(values: unknown[] | Record<string, unknown>): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }
  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}
