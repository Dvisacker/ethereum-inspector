import { TransactionAnalyzer } from "./analysis";

describe("TransactionAnalyzer", () => {
  let analyzer: TransactionAnalyzer;

  beforeEach(() => {
    analyzer = new TransactionAnalyzer();
  });

  describe("getFundingWallets", () => {
    it("should return funding wallet addresses for given addresses", async () => {
      const addresses = [
        "0x28c6c06298d514db089934071355e5743bf21d60", // Binance hot wallet
        "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be", // Another Binance hot wallet
      ];

      const result = await analyzer.getFundingWallets(addresses);

      console.log(result);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log("Funding wallets found:", result);

      result.forEach((wallet) => {
        expect(wallet).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    }, 30000);
  });
});
