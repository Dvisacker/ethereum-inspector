import { AxiosInstance } from "axios";
import { BridgeProvider, BridgeTransaction } from "../types";

export class CCTPProvider implements BridgeProvider {
  name = "CCTP";
  private readonly baseUrl = "https://iris-api.circle.com";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      // This is a conceptual implementation - actual CCTP API may differ
      const response = await this.axiosInstance.get(
        `${this.baseUrl}/v1/transfers`,
        {
          params: {
            account: address,
            limit: 100,
          },
        }
      );

      // Transform CCTP transfers to bridge transactions
      return response.data.transfers.map((transfer: any) => ({
        txHash: transfer.sourceTxHash,
        destTxHash: transfer.destinationTxHash,
        bridge: "CCTP",
        fromChain: transfer.sourceChainId,
        toChain: transfer.destinationChainId,
        fromToken: transfer.sourceToken,
        toToken: transfer.destinationToken,
        fromAmount: transfer.amount,
        toAmount: transfer.amount,
        fromSymbol: "USDC", // CCTP primarily handles USDC
        toSymbol: "USDC",
        sender: transfer.sender,
        recipient: transfer.recipient,
        timestamp: new Date(transfer.timestamp).getTime() / 1000,
        status: transfer.status === "complete" ? "completed" : "pending",
        blockNumber: transfer.sourceBlockNumber,
        destBlockNumber: transfer.destinationBlockNumber,
      }));
    } catch (error) {
      throw new Error(`CCTP API error: ${error}`);
    }
  }
}
