import {
  HypersyncClient,
  Decoder,
  BlockField,
  LogField,
  TransactionField,
  Log,
  DecodedEvent,
} from "@envio-dev/hypersync-client";
import { addressToTopic } from "./helpers";

const transferTopic =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const WHITELISTED_TOKENS = {
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7", // Ethereum Mainnet USDT
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Ethereum Mainnet USDC
  WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // Ethereum Mainnet WETH
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f", // Ethereum Mainnet DAI
  WBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // Ethereum Mainnet WBTC
  USDS: "0xdc035d45d973e3ec169d2276ddab16f1e407384f", // Ethereum Mainnet USDS
} as const;

export const addressToSymbol = {
  [WHITELISTED_TOKENS.USDT]: "USDT",
  [WHITELISTED_TOKENS.USDC]: "USDC",
  [WHITELISTED_TOKENS.WETH]: "WETH",
  [WHITELISTED_TOKENS.DAI]: "DAI",
  [WHITELISTED_TOKENS.WBTC]: "WBTC",
  [WHITELISTED_TOKENS.USDS]: "USDS",
} as const;

export const ETHER = 1e18;

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

  async getOutflowsAndWhitelistedInflows(
    addresses: string[],
    tokenWhitelist?: string[]
  ) {
    const addressTopicFilter = addresses.map(addressToTopic);

    const tokenAddresses = tokenWhitelist
      ? tokenWhitelist
      : Object.values(WHITELISTED_TOKENS);

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
      : Object.values(WHITELISTED_TOKENS);

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

  async parseERC20Logs(
    logs: Log[],
    decodedLogs: DecodedEvent[],
    addressToSymbol: Record<string, string>
  ) {
    const transfers: {
      from: string;
      to: string;
      amount: bigint;
      symbol: string;
    }[] = [];

    for (let i = 0; i < decodedLogs.length; i++) {
      const decodedLog = decodedLogs[i];
      const log = logs[i];

      const tokenAddress = log.address;
      const from = decodedLog.indexed[0].val as string;
      const to = decodedLog.indexed[1].val as string;
      const amount = decodedLog.body[0].val as string;

      if (!tokenAddress || !from || !to || !amount) {
        continue;
      }

      const symbol = addressToSymbol[tokenAddress];

      transfers.push({
        from: from,
        to: to,
        amount: BigInt(amount),
        symbol,
      });
    }

    return transfers;
  }
}
