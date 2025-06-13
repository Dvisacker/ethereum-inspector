import {
  Block,
  DecodedEvent,
  Log,
  Transaction,
} from "@envio-dev/hypersync-client";
import { ProxyType } from "./etherscan";
import { NetworkId } from "./constants";

export interface Address {
  address: string;
  arkhamEntity?: Entity;
  arkhamLabel?: Label;
}

export interface Entity {
  id: string;
  name: string;
}

export interface Label {
  name: string;
}

export interface TransferResponse {
  transfers: {
    fromAddress: Address[];
    toAddress: Address[];
  }[];
}

export interface LabelResult {
  address: string;
  label?: Label;
  entity: Entity;
}

export interface ContractInfo {
  address: string;
  txCount: number;
  entity: string;
  label: string;
  name: string;
  isProxy: boolean;
  proxyType: ProxyType | undefined;
  implementationName: string | undefined;
}

export interface HyperSyncData {
  transactions: Transaction[];
  logs: Log[];
  decodedLogs: DecodedEvent[];
  blocks: Block[];
}

export interface Transfer {
  from: string;
  to: string;
  amount: string;
  tokenAddress: string;
  networkId: NetworkId;
  symbol: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}
