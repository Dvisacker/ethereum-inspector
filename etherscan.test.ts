import { EtherscanClient } from "./etherscan";
import dotenv from "dotenv";
import { performance } from "perf_hooks";

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

if (!ETHERSCAN_API_KEY) {
  throw new Error("ETHERSCAN_API_KEY is not set");
}

describe("EtherscanClient", () => {
  describe("throttling", () => {
    it("should respect rate limiting and concurrency limits", async () => {
      const client = new EtherscanClient(ETHERSCAN_API_KEY, {
        minTimeBetweenRequests: 200, // 5 requests per second
        maxConcurrentRequests: 3,
      });

      const addresses = [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
      ];

      const startTime = performance.now();

      // Make parallel requests for contract names
      const results = await Promise.all(
        addresses.map((address) => client.getContractName(address, 1))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify results
      expect(results).toHaveLength(addresses.length);
      expect(results.every((name) => typeof name === "string")).toBe(true);
      expect(totalTime).toBeGreaterThanOrEqual(400);

      console.log("Etherscan throttling test results:", {
        totalTime: `${totalTime.toFixed(2)}ms`,
        results,
      });
    }, 1000);

    it("should handle mixed API calls with throttling", async () => {
      const client = new EtherscanClient(ETHERSCAN_API_KEY, {
        minTimeBetweenRequests: 200,
        maxConcurrentRequests: 3,
      });

      const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC

      const startTime = performance.now();

      const [contractName, contractSource] = await Promise.all([
        client.getContractName(address, 1),
        client.getContractSourceCode(address, 1),
      ]);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(typeof contractName).toBe("string");
      expect(contractSource).toBeDefined();

      console.log("Etherscan mixed API test results:", {
        totalTime: `${totalTime.toFixed(2)}ms`,
        contractName,
        hasSourceCode: !!contractSource,
      });
    }, 1000);
  });
});
