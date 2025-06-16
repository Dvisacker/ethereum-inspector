import { AxiosInstance } from "axios";
import { BridgeProvider, BridgeTransaction, LifiResponse } from "../types";

export class LifiProvider implements BridgeProvider {
  name = "Lifi";
  private readonly baseUrl = "https://li.quest/v1";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      const response = await this.axiosInstance.get<LifiResponse>(
        `${this.baseUrl}/analytics/transfers`,
        {
          params: {
            fromTimestamp: 0,
            status: "ALL",
            wallet: address,
          },
        }
      );

      return response.data.transfers.map(this.normalizeLifiTransaction);
    } catch (error) {
      throw new Error(`Lifi API error: ${error}`);
    }
  }

  private normalizeLifiTransaction(transfer: any): BridgeTransaction {
    return {
      txHash: transfer.transactionHash || "",
      destTxHash: transfer.destinationTransactionHash,
      bridge: transfer.toolDetails?.name || "Lifi",
      fromChain: transfer.fromChain.id,
      toChain: transfer.toChain.id,
      fromToken: transfer.fromToken.address,
      toToken: transfer.toToken.address,
      fromAmount: transfer.fromAmount,
      toAmount: transfer.toAmount,
      fromSymbol: transfer.fromToken.symbol,
      toSymbol: transfer.toToken.symbol,
      sender: transfer.sendingWalletAddress,
      recipient: transfer.receivingWalletAddress,
      timestamp: transfer.timestamp,
      status: this.mapLifiStatus(transfer.status),
      fees: transfer.fees?.[0]?.amount,
      blockNumber: 0, // Not provided by Lifi API
    };
  }

  private mapLifiStatus(status: string): "pending" | "completed" | "failed" {
    switch (status.toLowerCase()) {
      case "done":
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      default:
        return "pending";
    }
  }
}
