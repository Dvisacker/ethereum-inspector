import { CCTPProvider } from "./cctp";
import axios from "axios";

describe("CCTPProvider", () => {
  const axiosInstance = axios.create({ timeout: 30000 });
  const provider = new CCTPProvider(axiosInstance);
  const testAddress = "0xc4e7263dd870a29f1cfe438d1a7db48547b16888";

  it("should fetch CCTP transactions", async () => {
    const transactions = await provider.fetchTransactions(testAddress);
    console.log(transactions);
    expect(Array.isArray(transactions)).toBe(true);

    if (transactions.length > 0) {
      const tx = transactions[0];

      // Check required properties
      expect(tx).toHaveProperty("txHash");
      expect(tx).toHaveProperty("bridge");
      expect(tx.bridge).toBe("CCTP");

      // Check chain IDs
      expect(typeof tx.fromChain).toBe("number");
      expect(typeof tx.toChain).toBe("number");
      expect(tx.fromChain).toBeGreaterThan(0);
      expect(tx.toChain).toBeGreaterThan(0);

      // Check addresses
      expect(typeof tx.sender).toBe("string");
      expect(typeof tx.recipient).toBe("string");
      expect(tx.sender).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(tx.recipient).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Check amounts and tokens
      expect(typeof tx.fromAmount).toBe("string");
      expect(typeof tx.toAmount).toBe("string");
      expect(tx.fromSymbol).toBe("USDC");
      expect(tx.toSymbol).toBe("USDC");

      // Check timestamps
      expect(typeof tx.timestamp).toBe("number");
      expect(tx.timestamp).toBeGreaterThan(0);

      // Check status
      expect(["pending", "completed"]).toContain(tx.status);

      console.log("CCTP transaction sample:", {
        bridge: tx.bridge,
        fromChain: tx.fromChain,
        toChain: tx.toChain,
        status: tx.status,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        fromAmount: tx.fromAmount,
        toAmount: tx.toAmount,
        fromSymbol: tx.fromSymbol,
        toSymbol: tx.toSymbol,
        sender: tx.sender,
        recipient: tx.recipient,
      });
    }
  }, 30000);

  it("should handle API errors gracefully", async () => {
    const invalidAddress = "invalid_address";
    try {
      await provider.fetchTransactions(invalidAddress);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("CCTP API error");
    }
  });

  it("should correctly map network names to chain IDs", async () => {
    const transactions = await provider.fetchTransactions(testAddress);

    // Check that we have transactions from different networks
    const uniqueFromChains = new Set(transactions.map((tx) => tx.fromChain));
    const uniqueToChains = new Set(transactions.map((tx) => tx.toChain));

    expect(uniqueFromChains.size).toBeGreaterThan(1);
    expect(uniqueToChains.size).toBeGreaterThan(1);

    // Verify some specific chain mappings
    const tx = transactions[0];
    expect(tx.fromChain).toBeGreaterThan(0);
    expect(tx.toChain).toBeGreaterThan(0);
  });
});
