import { ethers } from "ethers";
import {
  isSmartContract,
  filterEOAAddresses,
  findContractFunders,
  findEOAFunder,
  getContractName,
} from "./evm";
import { HyperSync } from "./hypersync";

// Well-known Ethereum addresses for testing
const VITALIK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // Vitalik's address (EOA)
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router (Contract)
const USDC_TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC Token (Contract)
const TEST_ADDRESSES = [
  VITALIK_ADDRESS,
  UNISWAP_V2_ROUTER,
  USDC_TOKEN,
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Another EOA
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI Token (Contract)
];

// Known transaction hashes for testing
const UNISWAP_V2_ROUTER_CREATION_TX =
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // This is just an example, we need the actual creation tx hash

describe("EVM Utils", () => {
  let hypersync: HyperSync;

  beforeEach(() => {
    hypersync = new HyperSync();
  });

  describe("isSmartContract", () => {
    it("should correctly identify EOA addresses", async () => {
      const isContract = await isSmartContract(VITALIK_ADDRESS);
      expect(isContract).toBe(false);
    });

    it("should correctly identify contract addresses", async () => {
      const isContract = await isSmartContract(UNISWAP_V2_ROUTER);
      expect(isContract).toBe(true);
    });
  });

  describe("filterEOAAddresses", () => {
    it("should filter out contract addresses", async () => {
      const eoaAddresses = await filterEOAAddresses(TEST_ADDRESSES);

      // Should contain EOA addresses
      expect(eoaAddresses).toContain(VITALIK_ADDRESS);

      // Should not contain contract addresses
      expect(eoaAddresses).not.toContain(UNISWAP_V2_ROUTER);
      expect(eoaAddresses).not.toContain(USDC_TOKEN);
    }, 100000);
  });

  describe("findContractFunders", () => {
    it("should find contract funders", async () => {
      // First get the contract's creation transaction
      const provider = ethers.getDefaultProvider();
      const code = await provider.getCode(UNISWAP_V2_ROUTER);
      if (code === "0x") {
        throw new Error("Contract not found");
      }

      // Get the contract's creation transaction
      const { transactions } = await hypersync.getTransactionsToAddress(
        UNISWAP_V2_ROUTER
      );
      if (!transactions.length) {
        throw new Error("No transactions found for contract");
      }

      const creationTx = transactions[0]; // First transaction is the creation transaction
      if (!creationTx.hash) {
        throw new Error("No transaction hash found");
      }

      const funders = await findContractFunders(creationTx.hash);
      expect(funders).toBeDefined();
      expect(funders.length).toBeGreaterThan(0);
      expect(funders[0].from).toBeDefined();
      expect(funders[0].value).toBeDefined();
    }, 100000);

    it("should return empty array for EOA addresses", async () => {
      const funders = await findContractFunders(VITALIK_ADDRESS);
      expect(funders).toEqual([]);
    });
  });

  describe("findEOAFunder", () => {
    it("should find the first funder of an EOA", async () => {
      const funder = await findEOAFunder(VITALIK_ADDRESS);
      expect(funder).toBeDefined();
      expect(funder?.from).toBeDefined();
      expect(funder?.value).toBeDefined();
    }, 100000);

    it("should throw error for contract addresses", async () => {
      await expect(findEOAFunder(UNISWAP_V2_ROUTER)).rejects.toThrow();
    }, 100000);
  });

  describe("getContractName", () => {
    it("should get the contract name", async () => {
      const name = await getContractName(UNISWAP_V2_ROUTER, 1);
      expect(name).toBe("UniswapV2Router02");
    }, 100000);
  });
});
