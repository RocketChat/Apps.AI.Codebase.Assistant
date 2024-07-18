export interface IDB {
    verifyConnectivity(): Promise<void>;

    closeDBConnection(): Promise<void>;

    beginTransaction(): Promise<void>;

    commitTransaction(): Promise<void>;

    rollbackTransaction(): Promise<void>;

    run(query: string, params?: any): Promise<Record<string, any>[]>;
}
