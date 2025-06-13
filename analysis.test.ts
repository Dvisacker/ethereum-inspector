import { TransactionAnalyzer } from "./analysis";

describe("TransactionAnalyzer", () => {
  let analyzer: TransactionAnalyzer;

  beforeEach(() => {
    analyzer = new TransactionAnalyzer();
  });

  describe("getFunderWallets", () => {
    it("should return funder wallet addresses for given addresses", async () => {
      const wallets = [
        {
          address: "0x28c6c06298d514db089934071355e5743bf21d60",
          txCount: 100,
          entity: "Binance",
          label: "Hot wallet",
        },
        {
          address: "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
          txCount: 100,
          entity: "Binance",
          label: "Hot wallet",
        },
      ];

      const result = await analyzer.getFundingWallets(wallets);

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
