import { AxiosInstance } from "axios";
import { ethers } from "ethers";
import {
  BridgeProvider,
  BridgeTransaction,
  LayerZeroResponse,
  LayerZeroMessage,
} from "../types";
import { parseStargateTransaction } from "../stargate-v1";
import { parseStargateV2Transaction } from "../stargate-v2";

export class LayerZeroProvider implements BridgeProvider {
  name = "LayerZero";
  private readonly baseUrl = "https://scan.layerzero-api.com/v1";
  private readonly provider: ethers.Provider;

  constructor(private axiosInstance: AxiosInstance) {
    // Initialize ethers provider for Stargate parsing
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETH_RPC_URL || "https://eth.llamarpc.com"
    );
  }

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      const messages = await this.fetchMessages(address);
      const transactions = await Promise.all(
        messages.map((msg: LayerZeroMessage) =>
          this.normalizeLayerZeroMessage(msg)
        )
      );
      return transactions.filter(
        (tx: BridgeTransaction | null): tx is BridgeTransaction => tx !== null
      );
    } catch (error) {
      console.error("Error fetching LayerZero transactions:", error);
      return [];
    }
  }

  private async fetchMessages(address: string): Promise<LayerZeroMessage[]> {
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
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching LayerZero messages:", error);
      return [];
    }
  }

  async fetchMessageByTxHash(txHash: string): Promise<LayerZeroMessage | null> {
    try {
      const response = await this.axiosInstance.get<LayerZeroResponse>(
        `${this.baseUrl}/messages/tx/${txHash}`
      );
      return response.data.data[0] || null;
    } catch (error) {
      console.error("Error fetching LayerZero message by txHash:", error);
      return null;
    }
  }

  private async normalizeLayerZeroMessage(
    message: LayerZeroMessage
  ): Promise<BridgeTransaction | null> {
    try {
      // Check if this is a Stargate V2 transaction (chain IDs >= 30000)
      if (message.pathway.srcEid >= 30000 && message.pathway.dstEid >= 30000) {
        const stargateV2Tx = await parseStargateV2Transaction(
          message,
          this.provider
        );
        if (stargateV2Tx) return stargateV2Tx;
      }

      // Try Stargate V1 if not V2
      const stargateTx = await parseStargateTransaction(message, this.provider);
      if (stargateTx) return stargateTx;

      // If not a Stargate transaction, use default LayerZero normalization
      const sourceTx = message.source.tx;
      if (!sourceTx) return null;

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
    } catch (error) {
      console.error("Error normalizing LayerZero message:", error);
      return null;
    }
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
      // LayerZero v2 (new endpoint IDs)
      30101: 1, // Ethereum Mainnet
      30102: 56, // BNB Chain
      30106: 43114, // Avalanche
      30320: 137, // Polygon
      30421: 42161, // Arbitrum
      30110: 10, // Optimism
      30250: 250, // Fantom
      30845: 8453, // Base
      31337: 31337, // Hardhat/Localhost (example)
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
