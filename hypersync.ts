import {
  HypersyncClient,
  Decoder,
  BlockField,
  LogField,
  TransactionField,
} from "@envio-dev/hypersync-client";
import { addressToTopic } from "./helpers";

const transferTopic =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export interface TransactionTimingAnalysis {
  hourlyDistribution: { [hour: number]: number };
  dailyDistribution: { [day: number]: number };
  monthlyDistribution: { [month: number]: number };
  totalTransactions: number;
  averageTransactionsPerDay: number;
  busiestHour: { hour: number; count: number };
  busiestDay: { day: number; count: number };
  busiestMonth: { month: number; count: number };
}

export class HyperSync {
  private client: HypersyncClient;
  private decoder: Decoder;

  constructor() {
    this.client = HypersyncClient.new({
      url: "https://eth.hypersync.xyz",
    });
    this.decoder = Decoder.fromSignatures([
      "Transfer(address indexed from, address indexed to, uint amount)",
    ]);
  }

  private async executeQuery(query: any) {
    console.log("Running hypersync query...");
    const { data } = await this.client.get(query);
    const { transactions, logs, blocks } = data;
    const decodedLogs = await this.decoder.decodeLogs(logs);
    return { transactions, logs, decodedLogs, blocks };
  }

  private getBaseFieldSelection() {
    return {
      block: [BlockField.Number, BlockField.Timestamp, BlockField.Hash],
      log: [
        LogField.BlockNumber,
        LogField.LogIndex,
        LogField.TransactionIndex,
        LogField.TransactionHash,
        LogField.Data,
        LogField.Address,
        LogField.Topic0,
        LogField.Topic1,
        LogField.Topic2,
        LogField.Topic3,
      ],
      transaction: [
        TransactionField.BlockNumber,
        TransactionField.TransactionIndex,
        TransactionField.Hash,
        TransactionField.From,
        TransactionField.To,
        TransactionField.Value,
        TransactionField.Input,
      ],
    };
  }

  async getAllTransfers(addresses: string[]) {
    const addressTopicFilter = addresses.map(addressToTopic);

    const query = {
      fromBlock: 0,
      logs: [
        {
          topics: [[transferTopic], [], addressTopicFilter, []],
        },
        {
          topics: [[transferTopic], addressTopicFilter, [], []],
        },
      ],
      transactions: [
        {
          from: addresses,
        },
        {
          to: addresses,
        },
      ],
      fieldSelection: this.getBaseFieldSelection(),
    };

    return this.executeQuery(query);
  }

  async getOutflows(addresses: string[]) {
    const addressTopicFilter = addresses.map(addressToTopic);

    const query = {
      fromBlock: 0,
      logs: [
        {
          topics: [[transferTopic], addressTopicFilter, [], []],
        },
      ],
      transactions: [
        {
          from: addresses,
        },
      ],
      fieldSelection: this.getBaseFieldSelection(),
    };

    return this.executeQuery(query);
  }

  async getInflows(addresses: string[]) {
    const addressTopicFilter = addresses.map(addressToTopic);

    const query = {
      fromBlock: 0,
      logs: [
        {
          topics: [[transferTopic], [], addressTopicFilter, []],
        },
      ],
      transactions: [
        {
          to: addresses,
        },
      ],
      fieldSelection: this.getBaseFieldSelection(),
    };

    return this.executeQuery(query);
  }

  /**
   * Gets all transactions to a given address
   * @param address The address to get transactions for
   * @returns Promise<{transactions: any[], logs: any[]}> The transactions and logs
   */
  async getTransactionsToAddress(address: string) {
    const query = {
      fromBlock: 0,
      transactions: [
        {
          to: [address],
        },
      ],
      fieldSelection: this.getBaseFieldSelection(),
    };

    return this.executeQuery(query);
  }

  async getTransactionsTo(addresses: string[]) {
    const query = {
      fromBlock: 0,
      transactions: [
        {
          to: addresses,
        },
      ],
      fieldSelection: this.getBaseFieldSelection(),
    };

    return this.executeQuery(query);
  }

  async getTransactionsFrom(addresses: string[]) {
    const query = {
      fromBlock: 0,
      transactions: [
        {
          from: addresses,
        },
      ],
      fieldSelection: this.getBaseFieldSelection(),
    };

    return this.executeQuery(query);
  }
}
