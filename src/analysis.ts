import { HyperSync } from "./hypersync";
import { defaultProvider, isSmartContract } from "./evm";
import { Transaction } from "@envio-dev/hypersync-client";
import { find6HourTimeframes, inferTimezoneRegion } from "./time";
import { findBusiestPeriod } from "./time";
import { ArkhamClient } from "./arkham";
import { EtherscanClient, ProxyType } from "./etherscan";
import { safePromise } from "./helpers";
import { config } from "./config";
import { ethers } from "ethers";
import { ContractInfo } from "./formatters/sheet";
import { HyperSyncData } from "./types";
import { ETHER } from "./constants";

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

export interface RelatedWalletWithFundingInfo extends RelatedWalletInfo {
  fundingWallet?: string;
  fundingWalletEntity?: string;
}

export interface RelatedWalletTx {
  address: string;
  type: "sender" | "receiver";
  value: bigint;
  timestamp: number;
}

export class TransactionAnalyzer {
  private hyperSync: HyperSync;
  private etherscan: EtherscanClient;
  private arkham: ArkhamClient;
  constructor() {
    this.hyperSync = new HyperSync();
    this.etherscan = new EtherscanClient(config.get("etherscanApiKey"));
    this.arkham = new ArkhamClient(config.get("arkhamCookie"));
  }

  /**
   * Gets all related wallets (EOAs) that interacted with the given address
   * @param address The address to analyze
   * @param fromBlock Optional starting block number
   * @param toBlock Optional ending block number
   * @returns Promise<RelatedWallet[]> List of related EOA wallets
   */
  async getRelatedWallets(
    hyperSyncData: HyperSyncData,
    address: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<{
    wallets: { address: string; txCount: number }[];
    contracts: { address: string; txCount: number }[];
  }> {
    const { transactions, logs, blocks } = hyperSyncData;

    // Create block number to timestamp mapping
    const blockTimestamps = new Map<number, number>();
    blocks.forEach((block) => {
      if (block.timestamp && block.number) {
        blockTimestamps.set(block.number, block.timestamp);
      }
    });

    const relatedAddresses = new Set<string>();
    const relatedTxs: RelatedWalletTx[] = [];

    // 1. Process regular ETH transfers
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
        Number(tx.value) > config.get("spamTxEthThreshold") * ETHER // weed out spam transactions
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

    // 2. Process ERC20 transfers
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

    const wallets: { address: string; txCount: number }[] = [];
    const contracts: { address: string; txCount: number }[] = [];
    for (const address of relatedAddresses) {
      const txCount = txByAddressCount.get(address) || 0;
      if (txCount < config.get("relatedWalletsThreshold")) continue;

      const isContract = await isSmartContract(address);
      if (isContract) {
        contracts.push({ address, txCount });
      } else {
        wallets.push({ address, txCount });
      }
    }

    return { wallets, contracts };
  }

  async analyzeRelatedWallets(address: string): Promise<{
    hyperSyncData: HyperSyncData;
    wallets: RelatedWalletInfo[];
    contracts: ContractInfo[];
  }> {
    let hyperSyncData = await this.hyperSync.getOutflowsAndWhitelistedInflows([
      address,
    ]);

    let { wallets, contracts } = await this.getRelatedWallets(
      hyperSyncData,
      address
    );

    if (wallets.length === 0 && contracts.length === 0) {
      console.log("No related wallets found");
      return {
        hyperSyncData,
        wallets: [],
        contracts: [],
      };
    }

    wallets = wallets.sort((a, b) => b.txCount - a.txCount);

    wallets = wallets.filter(
      (wallet) =>
        wallet.address !== "0x0000000000000000000000000000000000000000"
    );

    // Fetch all contract info in parallel with error handling
    const [walletLabels, contractLabels, contractNames] = await Promise.all([
      Promise.all(
        wallets.map((wallet) =>
          safePromise(this.arkham.fetchAddress(wallet.address))
        )
      ),
      Promise.all(
        contracts.map((contract) =>
          safePromise(this.arkham.fetchAddress(contract.address))
        )
      ),
      Promise.all(
        contracts.map((contract) =>
          safePromise(this.etherscan.getContractName(contract.address, 1))
        )
      ),
    ]);

    const walletInfos = wallets.map((wallet, index) => {
      const label = walletLabels[index]?.arkhamLabel?.name || "Unknown";
      let entity = walletLabels[index]?.arkhamEntity?.name || "Unknown";

      // If the label includes "Deposit" and the entity is "Unknown", set the entity to the first word in the label (eg. "Binance Deposit" -> "Binance")
      if (
        label.includes("Deposit") &&
        label.split(" ").length === 2 &&
        entity === "Unknown"
      ) {
        entity = label.split(" ")[0];
      }

      return {
        address: wallet.address,
        txCount: wallet.txCount,
        entity,
        label,
      };
    });

    const maxContracts = config.get("maxRelatedContracts");
    const contractInfos = contracts
      .map((contract, index) => ({
        address: contract.address,
        txCount: contract.txCount,
        entity: contractLabels[index]?.arkhamEntity?.name || "Unknown",
        label: contractLabels[index]?.arkhamLabel?.name || "Unknown",
        name: contractNames[index]?.contractName || "Unknown",
        isProxy: contractNames[index]?.isProxy || false,
        proxyType: contractNames[index]?.proxyType || undefined,
        implementationName:
          contractNames[index]?.implementationName || undefined,
      }))
      .sort((a, b) => b.txCount - a.txCount)
      .slice(0, maxContracts);

    return {
      hyperSyncData,
      wallets: walletInfos,
      contracts: contractInfos,
    };
  }

  async getFundingWallets(
    wallets: RelatedWalletInfo[]
  ): Promise<RelatedWalletWithFundingInfo[]> {
    const fundingWallets = new Map<
      string,
      {
        address: string;
        entity: string;
        label: string;
      }
    >();

    // Fetch all first transactions and address info in parallel
    const [firstTransactions, addressInfos] = await Promise.all([
      Promise.all(
        wallets.map((wallet) =>
          safePromise(
            this.hyperSync.getAddressFirstReceivedTransaction(wallet.address)
          )
        )
      ),
      Promise.all(
        wallets.map((wallet) =>
          safePromise(this.arkham.fetchAddress(wallet.address))
        )
      ),
    ]);

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const tx = firstTransactions[i];
      const addressInfo = addressInfos[i];

      if (
        tx &&
        tx.transactions &&
        tx.transactions.length > 0 &&
        tx.transactions[0].from &&
        addressInfo
      ) {
        fundingWallets.set(wallet.address, {
          address: tx.transactions[0].from,
          entity: addressInfo.arkhamEntity?.name || "Unknown",
          label: addressInfo.arkhamLabel?.name || "Unknown",
        });
      }
    }

    const walletsWithFunding = wallets.map((wallet, index) => ({
      ...wallet,
      address: wallet.address,
      fundingWallet: fundingWallets.get(wallets[index].address)?.address,
      fundingWalletEntity: `${
        fundingWallets.get(wallets[index].address)?.entity
      } (${fundingWallets.get(wallets[index].address)?.label})`,
    }));

    return walletsWithFunding;
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

    const blockTimestamps = new Map<number, number>();
    blocks.forEach((block) => {
      if (block.timestamp && block.number) {
        blockTimestamps.set(block.number, block.timestamp);
      }
    });

    const hourlyDistribution: { [hour: number]: number } = {};
    const dailyDistribution: { [day: number]: number } = {};
    const monthlyDistribution: { [month: number]: number } = {};
    const yearlyDistribution: { [year: number]: number } = {};

    let utcDates: Date[] = [];

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
}
