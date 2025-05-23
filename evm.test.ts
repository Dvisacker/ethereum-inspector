import { ethers } from "ethers";
import {
  isSmartContract,
  filterEOAAddresses,
  findContractFunders,
  findEOAFunder,
  defaultProvider,
  isGnosisSafeProxy,
  isSafeContractBytecode,
  detectProxyAndImplementation,
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
export const UNISWAP_V2_ROUTER_CREATION_TX =
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

  describe("isGnosisSafe", () => {
    // Known Gnosis Safe v1.4.1 contract on Ethereum mainnet
    const knownSafe111Address = "0x1230B3d59858296A31053C1b8562Ecf89A2f888b";
    const knownSafe141Address = "0x5Fe856Cc2A452d9C01969e9A8F63E6100504544C";
    // Random contract address that is not a Safe
    const nonSafeAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI token

    it("should correctly identify a Gnosis Safe contract (V 1.1.1)", async () => {
      const result = await isGnosisSafeProxy(
        knownSafe111Address,
        defaultProvider
      );

      expect(result.isSafe).toBe(true);
      expect(result.version).toBeDefined();
      expect(Array.isArray(result.owners)).toBe(true);
      expect(typeof result.threshold).toBe("number");
      expect(typeof result.nonce).toBe("number");

      // Additional specific checks for this known Safe
      expect(result.owners?.length).toBeGreaterThan(0);
      expect(result.threshold).toBeGreaterThan(0);
    }, 30000); // Increased timeout for network calls

    it("should correctly identify a Gnosis Safe contract (V 1.4.1)", async () => {
      const result = await isGnosisSafeProxy(
        knownSafe141Address,
        defaultProvider
      );

      expect(result.isSafe).toBe(true);
      expect(result.version).toBeDefined();
      expect(Array.isArray(result.owners)).toBe(true);
      expect(typeof result.threshold).toBe("number");
      expect(typeof result.nonce).toBe("number");

      // Additional specific checks for this known Safe
      expect(result.owners?.length).toBeGreaterThan(0);
      expect(result.threshold).toBeGreaterThan(0);
    }, 30000);

    it("should return false for a non-Safe contract", async () => {
      const result = await isGnosisSafeProxy(nonSafeAddress, defaultProvider);

      expect(result.isSafe).toBe(false);
      expect(result.version).toBeUndefined();
      expect(result.owners).toBeUndefined();
      expect(result.threshold).toBeUndefined();
      expect(result.nonce).toBeUndefined();
    }, 30000);

    it("should handle invalid addresses gracefully", async () => {
      const invalidAddress = "0xinvalid";
      const result = await isGnosisSafeProxy(invalidAddress, defaultProvider);

      expect(result.isSafe).toBe(false);
    }, 30000);
  });

  describe("isSafeContractBytecode", () => {
    it("should correctly identify Safe contract bytecode (not a proxy)", async () => {
      const provider = defaultProvider;
      const knownSafe111Address = "0x34cfac646f301356faa8b21e94227e3583fe3f5f";
      const bytecode = await provider.getCode(knownSafe111Address);
      const result = isSafeContractBytecode(`0x${bytecode}`);

      expect(result).toBe(true);
    });

    it("should correctly identify Safe contract bytecode (proxy)", async () => {
      const provider = defaultProvider;
      const knownSafe111Address = "0x1230B3d59858296A31053C1b8562Ecf89A2f888b";
      const bytecode = await provider.getCode(knownSafe111Address);
      const result = isSafeContractBytecode(`0x${bytecode}`);

      expect(result).toBe(true);
    });
  });

  describe("detectProxyAndImplementation", () => {
    const known111SafeProxy = "0x1230B3d59858296A31053C1b8562Ecf89A2f888b";
    const known141SafeProxy = "0x5Fe856Cc2A452d9C01969e9A8F63E6100504544C";
    const nonProxyAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI token (not a proxy)

    // it("should detect EIP-1967 proxy and return implementation", async () => {
    //   const result = await detectProxyAndImplementation(
    //     knownEIP1967Proxy,
    //     defaultProvider
    //   );

    //   expect(result.isProxy).toBe(true);
    //   expect(result.implementation).toBeDefined();
    //   expect(result.proxyType).toBe("EIP-1967");
    // }, 30000);

    // it("should detect EIP-1822 proxy and return implementation", async () => {
    //   const result = await detectProxyAndImplementation(
    //     knownEIP1822Proxy,
    //     defaultProvider
    //   );

    //   expect(result.isProxy).toBe(true);
    //   expect(result.implementation).toBeDefined();
    //   expect(result.proxyType).toBe("EIP-1822");
    // }, 30000);

    // it("should detect Minimal Proxy and return implementation", async () => {
    //   const result = await detectProxyAndImplementation(
    //     knownMinimalProxy,
    //     defaultProvider
    //   );

    //   expect(result.isProxy).toBe(true);
    //   expect(result.implementation).toBeDefined();
    //   expect(result.proxyType).toBe("Minimal Proxy");
    // }, 30000);

    // it("should detect UUPS proxy and return implementation", async () => {
    //   const result = await detectProxyAndImplementation(
    //     knownUUPSProxy,
    //     defaultProvider
    //   );

    //   expect(result.isProxy).toBe(true);
    //   expect(result.implementation).toBeDefined();
    //   expect(result.proxyType).toBe("UUPS");
    // }, 30

    it("should return false for non-proxy contracts", async () => {
      const result = await detectProxyAndImplementation(
        nonProxyAddress,
        defaultProvider
      );

      expect(result.isProxy).toBe(false);
      expect(result.implementation).toBeUndefined();
      expect(result.proxyType).toBeUndefined();
    }, 30000);

    it("should handle invalid addresses gracefully", async () => {
      const invalidAddress = "0xinvalid";

      await expect(
        detectProxyAndImplementation(invalidAddress, defaultProvider)
      ).rejects.toThrow();
    }, 30000);
  });
});
