import { AxiosInstance } from "axios";
import { BridgeProvider, BridgeTransaction } from "../types";

export class LayerZeroProvider implements BridgeProvider {
  name = "LayerZero";
  private readonly baseUrl = "https://layerzeroscan.com/api";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      // This is a conceptual implementation - actual LayerZero API may differ
      const response = await this.axiosInstance.get(
        `${this.baseUrl}/messages`,
        {
          params: {
            address,
            limit: 100,
          },
        }
      );

      // Transform LayerZero messages to bridge transactions
      return response.data.map((message: any) => ({
        txHash: message.srcTxHash,
        destTxHash: message.dstTxHash,
        bridge: "LayerZero",
        fromChain: message.srcChainId,
        toChain: message.dstChainId,
        fromToken:
          message.srcToken || "0x0000000000000000000000000000000000000000",
        toToken:
          message.dstToken || "0x0000000000000000000000000000000000000000",
        fromAmount: message.amount || "0",
        toAmount: message.amount || "0",
        fromSymbol: message.srcSymbol || "ETH",
        toSymbol: message.dstSymbol || "ETH",
        sender: message.from,
        recipient: message.to,
        timestamp: message.timestamp,
        status: message.status === "DELIVERED" ? "completed" : "pending",
        blockNumber: message.srcBlockNumber,
        destBlockNumber: message.dstBlockNumber,
      }));
    } catch (error) {
      throw new Error(`LayerZero API error: ${error}`);
    }
  }
}
