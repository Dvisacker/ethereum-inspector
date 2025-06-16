import { AxiosInstance } from "axios";
import { BridgeProvider, BridgeTransaction } from "../types";

export class CCTPProvider implements BridgeProvider {
  name = "CCTP";
  private readonly baseUrl = "https://usdc.range.org/api";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      const response = await this.axiosInstance.get(
        `${this.baseUrl}/payments`,
        {
          params: {
            txHash: address,
            limit: 25,
            status: "SUCCEEDED",
            anchorTxn: 1750065451000676000,
            direction: "first",
            bridge: "cctp,cctpv2",
            destinationNetworks: "",
            sourceNetworks: "",
          },
        }
      );

      // Transform CCTP transfers to bridge transactions
      return response.data.resources.map((transfer: any) => ({
        txHash: transfer.sender_tx_hash,
        destTxHash: transfer.receiver_tx_hash || "",
        bridge: "CCTP",
        fromChain: this.getChainId(transfer.sender_network),
        toChain: this.getChainId(transfer.receiver_network),
        fromToken: transfer.sender_symbol,
        toToken: transfer.receiver_symbol || transfer.sender_symbol,
        fromAmount: transfer.sender_amount.toString(),
        toAmount:
          transfer.receiver_amount?.toString() ||
          transfer.sender_amount.toString(),
        fromSymbol: transfer.sender_symbol,
        toSymbol: transfer.receiver_symbol || transfer.sender_symbol,
        sender: transfer.sender_address,
        recipient: transfer.receiver_address,
        timestamp: new Date(transfer.time).getTime() / 1000,
        status: transfer.status === "SUCCEEDED" ? "completed" : "pending",
        blockNumber: 0, // Not provided by the API
        destBlockNumber: 0, // Not provided by the API
      }));
    } catch (error) {
      throw new Error(`CCTP API error: ${error}`);
    }
  }

  private getChainId(network: string): number {
    const chainMap: { [key: string]: number } = {
      arb1: 42161, // Arbitrum One
      base: 8453, // Base
      oeth: 10, // Optimism
      pol: 137, // Polygon
      avax: 43114, // Avalanche
      unichain: 1, // Ethereum Mainnet
      solana: 1399811149, // Solana (using a placeholder ID)
    };
    return chainMap[network] || 0;
  }
}
