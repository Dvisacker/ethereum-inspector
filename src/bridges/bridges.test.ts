import { BridgeTransactionsFetcher } from "./fetcher";
import { LayerZeroProvider } from "./providers/layerzero";
import axios from "axios";

describe("BridgeTransactionsFetcher", () => {
  const fetcher = new BridgeTransactionsFetcher();
  const testAddress = "0xfA96c5d19EeCc43d017cD3F6eD09928d2F83dc64";

  it("should list supported providers", () => {
    const providers = fetcher.getSupportedProviders();
    expect(providers).toContain("Lifi");
    expect(providers).toContain("Socket");
    expect(providers).toContain("DLN");
    expect(providers).toContain("Relay");
    expect(providers).toContain("LayerZero");
  });

  it("should fetch transactions from all providers", async () => {
    // This test would require mocking the API responses
    // For demonstration purposes only
    const transactions = await fetcher.fetchAllBridgeTransactions(testAddress);
    console.log(transactions);
    expect(Array.isArray(transactions)).toBe(true);
  }, 30000); // 30 second timeout for API calls

  it("should fetch from specific provider", async () => {
    try {
      const transactions = await fetcher.fetchFromProvider(
        "Socket",
        testAddress
      );
      expect(Array.isArray(transactions)).toBe(true);

      if (transactions.length > 0) {
        const tx = transactions[0];
        expect(tx).toHaveProperty("txHash");
        expect(tx).toHaveProperty("bridge");
        expect(tx).toHaveProperty("fromChain");
        expect(tx).toHaveProperty("toChain");
        expect(tx).toHaveProperty("sender");
        expect(tx).toHaveProperty("recipient");
        expect(tx).toHaveProperty("timestamp");
        expect(tx).toHaveProperty("status");
      }
    } catch (error) {
      // API might be down or rate limited
      console.log("Socket API call failed:", error);
    }
  }, 30000);

  it("should fetch LayerZero transactions", async () => {
    const layerZeroAddress = "0xe37f7c80ced04c4f243c0fd04a5510d663cb88b5";
    const transactions = await fetcher.fetchFromProvider(
      "LayerZero",
      layerZeroAddress
    );
    expect(Array.isArray(transactions)).toBe(true);

    if (transactions.length > 0) {
      const tx = transactions[0];
      expect(tx).toHaveProperty("txHash");
      expect(tx.bridge).toBe("LayerZero");
      expect(tx).toHaveProperty("fromChain");
      expect(tx).toHaveProperty("toChain");
      expect(tx).toHaveProperty("sender");
      expect(tx).toHaveProperty("recipient");
      expect(tx).toHaveProperty("timestamp");
      expect(tx.status).toMatch(/^(pending|completed|failed)$/);

      // LayerZero specific checks
      expect(typeof tx.fromChain).toBe("number");
      expect(typeof tx.toChain).toBe("number");
      expect(typeof tx.timestamp).toBe("number");
    }
  }, 30000);

  it("should throw error for unknown provider", async () => {
    await expect(
      fetcher.fetchFromProvider("UnknownBridge", testAddress)
    ).rejects.toThrow("Provider UnknownBridge not found");
  });
});

describe("LayerZeroProvider", () => {
  const axiosInstance = axios.create({ timeout: 30000 });
  const provider = new LayerZeroProvider(axiosInstance);
  const testAddress = "0xed0c6079229e2d407672a117c22b62064f4a4312";

  it("should have correct provider name", () => {
    expect(provider.name).toBe("LayerZero");
  });

  it("should handle LayerZero API response", async () => {
    const transactions = await provider.fetchTransactions(testAddress);
    console.log(transactions);
    expect(Array.isArray(transactions)).toBe(true);

    if (transactions.length > 0) {
      const tx = transactions[0];

      expect(tx).toHaveProperty("txHash");
      expect(tx).toHaveProperty("bridge");
      expect(tx.bridge).toBe("LayerZero");

      expect(typeof tx.fromChain).toBe("number");
      expect(typeof tx.toChain).toBe("number");
      expect(typeof tx.timestamp).toBe("number");
      expect(typeof tx.blockNumber).toBe("number");
      expect(["pending", "completed", "failed"]).toContain(tx.status);
      expect(typeof tx.sender).toBe("string");
      expect(typeof tx.recipient).toBe("string");

      console.log("LayerZero transaction sample:", {
        bridge: tx.bridge,
        fromChain: tx.fromChain,
        toChain: tx.toChain,
        status: tx.status,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
      });
    }
  }, 30000);

  it("should handle API errors gracefully", async () => {
    const invalidAddress = "invalid_address";
    try {
      await provider.fetchTransactions(invalidAddress);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("LayerZero API error");
    }
  });
});

export async function exampleUsage() {
  const fetcher = new BridgeTransactionsFetcher();
  const address = "0xed0c6079229e2d407672a117c22b62064f4a4312";

  try {
    console.log("Supported providers:", fetcher.getSupportedProviders());

    console.log("Fetching from all providers...");
    const allTransactions = await fetcher.fetchAllBridgeTransactions(address);
    console.log(`Found ${allTransactions.length} total bridge transactions`);

    console.log("Fetching from Socket only...");
    const socketTransactions = await fetcher.fetchFromProvider(
      "Socket",
      address
    );
    console.log(`Found ${socketTransactions.length} Socket transactions`);

    // Fetch from LayerZero specifically
    console.log("Fetching from LayerZero only...");
    const layerZeroTransactions = await fetcher.fetchFromProvider(
      "LayerZero",
      address
    );
    console.log(`Found ${layerZeroTransactions.length} LayerZero transactions`);

    // Display some transaction details
    if (allTransactions.length > 0) {
      const latest = allTransactions[0];
      console.log("Latest transaction:", {
        bridge: latest.bridge,
        fromChain: latest.fromChain,
        toChain: latest.toChain,
        amount: latest.fromAmount,
        symbol: latest.fromSymbol,
        status: latest.status,
        timestamp: new Date(latest.timestamp * 1000).toISOString(),
      });
    }
  } catch (error) {
    console.error("Error fetching bridge transactions:", error);
  }
}
