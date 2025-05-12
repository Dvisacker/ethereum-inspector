#!/usr/bin/env node
import { Command } from "commander";
import { fetchLabels, printOutput, OutputType } from "./index";
import { ArkhamClient } from "./arkham";
import {
  isSmartContract,
  filterEOAAddresses,
  findContractFunders,
  findEOAFunder,
  getContractName,
} from "./evm";
import { TransactionAnalyzer } from "./analysis";

const program = new Command();

program
  .name("arkham")
  .description("CLI to fetch and format arkham labels for entities")
  .version("1.0.0");

program
  .command("addresses")
  .description("Fetch labels for an entity")
  .argument("<entity>", "The entity ID to fetch labels for")
  .option("-o, --output <type>", "Output format (csv, json, line)", "line")
  .action(async (entity: string, options: { output: OutputType }) => {
    try {
      const labels = await fetchLabels(entity);
      console.log(printOutput(options.output, labels));
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("info")
  .description("Fetch entity information")
  .argument("<entity>", "The entity ID to fetch information for")
  .option("-o, --output <type>", "Output format (json, pretty)", "pretty")
  .action(async (entity: string, options: { output: "json" | "pretty" }) => {
    try {
      const cookie = process.env.ARKHAM_COOKIE;
      if (!cookie) {
        throw new Error("ARKHAM_COOKIE environment variable is required");
      }

      const client = new ArkhamClient(cookie);
      const entityInfo = await client.fetchEntity(entity);

      if (options.output === "json") {
        console.log(JSON.stringify(entityInfo));
      } else {
        console.log("Name:", entityInfo.name);
        console.log("ID:", entityInfo.id);
        console.log("Type:", entityInfo.type);
        if (entityInfo.twitter) console.log("Twitter:", entityInfo.twitter);
        console.log("\nTags:");
        entityInfo.populatedTags.forEach((tag) => {
          console.log(
            `- ${tag.label}${tag.tagParams ? ` (${tag.tagParams})` : ""}`
          );
        });
      }
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

// EVM Analysis Commands
program
  .command("is-contract")
  .description("Check if an address is a smart contract")
  .argument("<address>", "The address to check")
  .action(async (address: string) => {
    try {
      const isContract = await isSmartContract(address);
      console.log(`${address} is ${isContract ? "a contract" : "an EOA"}`);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("filter-eoa")
  .description("Filter a list of addresses to only EOA addresses")
  .argument("<addresses...>", "Space-separated list of addresses to filter")
  .action(async (addresses: string[]) => {
    try {
      const eoaAddresses = await filterEOAAddresses(addresses);
      console.log("EOA addresses:");
      eoaAddresses.forEach((addr) => console.log(addr));
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("find-contract-funders")
  .description("Find the addresses that funded a given contract")
  .argument("<address>", "The contract address to analyze")
  .action(async (address: string) => {
    try {
      const funders = await findContractFunders(address);
      if (funders.length === 0) {
        console.log("No funders found");
        return;
      }
      console.log("Funders:");
      funders.forEach((funder) => {
        console.log(`From: ${funder.from}`);
        console.log(`Value: ${funder.value.toString()} wei`);
        console.log("---");
      });
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("find-eoa-funder")
  .description("Find the first funder of an EOA address")
  .argument("<address>", "The EOA address to analyze")
  .action(async (address: string) => {
    try {
      const funder = await findEOAFunder(address);
      if (!funder) {
        console.log("No funder found");
        return;
      }
      console.log(`From: ${funder.from}`);
      console.log(`Value: ${funder.value.toString()} wei`);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("analyze-timing")
  .description("Analyze transaction timing patterns for an address")
  .argument("<address>", "The address to analyze")
  .action(async (address: string) => {
    try {
      const analyzer = new TransactionAnalyzer();
      console.log("Analyzing transaction timing for address:", address);
      const analysis = await analyzer.analyzeTransactionTiming(address);
      const formatted = analyzer.formatAnalysis(analysis);
      console.log(formatted);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("related-wallets")
  .description("Get all related EOA wallets that interacted with an address")
  .argument("<address>", "The address to analyze")
  .option("-f, --from-block <number>", "Starting block number")
  .option("-t, --to-block <number>", "Ending block number")
  .option("-n, --threshold <number>", "Minimum number of transactions")
  .action(
    async (
      address: string,
      options: { fromBlock?: number; toBlock?: number; threshold?: number }
    ) => {
      try {
        console.log(options);
        const analyzer = new TransactionAnalyzer();
        console.log("Finding related wallets for address:", address);
        const wallets = await analyzer.getRelatedWallets(
          address,
          options.threshold,
          options.fromBlock,
          options.toBlock
        );

        if (wallets.length === 0) {
          console.log("No related wallets found");
          return;
        }

        console.log("\nRelated Wallets:");
        wallets.forEach((wallet) => {
          console.log(`\n${wallet}`);
        });
      } catch (error) {
        console.error("Error:", error);
        process.exit(1);
      }
    }
  );

program
  .command("contract-name")
  .description("Get the name of a smart contract")
  .argument("<address>", "The contract address to get the name for")
  .argument("<chainid>", "The chain to get the name for")
  .action(async (address: string, chainid: number) => {
    try {
      const name = await getContractName(address, chainid);
      console.log(`Contract name: ${name}`);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

program.parse();
