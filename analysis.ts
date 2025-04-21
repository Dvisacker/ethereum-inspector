import { HyperSync } from "./hypersync";
import { isSmartContract } from "./evm";

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

export interface RelatedWallet {
  address: string;
  type: "sender" | "receiver";
  value: bigint;
  timestamp: number;
}

export class TransactionAnalyzer {
  private hyperSync: HyperSync;

  constructor() {
    this.hyperSync = new HyperSync();
  }

  /**
   * Gets all related wallets (EOAs) that interacted with the given address
   * @param address The address to analyze
   * @param fromBlock Optional starting block number
   * @param toBlock Optional ending block number
   * @returns Promise<RelatedWallet[]> List of related EOA wallets
   */
  async getRelatedWallets(
    address: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<RelatedWallet[]> {
    // Get all transfers involving the address
    const { transactions, logs, blocks } = await this.hyperSync.getOutflows([
      address,
    ]);

    // Create block number to timestamp mapping
    const blockTimestamps = new Map<number, number>();
    blocks.forEach((block) => {
      if (block.timestamp && block.number) {
        blockTimestamps.set(block.number, block.timestamp);
      }
    });

    // Process transactions and collect unique addresses
    const relatedAddresses = new Set<string>();
    const relatedWallets: RelatedWallet[] = [];

    // Process regular transactions
    for (const tx of transactions) {
      // Skip if block number is undefined
      if (!tx.blockNumber) continue;

      // Skip if outside the specified block range
      if (fromBlock && tx.blockNumber < fromBlock) continue;
      if (toBlock && tx.blockNumber > toBlock) continue;

      const timestamp = blockTimestamps.get(tx.blockNumber) || 0;

      // Check sender
      if (tx.from && tx.from !== address && !relatedAddresses.has(tx.from)) {
        relatedAddresses.add(tx.from);
        relatedWallets.push({
          address: tx.from,
          type: "sender",
          value: BigInt(tx.value || "0"),
          timestamp,
        });
      }

      // Check receiver
      if (tx.to && tx.to !== address && !relatedAddresses.has(tx.to)) {
        relatedAddresses.add(tx.to);
        relatedWallets.push({
          address: tx.to,
          type: "receiver",
          value: BigInt(tx.value || "0"),
          timestamp,
        });
      }
    }

    // Process ERC20 transfers from logs
    for (const log of logs) {
      // Skip if block number is undefined or topics are missing
      if (!log.blockNumber || !log.topics || log.topics.length < 3) continue;

      const fromTopic = log.topics[1];
      const toTopic = log.topics[2];
      if (!fromTopic || !toTopic) continue;

      const from = "0x" + fromTopic.slice(26);
      const to = "0x" + toTopic.slice(26);
      const value = BigInt(log.data || "0");

      if (from !== address && !relatedAddresses.has(from)) {
        relatedAddresses.add(from);
        relatedWallets.push({
          address: from,
          type: "sender",
          value,
          timestamp: blockTimestamps.get(log.blockNumber) || 0,
        });
      }

      if (to !== address && !relatedAddresses.has(to)) {
        relatedAddresses.add(to);
        relatedWallets.push({
          address: to,
          type: "receiver",
          value,
          timestamp: blockTimestamps.get(log.blockNumber) || 0,
        });
      }
    }

    // Filter out smart contracts
    const eoaWallets: RelatedWallet[] = [];
    for (const wallet of relatedWallets) {
      const isContract = await isSmartContract(wallet.address);
      if (!isContract) {
        eoaWallets.push(wallet);
      }
    }

    return eoaWallets;
  }

  /**
   * Analyzes the timing patterns of transactions made by an address
   * @param address The address to analyze
   * @returns Promise<TransactionTimingAnalysis> Analysis of transaction timing patterns
   */
  async analyzeTransactionTiming(
    address: string
  ): Promise<TransactionTimingAnalysis> {
    const { transactions, blocks } =
      await this.hyperSync.getTransactionsToAddress(address);

    // Create block number to timestamp mapping
    const blockTimestamps = new Map<number, number>();
    blocks.forEach((block) => {
      if (block.timestamp && block.number) {
        blockTimestamps.set(block.number, block.timestamp);
      }
    });

    // Initialize distributions
    const hourlyDistribution: { [hour: number]: number } = {};
    const dailyDistribution: { [day: number]: number } = {};
    const monthlyDistribution: { [month: number]: number } = {};

    // Process each transaction
    transactions.forEach((tx) => {
      if (tx.blockNumber) {
        const timestamp = blockTimestamps.get(tx.blockNumber);

        if (timestamp) {
          const date = new Date(timestamp * 1000);

          // Update hourly distribution
          const hour = date.getUTCHours();
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;

          // Update daily distribution (0 = Sunday, 6 = Saturday)
          const day = date.getUTCDay();
          dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;

          // Update monthly distribution (0 = January, 11 = December)
          const month = date.getUTCMonth();
          monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
        }
      }
    });

    // Calculate statistics
    const totalTransactions = transactions.length;
    const daysWithTransactions = Object.keys(dailyDistribution).length;
    const averageTransactionsPerDay =
      totalTransactions / (daysWithTransactions || 1);

    // Find busiest periods
    const findBusiestPeriod = (distribution: { [key: number]: number }) => {
      let maxCount = 0;
      let busiestPeriod = 0;

      Object.entries(distribution).forEach(([period, count]) => {
        if (count > maxCount) {
          maxCount = count;
          busiestPeriod = Number(period);
        }
      });

      return { period: busiestPeriod, count: maxCount };
    };

    const busiestHour = findBusiestPeriod(hourlyDistribution);
    const busiestDay = findBusiestPeriod(dailyDistribution);
    const busiestMonth = findBusiestPeriod(monthlyDistribution);

    return {
      hourlyDistribution,
      dailyDistribution,
      monthlyDistribution,
      totalTransactions,
      averageTransactionsPerDay,
      busiestHour: { hour: busiestHour.period, count: busiestHour.count },
      busiestDay: { day: busiestDay.period, count: busiestDay.count },
      busiestMonth: { month: busiestMonth.period, count: busiestMonth.count },
    };
  }

  /**
   * Formats the analysis results into a human-readable string
   * @param analysis The analysis results to format
   * @returns string Formatted analysis results
   */
  formatAnalysis(analysis: TransactionTimingAnalysis): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return `
Transaction Timing Analysis:
---------------------------
Total Transactions: ${analysis.totalTransactions}
Average Transactions per Day: ${analysis.averageTransactionsPerDay.toFixed(2)}

Busiest Periods:
- Hour: ${analysis.busiestHour.hour}:00 UTC (${
      analysis.busiestHour.count
    } transactions)
- Day: ${days[analysis.busiestDay.day]} (${
      analysis.busiestDay.count
    } transactions)
- Month: ${months[analysis.busiestMonth.month]} (${
      analysis.busiestMonth.count
    } transactions)

Hourly Distribution:
${Object.entries(analysis.hourlyDistribution)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(
    ([hour, count]) =>
      `  ${hour.toString().padStart(2, "0")}:00 - ${count} transactions`
  )
  .join("\n")}

Daily Distribution:
${Object.entries(analysis.dailyDistribution)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([day, count]) => `  ${days[Number(day)]} - ${count} transactions`)
  .join("\n")}

Monthly Distribution:
${Object.entries(analysis.monthlyDistribution)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([month, count]) => `  ${months[Number(month)]} - ${count} transactions`)
  .join("\n")}
    `;
  }
}
