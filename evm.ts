import { ethers } from "ethers";
import { HyperSync } from "./hypersync";
import { EtherscanClient } from "./etherscan";
import dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

export const defaultProvider = ethers.getDefaultProvider("mainnet", {
  etherscan: process.env.ETHERSCAN_API_KEY,
  alchemy: process.env.ALCHEMY_API_KEY,
});

/**
 * Checks if an Ethereum address is a smart contract
 * @param address The Ethereum address to check
 * @param provider Optional ethers provider (defaults to ethers' default provider)
 * @returns Promise<boolean> True if the address is a smart contract, false if it's an EOA
 */
export async function isSmartContract(
  address: string,
  provider?: ethers.Provider
): Promise<boolean> {
  try {
    const ethersProvider = provider || defaultProvider;
    const code = await ethersProvider.getCode(address);
    return code !== "0x";
  } catch (error) {
    console.error(`Error checking if ${address} is a smart contract:`, error);
    throw error;
  }
}

/**
 * Filters a list of addresses to return only EOA (Externally Owned Account) addresses
 * @param addresses List of Ethereum addresses to filter
 * @param provider Optional ethers provider (defaults to ethers' default provider)
 * @returns Promise<string[]> List of EOA addresses
 */
export async function filterEOAAddresses(
  addresses: string[],
  provider?: ethers.Provider
): Promise<string[]> {
  const eoaAddresses: string[] = [];

  for (const address of addresses) {
    try {
      const isContract = await isSmartContract(address, provider);
      if (!isContract) {
        eoaAddresses.push(address);
      }
    } catch (error) {
      console.error(`Error processing address ${address}:`, error);
      // Skip this address if there's an error
      continue;
    }
  }

  return eoaAddresses;
}

/**
 * Finds the addresses that funded a given contract by analyzing its creation transaction
 * @param contractAddress The address of the contract to analyze
 * @param provider Optional ethers provider (defaults to ethers' default provider)
 * @returns Promise<{from: string, value: bigint}[]> List of funders and their contribution amounts
 */
export async function findContractFunders(
  contractAddress: string,
  provider?: ethers.Provider
): Promise<{ from: string; value: bigint }[]> {
  try {
    const ethersProvider = provider || defaultProvider;

    // Get the contract's creation transaction
    const tx = await ethersProvider.getTransaction(contractAddress);
    if (!tx) {
      throw new Error(
        `No creation transaction found for contract ${contractAddress}`
      );
    }

    // Get the receipt to check if the transaction was successful
    const receipt = await ethersProvider.getTransactionReceipt(tx.hash);
    if (!receipt) {
      throw new Error(
        `No receipt found for contract creation transaction ${tx.hash}`
      );
    }

    // If the transaction was successful, return the funder and value
    if (receipt.status === 1) {
      return [
        {
          from: tx.from,
          value: tx.value,
        },
      ];
    }

    return [];
  } catch (error) {
    console.error(
      `Error finding funders for contract ${contractAddress}:`,
      error
    );
    throw error;
  }
}

/**
 * Finds the first funder of an EOA (Externally Owned Account) by looking at its first incoming transaction
 * @param eoaAddress The EOA address to analyze
 * @param provider Optional ethers provider (defaults to ethers' default provider)
 * @returns Promise<{from: string, value: bigint} | null> The funder and their contribution amount, or null if no funder found
 */
export async function findEOAFunder(
  eoaAddress: string,
  provider?: ethers.Provider
): Promise<{ from: string; value: bigint } | null> {
  try {
    const ethersProvider = provider || defaultProvider;

    const isContract = await isSmartContract(eoaAddress, ethersProvider);
    if (isContract) {
      throw new Error(`${eoaAddress} is a contract address, not an EOA`);
    }

    const hypersync = new HyperSync();
    const { transactions } = await hypersync.getTransactionsToAddress(
      eoaAddress
    );

    if (transactions.length === 0) {
      return null;
    }

    const firstTx = transactions.sort((a, b) => {
      const blockA = a.blockNumber ?? 0;
      const blockB = b.blockNumber ?? 0;
      return Number(blockA - blockB);
    })[0];

    if (!firstTx.from || firstTx.value === undefined) {
      return null;
    }

    return {
      from: firstTx.from,
      value: BigInt(firstTx.value),
    };
  } catch (error) {
    console.error(`Error finding funder for EOA ${eoaAddress}:`, error);
    throw error;
  }
}

/**
 * Checks if a contract is a Gnosis Safe by verifying its interface
 * @param address The contract address to check
 * @param provider The ethers provider
 * @returns Object containing whether it's a Safe and additional details
 */
export async function isGnosisSafeProxy(
  address: string,
  provider: ethers.Provider
): Promise<{
  isSafe: boolean;
  version?: string;
  owners?: string[];
  threshold?: number;
  nonce?: number;
}> {
  try {
    // Create contract instance with minimal ABI for interface check
    const safeABI = [
      "function getOwners() view returns (address[])",
      "function getThreshold() view returns (uint256)",
      "function getNonce() view returns (uint256)",
      "function VERSION() view returns (string)",
    ];

    const contract = new ethers.Contract(address, safeABI, provider);

    // Check if contract supports the Safe interface
    const isSafe = await contract
      .getOwners()
      .then(() => true)
      .catch(() => false);

    if (!isSafe) {
      return { isSafe: false };
    }

    // Get Safe details
    const [owners, threshold, nonce, version] = await Promise.all([
      contract.getOwners().catch(() => []),
      contract.getThreshold().catch(() => 0),
      contract.getNonce().catch(() => 0),
      contract.VERSION().catch(() => "unknown"),
    ]);

    return {
      isSafe: true,
      version,
      owners,
      threshold: Number(threshold),
      nonce: Number(nonce),
    };
  } catch (error) {
    logger.error("Error checking Gnosis Safe:", { address, error });
    return { isSafe: false };
  }
}

/**
 * Standard function signatures for different contract types
 */
const STANDARD_FUNCTIONS = {
  ERC20: [
    "transfer(address,uint256)",
    "balanceOf(address)",
    "approve(address,uint256)",
    "transferFrom(address,address,uint256)",
    "allowance(address,address)",
    "totalSupply()",
  ],
  ERC721: [
    "transferFrom(address,address,uint256)",
    "safeTransferFrom(address,address,uint256)",
    "ownerOf(uint256)",
    "balanceOf(address)",
    "approve(address,uint256)",
    "getApproved(uint256)",
    "setApprovalForAll(address,bool)",
    "isApprovedForAll(address,address)",
  ],
  Safe: [
    "getOwners()",
    "getThreshold()",
    "getNonce()",
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)",
    "isOwner(address)",
    "VERSION()",
  ],
} as const;

/**
 * Calculates the function selector (first 4 bytes of keccak256 hash) for a function signature
 */
function getFunctionSelector(functionSignature: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(functionSignature)).slice(0, 10);
}

/**
 * Checks if a function selector is present in the contract bytecode
 */
function hasFunctionSelector(
  bytecode: string,
  functionSelector: string
): boolean {
  const cleanBytecode = bytecode.startsWith("0x")
    ? bytecode.slice(2)
    : bytecode;
  const cleanSelector = functionSelector.startsWith("0x")
    ? functionSelector.slice(2)
    : functionSelector;
  return cleanBytecode.includes(cleanSelector);
}

/**
 * Checks if a contract bytecode matches the Gnosis Safe standard
 * @param bytecode The contract bytecode
 * @returns Object containing whether it's a Safe and which functions are present
 */
export function isSafeContractBytecode(bytecode: string): boolean {
  const functions = STANDARD_FUNCTIONS.Safe;
  const functionPresence = functions.reduce((acc, signature) => {
    acc[signature] = hasFunctionSelector(
      bytecode,
      getFunctionSelector(signature)
    );
    return acc;
  }, {} as Record<string, boolean>);

  // Consider it a Safe if it has at least getOwners, getThreshold, and execTransaction
  const isSafe =
    functionPresence["getOwners()"] &&
    functionPresence["getThreshold()"] &&
    functionPresence[
      "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)"
    ];

  return isSafe;
}

export async function getEIP1967ProxyImplementation(
  proxyAddress: string,
  provider: ethers.Provider
): Promise<string> {
  const storageValue = await provider.getStorage(
    proxyAddress,
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  );
  // Convert to address format (remove extra zeros and add 0x prefix)
  return "0x" + storageValue.slice(-40);
}

export async function getMinimalProxyImplementation(
  provider: ethers.Provider,
  proxyAddress: string
): Promise<string> {
  // Get the bytecode of the proxy contract
  const bytecode = await provider.getCode(proxyAddress);

  // Check if it's a minimal proxy by looking for the characteristic prefix
  const minimalProxyPrefix = "0x363d3d373d3d3d363d73";
  const minimalProxySuffix = "5af43d82803e903d91602b57fd5bf3";

  if (
    !bytecode.startsWith(minimalProxyPrefix) ||
    !bytecode.includes(minimalProxySuffix)
  ) {
    throw new Error(
      "The provided address does not appear to be a minimal proxy contract"
    );
  }

  // Extract the implementation address
  // The implementation address is the 20 bytes after the prefix
  const implementationAddress = "0x" + bytecode.slice(22, 62);

  // Verify it's a valid address
  if (!ethers.isAddress(implementationAddress)) {
    throw new Error("Failed to extract a valid implementation address");
  }

  return implementationAddress;
}

/**
 * Detects if a contract is a proxy and returns the implementation address if it is
 * Supports multiple proxy patterns:
 * - EIP-1967: implementation() at storage slot 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
 * - EIP-1822: implementation() at storage slot 0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3
 * - Gnosis Safe: implementation() at storage slot 0
 * - Minimal Proxy (EIP-1167): implementation address is embedded in the bytecode
 * - UUPS: implementation() at storage slot 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
 *
 * @param address The contract address to check
 * @param provider The ethers provider
 * @returns Object containing whether it's a proxy and the implementation address if it is
 */
export async function detectProxyAndImplementation(
  address: string,
  provider: ethers.Provider
): Promise<{
  isProxy: boolean;
  implementation?: string;
  proxyType?:
    | "EIP-1967"
    | "EIP-1822"
    | "Gnosis Safe Proxy"
    | "Minimal Proxy"
    | "UUPS";
}> {
  try {
    // Get the contract bytecode
    const bytecode = await provider.getCode(address);

    // Check if it's a minimal proxy (EIP-1167)
    if (bytecode.startsWith("0x363d3d373d3d3d363d73")) {
      // Extract implementation address from bytecode
      // The implementation address is embedded in the bytecode after the prefix
      const implementationAddress = "0x" + bytecode.slice(22, 62);
      return {
        isProxy: true,
        implementation: implementationAddress,
        proxyType: "Minimal Proxy",
      };
    }

    // Check if it's a Gnosis Safe proxy
    if (isSafeContractBytecode(bytecode)) {
      return {
        isProxy: true,
        implementation: undefined, // TODO
        proxyType: "Gnosis Safe Proxy",
      };
    }

    const eip1967Slot =
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implementation = await provider.getStorage(address, eip1967Slot);

    if (
      implementation !==
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      const implementationAddress = "0x" + implementation.slice(26);
      const implementationCode = await provider.getCode(implementationAddress);

      const hasUUPSUpgrade = implementationCode.includes(
        ethers.keccak256(ethers.toUtf8Bytes("upgradeTo(address)")).slice(0, 10)
      );

      return {
        isProxy: true,
        implementation: implementationAddress,
        proxyType: hasUUPSUpgrade ? "UUPS" : "EIP-1967",
      };
    }

    const eip1822Slot =
      "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";
    const eip1822Implementation = await provider.getStorage(
      address,
      eip1822Slot
    );

    if (
      eip1822Implementation !==
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      const implementationAddress = "0x" + eip1822Implementation.slice(26);

      return {
        isProxy: true,
        implementation: implementationAddress,
        proxyType: "EIP-1822",
      };
    }

    return {
      isProxy: false,
    };
  } catch (error) {
    console.error(`Error detecting proxy for ${address}:`, error);
    throw error;
  }
}
