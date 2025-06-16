import { AxiosInstance } from "axios";
import { BridgeProvider, BridgeTransaction, RelayResponse } from "../types";

export class RelayProvider implements BridgeProvider {
  name = "Relay";
  private readonly baseUrl = "https://api.relay.link";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      const response = await this.axiosInstance.get<RelayResponse>(
        `${this.baseUrl}/requests/v2`,
        {
          params: {
            user: address,
            privateChainsToInclude: "",
          },
        }
      );

      return response.data.requests.map(this.normalizeRelayRequest);
    } catch (error) {
      throw new Error(`Relay API error: ${error}`);
    }
  }

  private normalizeRelayRequest(request: any): BridgeTransaction {
    return {
      txHash: request.hash,
      destTxHash: request.destinationTxHash,
      bridge: "Relay",
      fromChain: request.originChainId,
      toChain: request.destinationChainId,
      fromToken: request.currency,
      toToken: request.currency,
      fromAmount: request.amount,
      toAmount: request.amount,
      fromSymbol: "Unknown", // Relay API uses currency code, need to map
      toSymbol: "Unknown",
      sender: request.user,
      recipient: request.recipient,
      timestamp: new Date(request.createdAt).getTime() / 1000,
      status: this.mapRelayStatus(request.status),
      blockNumber: request.blockNumber,
      destBlockNumber: request.destinationBlockNumber,
    };
  }

  private mapRelayStatus(status: string): "pending" | "completed" | "failed" {
    switch (status.toLowerCase()) {
      case "complete":
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      default:
        return "pending";
    }
  }
}
