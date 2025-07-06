#!/usr/bin/env node
import { Command } from "commander";
import {
  BridgeTransaction,
  RelatedWalletInfo,
  TransactionAnalyzer,
  TransactionTimingAnalysis,
} from "./analysis";
import { ArkhamClient } from "./arkham";
import inquirer from "inquirer";
import { isAddress } from "ethers";
import ora from "ora";
import chalk from "chalk";
import { config } from "./config";
import { TerminalFormatter } from "./formatters/terminal";
import { ContractInfo, XLSXExporter } from "./formatters/sheet";
import {
  HyperSync,
  parseTransactions,
  TransactionWithTimestamp,
} from "./hypersync";
import { NETWORKS } from "./constants";
import { Transfer } from "./types";
import { cleanup as cleanupDebank } from "./debank";

const program = new Command();

// Handle cleanup on process exit
async function handleExit() {
  console.log("\nCleaning up...");
  await cleanupDebank();
  process.exit();
}

// Register cleanup handlers
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('SIGQUIT', handleExit);

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
      try {
        const arkham = new ArkhamClient(config.get("arkhamCookie"));
        let wallets: RelatedWalletInfo[] = [];
        let contracts: ContractInfo[] = [];
        let transfers: Transfer[] = [];
        let parsedTransactions: TransactionWithTimestamp[] = [];
        let bridgeTransactions: BridgeTransaction[] = [];
        let timingAnalysis: TransactionTimingAnalysis;

        if (options.relatedWalletsThreshold) {
          config.set(
            "relatedWalletsThreshold",
            +options.relatedWalletsThreshold
          );
        }

        let address: string;

        // if the search string is not an ethereum address, fetch the entity from arkham
        // and suggest related addresses
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

        const csvExporter = new XLSXExporter(address);

        // Add providers menu
        const providerAnswers = await inquirer.prompt({
          type: "checkbox",
          name: "providers",
          message: chalk.green("Select data providers to use"),
          default: ["arkham", "debank"],
          choices: [
            { name: chalk.green("Arkham Intelligence"), value: "arkham", disabled: true, checked: true },
            { name: chalk.green("DeBank"), value: "debank" },
          ],
        });

        // Update config based on provider selection
        config.set("enableDebank", providerAnswers.providers.includes("debank"));

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
            { name: chalk.green("Transfers (only CSV)"), value: "transfers" },
            {
              name: chalk.green("Transactions (only CSV)"),
              value: "transactions",
            },
            {
              name: chalk.green("Bridge Transactions (only CSV, experimental)"),
              value: "bridges",
            },
          ],
        });

        const analyzer = new TransactionAnalyzer();

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
            chalk.green(
              "Analyzing related wallets and contracts interactions..."
            )
          ).start();
          const relatedWalletsData = await analyzer.analyzeRelatedWallets(
            address
          );
          wallets = relatedWalletsData.wallets;
          contracts = relatedWalletsData.contracts;

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

              // Case of related wallets only
            } else {
              TerminalFormatter.printRelatedWallets(wallets);
            }
          }

          if (answers2.action.includes("contracts")) {
            TerminalFormatter.printInteractedContracts(contracts);
          }
        }

        if (
          answers2.action.includes("transfers") ||
          answers2.action.includes("transactions")
        ) {
          let hyperSync = new HyperSync();
          let { transactions, logs, blocks, decodedLogs } =
            await hyperSync.getOutflowsAndWhitelistedInflows([address]);

          if (answers2.action.includes("transfers")) {
            transfers = await hyperSync.parseTransfers(
              logs,
              decodedLogs,
              transactions,
              blocks,
              NETWORKS.MAINNET
            );
          }

          if (answers2.action.includes("transactions")) {
            parsedTransactions = await parseTransactions(transactions, blocks);
          }
        }

        if (answers2.action.includes("bridges")) {
          let results = await analyzer.analyzeBridgeTransactions(address);

          bridgeTransactions = results.bridgeTransactions;
        }

        csvExporter.setupAddressColorMapping(
          wallets,
          contracts,
          transfers,
          parsedTransactions
        );

        if (answers2.action.includes("related")) {
          csvExporter.writeRelatedWalletsSheet(wallets);
        }

        if (answers2.action.includes("transfers")) {
          csvExporter.writeTransfersSheet(transfers);
        }

        if (answers2.action.includes("transactions")) {
          csvExporter.writeTransactionsSheet(parsedTransactions);
        }

        if (answers2.action.includes("contracts")) {
          csvExporter.writeContractsSheet(contracts);
        }

        if (answers2.action.includes("bridges")) {
          csvExporter.writeBridgeTransactionsSheet(bridgeTransactions);
        }

        csvExporter.exportAnalysisXLSX();
      } catch (error) {
        console.log(error);
        process.exit(1);
      }
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
