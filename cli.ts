#!/usr/bin/env node
import { Command } from "commander";
import { TransactionAnalyzer } from "./analysis";
import { ArkhamClient } from "./arkham";
import inquirer from "inquirer";
import { isAddress } from "ethers";
import ora from "ora";
import chalk from "chalk";
import Table from "cli-table3";
import { config } from "./config";

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

      if (answers2.action.includes("timing")) {
        console.log("\n");
        const timingSpinner = ora(
          chalk.green("Analyzing transaction timing...")
        ).start();
        const timingAnalysis = await analyzer.analyzeTransactionTiming(address);
        timingSpinner.succeed(chalk.green("Timing analysis complete!"));

        console.log(chalk.green("\nBasic Timing Analysis:"));
        const formatted = analyzer.formatAnalysis(timingAnalysis);
        console.log(chalk.bold(formatted.summary));

        console.log(chalk.green("\nHourly Distribution:"));
        const hourlyTable = new Table({
          head: ["Hour (UTC)", "Tx Count", "Percentage"],
          style: { head: ["green"] },
        });
        Object.entries(formatted.hourlyDistribution).forEach(
          ([_, { hour, count }]) => {
            const percentage = (
              (Number(count) / timingAnalysis.totalTransactions) *
              100
            ).toFixed(2);
            hourlyTable.push([hour, count.toString(), `${percentage}%`]);
          }
        );
        console.log(hourlyTable.toString());

        console.log(chalk.green("\nDaily Distribution:"));
        const dailyTable = new Table({
          head: ["Day", "Tx Count", "Percentage"],
          style: { head: ["green"] },
        });
        Object.entries(formatted.dailyDistribution).forEach(
          ([index, { day, count }]) => {
            const percentage = (
              (Number(count) / timingAnalysis.totalTransactions) *
              100
            ).toFixed(2);
            dailyTable.push([day, count.toString(), `${percentage}%`]);
          }
        );
        console.log(dailyTable.toString());

        console.log(chalk.green("\nMonthly Distribution:"));
        const monthlyTable = new Table({
          head: ["Month", "Tx Count", "Percentage"],
          style: { head: ["green"] },
        });
        Object.entries(formatted.monthlyDistribution).forEach(
          ([index, { month, count }]) => {
            const percentage = (
              (Number(count) / timingAnalysis.totalTransactions) *
              100
            ).toFixed(2);
            monthlyTable.push([month, count.toString(), `${percentage}%`]);
          }
        );
        console.log(monthlyTable.toString());

        console.log(chalk.green("\nYearly Distribution:"));
        const yearlyTable = new Table({
          head: ["Year", "Tx Count", "Percentage"],
          style: { head: ["green"] },
        });
        Object.entries(formatted.yearlyDistribution).forEach(
          ([index, { year, count }]) => {
            const percentage = (
              (Number(count) / timingAnalysis.totalTransactions) *
              100
            ).toFixed(2);
            yearlyTable.push([year, count.toString(), `${percentage}%`]);
          }
        );
        console.log(yearlyTable.toString());
      }

      console.log("\n");

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
            const fundingWallets = await analyzer.getFundingWallets(
              wallets.map((wallet) => wallet.address)
            );

            fundingWalletsSpinner.succeed(
              chalk.green("Related wallets funder wallets analysis complete!")
            );

            const walletsWithFunding = wallets.map((wallet, index) => ({
              ...wallet,
              address: wallet.address,
              fundingWallet: fundingWallets.get(wallets[index].address)
                ?.address,
              fundingWalletEntity: `${
                fundingWallets.get(wallets[index].address)?.entity
              } (${fundingWallets.get(wallets[index].address)?.label})`,
            }));

            console.log(chalk.green("\nRelated Wallets:"));
            const walletsFundingTable = new Table({
              head: [
                "Address",
                "Tx Count",
                "Entity",
                "Label",
                "Funding Wallet",
                "Funding Wallet Entity",
              ],
              style: { head: ["green"] },
            });
            walletsWithFunding.forEach((wallet) => {
              walletsFundingTable.push([
                wallet.address,
                wallet.txCount,
                wallet.entity,
                wallet.label,
                wallet.fundingWallet || "",
                wallet.fundingWalletEntity,
              ]);
            });
            console.log(walletsFundingTable.toString());

            // Case of related wallets only
          } else {
            console.log(chalk.green("\nRelated Wallets:"));
            const walletsTable = new Table({
              head: ["Address", "Tx Count", "Entity", "Label"],
              style: { head: ["green"] },
            });
            wallets.forEach((wallet) => {
              walletsTable.push([
                wallet.address,
                wallet.txCount,
                wallet.entity,
                wallet.label,
              ]);
            });
            console.log(walletsTable.toString());
          }
        }

        if (answers2.action.includes("contracts")) {
          console.log(chalk.green("\nMost interacted contracts:"));
          const contractsTableCmd = new Table({
            head: [
              "Address",
              "Tx Count",
              "Entity",
              "Label",
              "ContractName",
              "Proxy",
            ],
            style: { head: ["green"] },
          });
          contracts.forEach((contract) => {
            const contractName = contract.isProxy
              ? `${contract.implementationName} (Proxy Type: ${contract.proxyType})`
              : contract.name;
            contractsTableCmd.push([
              contract.address,
              contract.txCount,
              contract.entity,
              contract.label,
              contractName,
              contract.isProxy ? "Yes" : "No",
            ]);
          });
          console.log(contractsTableCmd.toString());
        }
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
