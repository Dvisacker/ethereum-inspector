import { ETHER, HyperSync } from "./hypersync";
import { getContractName, isSmartContract } from "./evm";
import { Transaction } from "@envio-dev/hypersync-client";
import { find6HourTimeframes, inferTimezoneRegion } from "./time";
import { findBusiestPeriod } from "./time";
import { ArkhamClient } from "./arkham";

export interface TransactionTimingAnalysis {
  hourlyDistribution: { [hour: number]: number };
  dailyDistribution: { [day: number]: number };
  monthlyDistribution: { [month: number]: number };
  yearlyDistribution: { [year: number]: number };
  totalTransactions: number;
  averageTransactionsPerDay: number;
  busiestHour: { hour: number; count: number };
  busiestDay: { day: number; count: number };
  busiestMonth: { month: number; count: number };
  busiestYear: { year: number; count: number };
  busiest6Hour: { startHour: number; count: number };
  leastBusy6Hour: { startHour: number; count: number };
  inferredTimezone?: {
    region: "Europe" | "Asia" | "Americas";
    confidence: number;
    // activeHours: number[];
  };
}

export interface RelatedWalletInfo {
  address: string;
  txCount: number;
  entity: string;
  label: string;
}

export interface RelatedWalletTx {
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
    threshold?: number,
    fromBlock?: number,
    toBlock?: number
  ): Promise<{
    eoas: { address: string; txCount: number }[];
    contracts: { address: string; txCount: number }[];
  }> {
    // Get all transfers involving the address
    const { transactions, logs, blocks } =
      await this.hyperSync.getOutflowsAndWhitelistedInflows([address]);

    // Create block number to timestamp mapping
    const blockTimestamps = new Map<number, number>();
    blocks.forEach((block) => {
      if (block.timestamp && block.number) {
        blockTimestamps.set(block.number, block.timestamp);
      }
    });

    // Get related transactions and collect unique addresses
    const relatedAddresses = new Set<string>();
    const relatedTxs: RelatedWalletTx[] = [];

    // Process regular transactions
    for (const tx of transactions) {
      if (!tx.blockNumber) continue;
      if (fromBlock && tx.blockNumber < fromBlock) continue;
      if (toBlock && tx.blockNumber > toBlock) continue;

      const timestamp = blockTimestamps.get(tx.blockNumber) || 0;

      // check addresses that have received ETH from the given address
      if (tx.to && tx.to !== address && tx.value !== BigInt(0)) {
        relatedAddresses.add(tx.to);
        relatedTxs.push({
          address: tx.to,
          type: "receiver",
          value: BigInt(tx.value || "0"),
          timestamp,
        });
      }

      if (
        tx.to === address &&
        tx.from &&
        tx.from !== address &&
        tx.value !== BigInt(0) &&
        tx.value &&
        Number(tx.value) > 0.05 * ETHER // weed out spam transactions (TODO: make this configurable)
      ) {
        relatedAddresses.add(tx.from);
        relatedTxs.push({
          address: tx.from,
          type: "sender",
          value: BigInt(tx.value),
          timestamp,
        });
      }
    }

    const txnsByHashes = new Map<string, Transaction>();
    for (const tx of transactions) {
      if (tx.hash) {
        txnsByHashes.set(tx.hash, tx);
      }
    }

    // ERC20 transfers
    for (const log of logs) {
      if (!log.blockNumber || !log.topics || log.topics.length < 3) continue;

      // Weed out logs that are from transactions that don't originate from the given address
      // This is helpful to remove scam transactions
      const tx = txnsByHashes.get(log.transactionHash || "");
      if (!tx) continue;
      if (tx.from?.toLowerCase() !== address.toLowerCase()) continue;

      const fromTopic = log.topics[1];
      const toTopic = log.topics[2];
      if (!fromTopic || !toTopic) continue;

      const to = "0x" + toTopic.slice(26);
      const value = BigInt(0);

      if (to !== address) {
        relatedAddresses.add(to);
        relatedTxs.push({
          address: to,
          type: "receiver",
          value,
          timestamp: blockTimestamps.get(log.blockNumber) || 0,
        });
      }
    }

    const txByAddressCount = new Map<string, number>();
    for (const tx of relatedTxs) {
      const currentCount = txByAddressCount.get(tx.address) || 0;
      txByAddressCount.set(tx.address, currentCount + 1);
    }

    const eoas: { address: string; txCount: number }[] = [];
    const contracts: { address: string; txCount: number }[] = [];
    for (const address of relatedAddresses) {
      const txCount = txByAddressCount.get(address) || 0;
      if (txCount < (threshold || 1)) continue;

      const isContract = await isSmartContract(address);
      if (isContract) {
        contracts.push({ address, txCount });
      } else {
        eoas.push({ address, txCount });
      }
    }

    return { eoas, contracts };
  }

  async analyzeRelatedWallets(
    address: string,
    threshold?: number
  ): Promise<{
    wallets: {
      address: string;
      txCount: number;
      entity: string;
      label: string;
    }[];
    contracts: {
      address: string;
      txCount: number;
      entity: string;
      label: string;
      name: string;
    }[];
  }> {
    let { eoas: wallets, contracts } = await this.getRelatedWallets(
      address,
      threshold
    );

    if (wallets.length === 0 && contracts.length === 0) {
      console.log("No related wallets found");
      return { wallets: [], contracts: [] };
    }

    wallets = wallets.sort((a, b) => b.txCount - a.txCount);

    // filter out 0x0000000000000000000000000000000000000000
    wallets = wallets.filter(
      (wallet) =>
        wallet.address !== "0x0000000000000000000000000000000000000000"
    );

    const arkham = new ArkhamClient(process.env.ARKHAM_COOKIE || "");
    const walletInfos: {
      address: string;
      txCount: number;
      entity: string;
      label: string;
    }[] = [];

    for (const wallet of wallets) {
      const response = await arkham.fetchAddress(wallet.address);
      walletInfos.push({
        address: wallet.address,
        txCount: wallet.txCount,
        entity: response.arkhamEntity?.name || "Unknown",
        label: response.arkhamLabel?.name || "Unknown",
      });
    }

    // take top 5 contracts
    contracts = contracts.sort((a, b) => b.txCount - a.txCount).slice(0, 10);
    const contractInfos: {
      address: string;
      txCount: number;
      entity: string;
      label: string;
      name: string;
    }[] = [];

    for (const contract of contracts) {
      const response = await arkham.fetchAddress(contract.address);
      const name = await getContractName(contract.address, 1);
      contractInfos.push({
        address: contract.address,
        txCount: contract.txCount,
        entity: response.arkhamEntity?.name || "Unknown",
        label: response.arkhamLabel?.name || "Unknown",
        name: name || "Unknown",
      });
    }

    return {
      wallets: walletInfos,
      contracts: contractInfos,
    };
  }

  /**
   * Analyzes the timing patterns of transactions made by an address
   * @param address The address to analyze
   * @returns Promise<TransactionTimingAnalysis> Analysis of transaction timing patterns
   */
  async analyzeTransactionTiming(
    address: string
  ): Promise<TransactionTimingAnalysis> {
    const { transactions, blocks } = await this.hyperSync.getTransactionsFrom([
      address,
    ]);

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
    const yearlyDistribution: { [year: number]: number } = {};

    let utcDates: Date[] = [];

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

          // Update yearly distribution
          const year = date.getUTCFullYear();
          yearlyDistribution[year] = (yearlyDistribution[year] || 0) + 1;

          utcDates.push(date);
        }
      }
    });

    // Calculate statistics
    const totalTransactions = transactions.length;
    const daysWithTransactions = Object.keys(dailyDistribution).length;
    const averageTransactionsPerDay =
      totalTransactions / (daysWithTransactions || 1);

    const busiestHour = findBusiestPeriod(hourlyDistribution);
    const busiestDay = findBusiestPeriod(dailyDistribution);
    const busiestMonth = findBusiestPeriod(monthlyDistribution);
    const busiestYear = findBusiestPeriod(yearlyDistribution);
    const { busiest: busiest6Hour, leastBusy: leastBusy6Hour } =
      find6HourTimeframes(hourlyDistribution);
    const inferredTimezoneRegion = inferTimezoneRegion(utcDates);

    return {
      hourlyDistribution,
      dailyDistribution,
      monthlyDistribution,
      yearlyDistribution,
      totalTransactions,
      averageTransactionsPerDay,
      busiestHour: { hour: busiestHour.period, count: busiestHour.count },
      busiestDay: { day: busiestDay.period, count: busiestDay.count },
      busiestMonth: { month: busiestMonth.period, count: busiestMonth.count },
      busiestYear: { year: busiestYear.period, count: busiestYear.count },
      busiest6Hour,
      leastBusy6Hour,
      inferredTimezone: inferredTimezoneRegion,
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

    const format6HourWindow = (startHour: number) => {
      const endHour = (startHour + 6) % 24;
      return `${startHour.toString().padStart(2, "0")}:00 - ${endHour
        .toString()
        .padStart(2, "0")}:00 UTC`;
    };

    let timezoneInfo = "";
    if (analysis.inferredTimezone) {
      const { region, confidence } = analysis.inferredTimezone;
      timezoneInfo = `
Inferred Timezone:
- Region: ${region} (${(confidence * 100).toFixed(1)}% confidence)
`;
    }

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
- Year: ${analysis.busiestYear.year} (${
      analysis.busiestYear.count
    } transactions)
- 6-Hour Window: ${format6HourWindow(analysis.busiest6Hour.startHour)} (${
      analysis.busiest6Hour.count
    } transactions)
- Least Active 6-Hour Window: ${format6HourWindow(
      analysis.leastBusy6Hour.startHour
    )} (${analysis.leastBusy6Hour.count} transactions)
${timezoneInfo}
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

Yearly Distribution:
${Object.entries(analysis.yearlyDistribution)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([year, count]) => `  ${year} - ${count} transactions`)
  .join("\n")}
    `;
  }
}
