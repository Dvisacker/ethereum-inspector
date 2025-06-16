import { AxiosInstance } from "axios";
import {
  BridgeProvider,
  BridgeTransaction,
  LayerZeroResponse,
  LayerZeroMessage,
} from "../types";

export class LayerZeroProvider implements BridgeProvider {
  name = "LayerZero";
  private readonly baseUrl = "https://scan.layerzero-api.com/v1";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      const response = await this.axiosInstance.get<LayerZeroResponse>(
        `${this.baseUrl}/messages/wallet/${address}`,
        {
          params: {
            limit: 100,
          },
        }
      );

      // LayerZero API now returns { data: [...] }
      const messages = response.data.data || [];

      return messages.map((message: LayerZeroMessage) =>
        this.normalizeLayerZeroMessage(message)
      );
    } catch (error) {
      throw new Error(`LayerZero API error: ${error}`);
    }
  }

  private normalizeLayerZeroMessage(
    message: LayerZeroMessage
  ): BridgeTransaction {
    // Extract transaction hashes from LayerZero message structure
    const srcTxHash = message.source.tx?.txHash || "";
    const dstTxHash = message.destination.tx?.txHash || "";

    // Extract chain information from pathway
    const srcChainId = this.convertLayerZeroChainId(message.pathway.srcEid);
    const dstChainId = this.convertLayerZeroChainId(message.pathway.dstEid);

    // Extract timestamp (LayerZero uses created field)
    const timestamp = message.created
      ? new Date(message.created).getTime() / 1000
      : Date.now() / 1000;

    // Extract sender and receiver addresses
    const sender = message.pathway.sender.address || "";
    const recipient = message.pathway.receiver.address || "";

    return {
      txHash: srcTxHash,
      destTxHash: dstTxHash,
      bridge: "LayerZero",
      fromChain: srcChainId,
      toChain: dstChainId,
      fromToken: sender || "0x0000000000000000000000000000000000000000",
      toToken: recipient || "0x0000000000000000000000000000000000000000",
      fromAmount: message.source.tx?.value || "0",
      toAmount: "0", // Destination amount not available in the new API
      fromSymbol: "Unknown",
      toSymbol: "Unknown",
      sender,
      recipient,
      timestamp,
      status: this.mapLayerZeroStatus(message.status.name),
      blockNumber: parseInt(message.source.tx?.blockNumber || "0"),
      destBlockNumber: message.destination.tx?.blockNumber,
    };
  }

  private convertLayerZeroChainId(layerZeroChainId: number): number {
    // Convert LayerZero endpoint IDs to standard chain IDs
    const chainMapping: { [key: number]: number } = {
      101: 1, // Ethereum
      102: 56, // BSC
      106: 43114, // Avalanche
      109: 137, // Polygon
      110: 42161, // Arbitrum
      111: 10, // Optimism
      112: 250, // Fantom
      183: 8453, // Base
      // Add more mappings as needed
    };

    return chainMapping[layerZeroChainId] || layerZeroChainId;
  }

  private mapLayerZeroStatus(
    status: string
  ): "pending" | "completed" | "failed" {
    if (!status) return "pending";

    switch (status.toUpperCase()) {
      case "DELIVERED":
      case "COMPLETED":
      case "SUCCESS":
        return "completed";
      case "FAILED":
      case "REVERTED":
      case "BLOCKED":
        return "failed";
      case "INFLIGHT":
      case "WAITING":
      case "PENDING":
      case "CONFIRMING":
      case "PAYLOAD_STORED":
      default:
        return "pending";
    }
  }
}
