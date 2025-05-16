#!/usr/bin/env node
import { Command } from "commander";
import { TransactionAnalyzer, TransactionTimingAnalysis } from "./analysis";
import { ArkhamClient } from "./arkham";
import inquirer from "inquirer";
import { isAddress } from "ethers";

const program = new Command();

program
  .name("searchor")
  .description("Analyze and search for entities")
  .version("1.0.0")
  .argument("<search>", "The search query to fetch entities for")
  .option(
    "-t, --related-wallets-threshold <type>",
    "Threshold for related wallets",
    "3"
  )
  .action(
    async (search: string, options: { relatedWalletsThreshold: string }) => {
      const arkham = new ArkhamClient(process.env.ARKHAM_COOKIE || "");
      const relatedWalletsThreshold = parseInt(options.relatedWalletsThreshold);

      let address: string;

      // if search is an ethereum address, fetch the entity
      if (!isAddress(search)) {
        const results = await arkham.searchEntities(search);
        const addresses = results.arkhamAddresses.map((address) => ({
          address: address.address,
          chain: address.chain,
          entity: address.arkhamEntity?.name,
          label: address.arkhamLabel?.name,
        }));

        const answers = await inquirer.prompt({
          type: "list",
          name: "entity",
          message: "Select an entity",
          choices: addresses.map((address) => ({
            name: `${address.entity} (${address.address})`,
            value: address.address,
          })),
        });

        const entity = addresses.find(
          (address) => address.address === answers.entity
        );

        if (!entity) {
          console.error("Entity not found");
          process.exit(1);
        }

        address = entity.address.toLowerCase();
      } else {
        address = search.toLowerCase();
      }

      const answers2 = await inquirer.prompt({
        type: "list",
        name: "action",
        message: "What do you want to do",
        choices: [
          { name: "Complete Analysis", value: "complete" },
          { name: "Timing Analysis", value: "timing" },
          { name: "Related Wallets", value: "related" },
          { name: "Exit", value: "exit" },
        ],
      });

      const analyzer = new TransactionAnalyzer();

      let timingAnalysis: TransactionTimingAnalysis;
      switch (answers2.action) {
        case "timing":
          timingAnalysis = await analyzer.analyzeTransactionTiming(address);
          console.log(analyzer.formatAnalysis(timingAnalysis));
          break;
        case "related":
          const { wallets, contracts } = await analyzer.analyzeRelatedWallets(
            address,
            relatedWalletsThreshold
          );
          console.log("Related Wallets:");
          console.table(wallets, ["address", "txCount", "entity", "label"]);
          console.log("Most interacted contracts:");
          console.table(contracts, [
            "address",
            "txCount",
            "entity",
            "label",
            "name",
          ]);
          break;
        case "complete":
          console.log("Timing Analysis ...");
          timingAnalysis = await analyzer.analyzeTransactionTiming(address);
          console.log(analyzer.formatAnalysis(timingAnalysis));

          const { wallets: wallets2, contracts: contracts2 } =
            await analyzer.analyzeRelatedWallets(address);
          console.log("Related Wallets ...");
          console.table(wallets2, ["address", "txCount", "entity", "label"]);
          console.log("Most interacted contracts ...");
          console.table(contracts2, [
            "address",
            "txCount",
            "entity",
            "label",
            "name",
          ]);
          break;
      }
    }
  );

program
  .command("transaction-timing")
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
  .description("Analyze related wallets for an address")
  .argument("<address>", "The address to analyze")
  .action(async (address: string) => {
    const analyzer = new TransactionAnalyzer();
    const { wallets, contracts } = await analyzer.analyzeRelatedWallets(
      address
    );
    console.log("Related Wallets:");
    console.table(wallets, ["address", "txCount", "entity", "label"]);
    console.log("Most interacted contracts:");
    console.table(contracts, ["address", "txCount", "entity", "label", "name"]);
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
