#!/usr/bin/env node
import { Command } from "commander";
import { TransactionAnalyzer, TransactionTimingAnalysis } from "./analysis";
import { ArkhamClient } from "./arkham";
import inquirer from "inquirer";
import { isAddress } from "ethers";
import ora from "ora";
import chalk from "chalk";
import { config } from "./config";
import { TerminalFormatter } from "./formatters/terminal";
import { XLSXExporter } from "./formatters/csv";

const program = new Command();

program
  .name("searchor")
  .description("Analyze and search for entities")
  .version("1.0.0")
  .argument("<search>", "The search query to fetch entities for")
  .option(
    "-t, --related-wallets-threshold <type>",
    "Threshold for related wallets"
  )
  .action(
    async (search: string, options: { relatedWalletsThreshold: string }) => {
      const arkham = new ArkhamClient(config.get("arkhamCookie"));
      if (options.relatedWalletsThreshold) {
        config.set("relatedWalletsThreshold", +options.relatedWalletsThreshold);
      }

      const csvExporter = new XLSXExporter();

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
          message: chalk.green("Select a wallet"),
          choices: addresses.map((address) => ({
            name: `${chalk.green(address.entity)} (${chalk.gray(
              address.address
            )})`,
            value: address.address,
          })),
        });

        const entity = addresses.find(
          (address) => address.address === answers.entity
        );

        if (!entity) {
          console.error(chalk.red("Entity not found"));
          process.exit(1);
        }

        address = entity.address.toLowerCase();
      } else {
        address = search.toLowerCase();
      }

      const answers2 = await inquirer.prompt({
        type: "checkbox",
        name: "action",
        message: chalk.green("What do you want to do"),
        default: ["timing", "related", "contracts"],
        choices: [
          { name: chalk.green("Timing Analysis"), value: "timing" },
          { name: chalk.green("Related Wallets"), value: "related" },
          { name: chalk.green("Related Wallet Funders"), value: "funding" },
          { name: chalk.green("Interacted Contracts"), value: "contracts" },
        ],
      });

      const analyzer = new TransactionAnalyzer();
      let timingAnalysis: TransactionTimingAnalysis;

      if (answers2.action.includes("timing")) {
        console.log("\n");
        const timingSpinner = ora(
          chalk.green("Analyzing transaction timing...")
        ).start();
        timingAnalysis = await analyzer.analyzeTransactionTiming(address);
        timingSpinner.succeed(chalk.green("Timing analysis complete!"));

        TerminalFormatter.printTimingAnalysis(timingAnalysis);
        csvExporter.writeTimingAnalysisSheet(timingAnalysis);

        console.log("\n");
      }

      if (
        answers2.action.includes("related") ||
        answers2.action.includes("contracts")
      ) {
        const relatedSpinner = ora(
          chalk.green("Analyzing related wallets and contracts interactions...")
        ).start();
        const { wallets, contracts } = await analyzer.analyzeRelatedWallets(
          address
        );
        relatedSpinner.succeed(
          chalk.green(
            "Related wallets and contracts interactions analysis complete!"
          )
        );

        if (answers2.action.includes("related")) {
          // Case of related wallets + funding wallets of related wallets
          if (answers2.action.includes("funding")) {
            console.log("\n");
            const fundingWalletsSpinner = ora(
              chalk.green("Analyzing related wallets funder wallets...")
            ).start();
            const walletsWithFunding = await analyzer.getFundingWallets(
              wallets
            );

            fundingWalletsSpinner.succeed(
              chalk.green("Related wallets funder wallets analysis complete!")
            );

            TerminalFormatter.printRelatedWalletsWithFunding(
              walletsWithFunding
            );
            csvExporter.writeRelatedWalletsSheet(wallets);

            // Case of related wallets only
          } else {
            TerminalFormatter.printRelatedWallets(wallets);
            csvExporter.writeRelatedWalletsSheet(wallets);
          }
        }

        if (answers2.action.includes("contracts")) {
          TerminalFormatter.printInteractedContracts(contracts);
          csvExporter.writeContractsSheet(contracts);
        }
      }

      csvExporter.exportAnalysisXLSX();
    }
  );

process.on("unhandledRejection", (error) => {
  console.error(chalk.red("Unhandled promise rejection:"), error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(chalk.red("Uncaught exception:"), error);
  process.exit(1);
});

program.parse();
