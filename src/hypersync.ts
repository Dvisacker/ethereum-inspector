import {
  HypersyncClient,
  Decoder,
  BlockField,
  LogField,
  TransactionField,
  Log,
  DecodedEvent,
  Block,
  Transaction,
  Query,
} from "@envio-dev/hypersync-client";
import { addressToTopic } from "./helpers";
import {
  TOKENS_BY_NETWORK,
  getTokenSymbolByAddress,
  NetworkId,
  NETWORKS,
} from "./constants";
import { Transfer } from "./types";

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

export interface TransactionWithTimestamp extends Transaction {
  timestamp: number;
}

export function parseTransactions(
  transactions: Transaction[],
  blocks: Block[]
): TransactionWithTimestamp[] {
  const blockTimestampMap = new Map<number, number>();
  for (const block of blocks) {
    if (
      typeof block.number === "number" &&
      typeof block.timestamp === "number"
    ) {
      blockTimestampMap.set(block.number, block.timestamp);
    }
  }
  return transactions.map((tx) => ({
    ...tx,
    timestamp:
      typeof tx.blockNumber === "number"
        ? blockTimestampMap.get(tx.blockNumber) || 0
        : 0,
  }));
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

  private async executeQuery(query: Query) {
    let transactions: Transaction[] = [];
    let logs: Log[] = [];
    let blocks: Block[] = [];
    let decodedLogs: DecodedEvent[] = [];
    const height = await this.client.getHeight();
    let numResults = 0;

    if (!height) {
      throw new Error("No height found");
    }

    while (
      height > query.fromBlock &&
      (!query.maxNumTransactions || numResults < query.maxNumTransactions)
    ) {
      // console.log("Querying from block:", query.fromBlock);
      const res = await this.client.get(query);
      const { data } = res;
      const decoded = await this.decoder.decodeLogs(data.logs);
      if (data.transactions.length !== 0) {
        transactions.push(...data.transactions);
        logs.push(...data.logs);
        blocks.push(...data.blocks);
        decodedLogs.push(...((decoded || []) as DecodedEvent[]));
        numResults += data.transactions.length;
      }

      query.fromBlock = res.nextBlock;
    }

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

  async getOutflowsAndWhitelistedInflows(
    addresses: string[],
    tokenWhitelist?: string[]
  ) {
    const addressTopicFilter = addresses.map(addressToTopic);

    const tokenAddresses = tokenWhitelist
      ? tokenWhitelist
      : Object.keys(TOKENS_BY_NETWORK[NETWORKS.MAINNET]);

    const query = {
      fromBlock: 0,
      logs: [
        // outflows
        {
          topics: [[transferTopic], addressTopicFilter, [], []],
        },
        // whitelisted inflows (we only consider USDC, USDT, etc. transfers to avoid spam transactions)
        {
          topics: [[transferTopic], [], addressTopicFilter, []],
          address: tokenAddresses,
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
      fieldSelection: {
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
      },
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

  async getFirstTransactionsTo(addresses: string[]) {
    const query = {
      fromBlock: 0,
      transactions: [
        {
          to: addresses,
        },
      ],
      fieldSelection: {
        transaction: [
          TransactionField.BlockNumber,
          TransactionField.TransactionIndex,
          TransactionField.Hash,
          TransactionField.From,
          TransactionField.To,
          TransactionField.Value,
          TransactionField.Input,
        ],
        block: [BlockField.Number, BlockField.Timestamp],
      },
      // Get one transaction per address
      limit: addresses.length,
      // Sort by block number and transaction index in ascending order
      orderBy: [
        { field: "blockNumber", direction: "asc" },
        { field: "transactionIndex", direction: "asc" },
      ],
    };

    const { transactions, blocks } = await this.executeQuery(query);

    // Create a map of block numbers to timestamps for quick lookup
    const blockTimestampMap = new Map(
      blocks.map((block) => [block.number, block.timestamp])
    );

    // Group transactions by recipient address
    const transactionsByAddress = new Map<string, any>();

    for (const tx of transactions) {
      // Only process if we haven't found a transaction for this address yet
      if (tx.to && !transactionsByAddress.has(tx.to)) {
        transactionsByAddress.set(tx.to, {
          ...tx,
          timestamp: blockTimestampMap.get(tx.blockNumber),
        });
      }
    }

    // Create result object with all addresses, even those without transactions
    const result = new Map<string, any>();
    for (const address of addresses) {
      result.set(address, transactionsByAddress.get(address) || null);
    }

    return result;
  }

  /* 
  This function queries incoming ERC20 transfers for a list of ERC20 tokens. This is useful
  for getting approximate inflows while avoiding spam transactions (in particular, spam ERC20 transfers 
  can make it seem like a spammer account is related to a wallet when it is not, so it's important to filter 
  out these spam transactions)
   */
  async getWhitelistedTokenInflows(
    addresses: string[],
    token_whitelist?: string[]
  ) {
    const addressTopicFilter = addresses.map(addressToTopic);
    const tokenAddresses = token_whitelist
      ? token_whitelist
      : Object.keys(TOKENS_BY_NETWORK[NETWORKS.MAINNET]);

    const query = {
      fromBlock: 0,
      logs: [
        {
          topics: [[transferTopic], [], addressTopicFilter, []],
          address: tokenAddresses,
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

  async getAddressFirstReceivedTransaction(address: string) {
    const query = {
      fromBlock: 0,
      transactions: [{ to: [address] }],
      fieldSelection: this.getBaseFieldSelection(),
      maxNumTransactions: 1,
      orderBy: [{ field: "blockNumber", direction: "asc" }],
    };

    return this.executeQuery(query);
  }

  async parseTransfers(
    logs: Log[],
    decodedLogs: DecodedEvent[],
    transactions: Transaction[],
    blocks: Block[],
    networkId: NetworkId
  ) {
    const transfers: Transfer[] = [];

    for (let i = 0; i < decodedLogs.length; i++) {
      const decodedLog = decodedLogs[i];
      const log = logs[i];
      const transaction = transactions.find(
        (tx) => tx.hash === log.transactionHash
      );
      const block = blocks.find((b) => b.number === transaction?.blockNumber);

      if (!decodedLog || !log || !block) {
        continue;
      }

      const tokenAddress = log.address;
      const from = decodedLog.indexed[0].val as string;
      const to = decodedLog.indexed[1].val as string;
      const amount = decodedLog.body[0].val as string;

      if (!tokenAddress || !from || !to || !amount) {
        continue;
      }

      const symbol = getTokenSymbolByAddress(tokenAddress, networkId) || "";

      transfers.push({
        from: from,
        to: to,
        networkId: networkId,
        tokenAddress: tokenAddress,
        amount: amount.toString(),
        symbol,
        txHash: transaction?.hash || "",
        blockNumber: transaction?.blockNumber || 0,
        timestamp: block.timestamp || 0,
      });
    }

    return transfers;
  }
}
