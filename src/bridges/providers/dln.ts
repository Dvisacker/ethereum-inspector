import { AxiosInstance } from "axios";
import { BridgeProvider, BridgeTransaction, DlnResponse } from "../types";

export class DlnProvider implements BridgeProvider {
  name = "DLN";
  private readonly baseUrl = "https://stats-api.dln.trade/api";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      const response = await this.axiosInstance.post<DlnResponse>(
        `${this.baseUrl}/Orders/filteredList`,
        {
          skip: 0,
          take: 100,
          filter: address,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.orders.map(this.normalizeDlnOrder);
    } catch (error) {
      throw new Error(`DLN API error: ${error}`);
    }
  }

  private normalizeDlnOrder(order: any): BridgeTransaction {
    return {
      txHash: order.createTx.txHash,
      destTxHash: order.fulfillTx?.txHash,
      bridge: "DLN",
      fromChain: order.giveChainId,
      toChain: order.takeChainId,
      fromToken: order.giveTokenAddress,
      toToken: order.takeTokenAddress,
      fromAmount: order.giveAmount,
      toAmount: order.takeAmount,
      fromSymbol: "Unknown", // DLN API doesn't provide token symbols
      toSymbol: "Unknown",
      sender: order.makerSrc,
      recipient: order.receiverDst,
      timestamp: new Date(order.createdAt).getTime() / 1000,
      status: this.mapDlnStatus(order.state),
      blockNumber: order.createTx.blockNumber,
      destBlockNumber: order.fulfillTx?.blockNumber,
    };
  }

  private mapDlnStatus(state: string): "pending" | "completed" | "failed" {
    switch (state.toLowerCase()) {
      case "fulfilled":
        return "completed";
      case "cancelled":
        return "failed";
      default:
        return "pending";
    }
  }
}
