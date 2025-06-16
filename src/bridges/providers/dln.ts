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

      return response.data.orders.map((order) => this.normalizeDlnOrder(order));
    } catch (error) {
      throw new Error(`DLN API error: ${error}`);
    }
  }

  private normalizeDlnOrder(order: any): BridgeTransaction {
    // Extract give (source) and take (destination) details
    const give = order.giveOfferWithMetadata;
    const take = order.takeOfferWithMetadata;

    return {
      txHash: order.createEventTransactionHash?.stringValue || "",
      destTxHash: "", // Not available in the new API response
      bridge: "DLN",
      fromChain: parseInt(give.chainId.stringValue),
      toChain: parseInt(take.chainId.stringValue),
      fromToken: give.tokenAddress.stringValue,
      toToken: take.tokenAddress.stringValue,
      fromAmount: give.amount.stringValue,
      toAmount: take.amount.stringValue,
      fromSymbol: give.metadata?.symbol || "Unknown",
      toSymbol: take.metadata?.symbol || "Unknown",
      sender: order.affiliateFee?.beneficiarySrc?.stringValue || "",
      recipient: order.unlockAuthorityDst?.stringValue || "",
      timestamp: order.creationTimestamp,
      status: this.mapDlnStatus(order.state),
      blockNumber: 0, // Not available in the new API response
      destBlockNumber: 0, // Not available in the new API response
    };
  }

  private mapDlnStatus(state: string): "pending" | "completed" | "failed" {
    switch (state.toLowerCase()) {
      case "claimedunlock":
      case "fulfilled":
        return "completed";
      case "cancelled":
      case "expired":
        return "failed";
      default:
        return "pending";
    }
  }
}
