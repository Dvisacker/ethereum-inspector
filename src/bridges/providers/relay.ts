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

      return response.data.requests.map((request) =>
        this.normalizeRelayRequest(request)
      );
    } catch (error) {
      throw new Error(`Relay API error: ${error}`);
    }
  }

  private normalizeRelayRequest(request: any): BridgeTransaction {
    const currencyIn = request.data?.metadata?.currencyIn;
    const currencyOut = request.data?.metadata?.currencyOut;

    return {
      txHash: request.id,
      destTxHash: request.data?.outTxs?.[0]?.hash,
      bridge: "Relay",
      fromChain: request.data?.inTxs?.[0]?.chainId,
      toChain: request.data?.outTxs?.[0]?.chainId,
      fromToken: currencyIn?.currency?.address || request.data?.currency,
      toToken: currencyOut?.currency?.address || request.data?.currency,
      fromAmount: currencyIn?.amount || request.data?.price,
      toAmount: currencyOut?.amount || request.data?.price,
      fromSymbol: currencyIn?.currency?.symbol || "Unknown",
      toSymbol: currencyOut?.currency?.symbol || "Unknown",
      sender: request.user,
      recipient: request.recipient,
      timestamp: new Date(request.createdAt).getTime() / 1000,
      status: this.mapRelayStatus(request.status),
      blockNumber: request.data?.inTxs?.[0]?.block,
      destBlockNumber: request.data?.outTxs?.[0]?.block,
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
