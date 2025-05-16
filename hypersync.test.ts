import { DecodedEvent } from "@envio-dev/hypersync-client";
import { addressToSymbol, HyperSync, WHITELISTED_TOKENS } from "./hypersync";

describe("HyperSync", () => {
  let hyperSync: HyperSync;

  beforeEach(() => {
    hyperSync = new HyperSync();
  });

  describe("getAllTransfers", () => {
    it("should get all transfers for given addresses", async () => {
      const addresses = [
        "0xD1a923D70510814EaE7695A76326201cA06d080F",
        "0xc0A101c4E9Bb4463BD2F5d6833c2276C36914Fb6",
      ];

      const result = await hyperSync.getAllTransfers(addresses);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(result.logs).toBeDefined();
      expect(result.decodedLogs).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
      expect(Array.isArray(result.logs)).toBe(true);
      expect(Array.isArray(result.decodedLogs)).toBe(true);
    });
  });

  describe("getOutflows", () => {
    it("should get outflows for given addresses", async () => {
      const addresses = ["0xD1a923D70510814EaE7695A76326201cA06d080F"];

      const result = await hyperSync.getOutflows(addresses);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(result.logs).toBeDefined();
      expect(result.decodedLogs).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
      expect(Array.isArray(result.logs)).toBe(true);
      expect(Array.isArray(result.decodedLogs)).toBe(true);
    });
  });

  describe("getInflows", () => {
    it("should get inflows for given addresses", async () => {
      const addresses = ["0xD1a923D70510814EaE7695A76326201cA06d080F"];

      const result = await hyperSync.getInflows(addresses);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(result.logs).toBeDefined();
      expect(result.decodedLogs).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
      expect(Array.isArray(result.logs)).toBe(true);
      expect(Array.isArray(result.decodedLogs)).toBe(true);
    });
  });

  describe("getTransactionsToAddress", () => {
    it("should get all transactions to a given address", async () => {
      const address = "0xD1a923D70510814EaE7695A76326201cA06d080F";

      const result = await hyperSync.getTransactionsToAddress(address);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);

      // Check transaction structure if any transactions found
      if (result.transactions.length > 0) {
        const tx = result.transactions[0];
        expect(tx).toHaveProperty("blockNumber");
        expect(tx).toHaveProperty("from");
        expect(tx).toHaveProperty("to");
        expect(tx).toHaveProperty("value");
      }
    });
  });
});
