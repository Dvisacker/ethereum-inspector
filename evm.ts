import { ethers } from "ethers";
import { HyperSync } from "./hypersync";

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
    const ethersProvider = provider || ethers.getDefaultProvider();
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
    const ethersProvider = provider || ethers.getDefaultProvider();

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
    const ethersProvider = provider || ethers.getDefaultProvider();

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
