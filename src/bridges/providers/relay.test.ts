import { RelayProvider } from "./relay";
import axios from "axios";

describe("RelayProvider", () => {
  const axiosInstance = axios.create({ timeout: 30000 });
  const provider = new RelayProvider(axiosInstance);
  const testAddress = "0xaad4437332a6939866e2902d879569579902e869";

  it("should fetch Relay transactions", async () => {
    const transactions = await provider.fetchTransactions(testAddress);
    console.log(transactions);
    expect(Array.isArray(transactions)).toBe(true);

    if (transactions.length > 0) {
      const tx = transactions[0];

      // Check required properties
      expect(tx).toHaveProperty("txHash");
      expect(tx).toHaveProperty("bridge");
      expect(tx.bridge).toBe("Relay");

      // Check chain IDs
      expect(typeof tx.fromChain).toBe("number");
      expect(typeof tx.toChain).toBe("number");

      // Check addresses
      expect(typeof tx.sender).toBe("string");
      expect(typeof tx.recipient).toBe("string");
      expect(tx.sender).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(tx.recipient).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Check amounts
      expect(typeof tx.fromAmount).toBe("string");
      expect(typeof tx.toAmount).toBe("string");

      // Check timestamps and block numbers
      expect(typeof tx.timestamp).toBe("number");
      expect(typeof tx.blockNumber).toBe("number");
      if (tx.destBlockNumber) {
        expect(typeof tx.destBlockNumber).toBe("number");
      }

      // Check status
      expect(["pending", "completed", "failed"]).toContain(tx.status);

      console.log("Relay transaction sample:", {
        bridge: tx.bridge,
        fromChain: tx.fromChain,
        toChain: tx.toChain,
        status: tx.status,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        fromAmount: tx.fromAmount,
        toAmount: tx.toAmount,
        currency: tx.fromToken, // Relay uses the same currency for both sides
      });
    }
  }, 30000);

  it("should handle API errors gracefully", async () => {
    const invalidAddress = "invalid_address";
    try {
      await provider.fetchTransactions(invalidAddress);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Relay API error");
    }
  });
});
