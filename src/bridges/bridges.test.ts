import { BridgeTransactionsFetcher } from "./fetcher";
import { LayerZeroProvider } from "./providers/layerzero";
import axios from "axios";
import { ethers } from "ethers";
import { LayerZeroMessage } from "./types";

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
    const transactions = await fetcher.fetchAllBridgeTransactions(testAddress);
    console.log(transactions);
    expect(Array.isArray(transactions)).toBe(true);
  }, 30000);

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
