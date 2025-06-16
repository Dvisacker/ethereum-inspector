import { AxiosInstance } from "axios";
import { BridgeProvider, BridgeTransaction, SocketResponse } from "../types";

export class SocketProvider implements BridgeProvider {
  name = "Socket";
  private readonly baseUrl = "https://microservices.socket.tech/loki";

  constructor(private axiosInstance: AxiosInstance) {}

  async fetchTransactions(address: string): Promise<BridgeTransaction[]> {
    try {
      const allTransactions: BridgeTransaction[] = [];
      let page = 0;
      const pageSize = 25;
      let hasMore = true;

      while (hasMore) {
        const response = await this.axiosInstance.get<SocketResponse>(
          `${this.baseUrl}/tx-history`,
          {
            params: {
              sender: address,
              page,
              pageSize,
              sort: "desc",
              fromChainId: "",
              toChainId: "",
              bridgeName: "",
            },
          }
        );

        if (response.data.success && response.data.result.length > 0) {
          const transactions = response.data.result.map((transfer) =>
            this.normalizeSocketTransaction(transfer)
          );
          allTransactions.push(...transactions);

          // Check if we have more pages
          const totalPages = Math.ceil(
            response.data.paginationData.totalCount / pageSize
          );
          hasMore = page < totalPages - 1;
          page++;
        } else {
          hasMore = false;
        }
      }

      return allTransactions;
    } catch (error) {
      throw new Error(`Socket API error: ${error}`);
    }
  }

  private normalizeSocketTransaction(transfer: any): BridgeTransaction {
    return {
      txHash: transfer.srcTransactionHash,
      destTxHash: transfer.destTransactionHash,
      bridge: transfer.bridgeName,
      fromChain: transfer.fromChainId,
      toChain: transfer.toChainId,
      fromToken: transfer.srcTokenAddress,
      toToken: transfer.destTokenAddress,
      fromAmount: transfer.srcAmount,
      toAmount: transfer.destAmount || "0",
      fromSymbol: transfer.srcTokenSymbol,
      toSymbol: transfer.destTokenSymbol || transfer.srcTokenSymbol,
      sender: transfer.sender,
      recipient: transfer.recipient,
      timestamp: transfer.srcBlockTimeStamp,
      status: this.mapSocketStatus(transfer.srcTxStatus, transfer.destTxStatus),
      fees: transfer.fees,
      blockNumber: transfer.srcBlockNumber,
      destBlockNumber: transfer.destBlockNumber,
    };
  }

  private mapSocketStatus(
    srcStatus: string,
    destStatus?: string
  ): "pending" | "completed" | "failed" {
    if (srcStatus === "FAILED" || destStatus === "FAILED") {
      return "failed";
    }
    if (
      srcStatus === "COMPLETED" &&
      (!destStatus || destStatus === "COMPLETED")
    ) {
      return "completed";
    }
    return "pending";
  }
}
