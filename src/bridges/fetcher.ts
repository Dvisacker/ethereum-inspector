import axios, { AxiosInstance } from "axios";
import { BridgeTransaction, BridgeProvider } from "./types";
import { LifiProvider } from "./providers/lifi";
import { SocketProvider } from "./providers/socket";
import { DlnProvider } from "./providers/dln";
import { RelayProvider } from "./providers/relay";

export class BridgeTransactionsFetcher {
  private readonly axiosInstance: AxiosInstance;
  private readonly providers: BridgeProvider[];

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        Accept: "*/*",
      },
    });

    this.providers = [
      new LifiProvider(this.axiosInstance),
      new SocketProvider(this.axiosInstance),
      new DlnProvider(this.axiosInstance),
      new RelayProvider(this.axiosInstance),
    ];
  }

  /**
   * Fetch bridge transactions from all supported providers
   * @param address The wallet address to fetch transactions for
   * @returns Array of normalized bridge transactions
   */
  async fetchAllBridgeTransactions(
    address: string
  ): Promise<BridgeTransaction[]> {
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.fetchTransactions(address))
    );

    const allTransactions: BridgeTransaction[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allTransactions.push(...result.value);
      } else {
        console.warn(
          `Failed to fetch from ${this.providers[index].name}:`,
          result.reason
        );
      }
    });

    // Sort by timestamp descending (newest first)
    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Fetch transactions from a specific bridge provider
   * @param providerName Name of the bridge provider
   * @param address The wallet address to fetch transactions for
   * @returns Array of normalized bridge transactions
   */
  async fetchFromProvider(
    providerName: string,
    address: string
  ): Promise<BridgeTransaction[]> {
    const provider = this.providers.find(
      (p) => p.name.toLowerCase() === providerName.toLowerCase()
    );
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return provider.fetchTransactions(address);
  }

  /**
   * Get list of supported bridge providers
   * @returns Array of provider names
   */
  getSupportedProviders(): string[] {
    return this.providers.map((p) => p.name);
  }
}
