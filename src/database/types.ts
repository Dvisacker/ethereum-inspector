import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Contract = {
    id: Generated<number>;
    address: string;
    networkId: number;
    name: string | null;
    /**
     * @kyselyType(boolean)
     */
    isProxy: Generated<boolean>;
    proxyType: string | null;
    implementationAddress: string | null;
    entity: string | null;
    bytecode: string | null;
    deployedBytecode: string | null;
    abi: string | null;
};
export type DB = {
    contracts: Contract;
};
