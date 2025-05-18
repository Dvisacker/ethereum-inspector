#!/usr/bin/env node
import { Command } from "commander";
import { TransactionAnalyzer, TransactionTimingAnalysis } from "./analysis";
import { ArkhamClient } from "./arkham";
import inquirer from "inquirer";
import { isAddress } from "ethers";
import ora from "ora";
import chalk from "chalk";

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
        const searchSpinner = ora(
          chalk.green("Searching for entities...")
        ).start();
        const results = await arkham.searchEntities(search);
        searchSpinner.succeed(chalk.green("Search complete!"));

        const addresses = results.arkhamAddresses.map((address) => ({
          address: address.address,
          chain: address.chain,
          entity: address.arkhamEntity?.name,
          label: address.arkhamLabel?.name,
        }));

        const answers = await inquirer.prompt({
          type: "list",
          name: "entity",
          message: chalk.green("Select an entity"),
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
        type: "list",
        name: "action",
        message: chalk.green("What do you want to do"),
        choices: [
          { name: chalk.green("Complete Analysis"), value: "complete" },
          { name: chalk.green("Timing Analysis"), value: "timing" },
          { name: chalk.green("Related Wallets"), value: "related" },
          { name: chalk.gray("Exit"), value: "exit" },
        ],
      });

      const analyzer = new TransactionAnalyzer();

      let timingAnalysis: TransactionTimingAnalysis;
      switch (answers2.action) {
        case "timing":
          const timingSpinner = ora(
            chalk.green("Analyzing transaction timing...")
          ).start();
          timingAnalysis = await analyzer.analyzeTransactionTiming(address);
          timingSpinner.succeed(chalk.green("Timing analysis complete!"));

          const formatted = analyzer.formatAnalysis(timingAnalysis);
          console.log(chalk.bold(formatted.summary));

          console.log(chalk.green("\nHourly Distribution:"));
          console.table(formatted.hourlyDistribution);

          console.log(chalk.green("\nDaily Distribution:"));
          console.table(formatted.dailyDistribution);

          console.log(chalk.green("\nMonthly Distribution:"));
          console.table(formatted.monthlyDistribution);

          console.log(chalk.green("\nYearly Distribution:"));
          console.table(formatted.yearlyDistribution);
          break;

        case "related":
          const relatedSpinner = ora(
            chalk.green("Analyzing related wallets...")
          ).start();
          const { wallets, contracts } = await analyzer.analyzeRelatedWallets(
            address,
            relatedWalletsThreshold
          );
          relatedSpinner.succeed(
            chalk.green("Related wallets analysis complete!")
          );

          console.log(chalk.green("Related Wallets:"));
          console.table(wallets, ["address", "txCount", "entity", "label"]);
          console.log(chalk.green("Most interacted contracts:"));
          console.table(contracts, [
            "address",
            "txCount",
            "entity",
            "label",
            "name",
          ]);
          break;

        case "complete":
          const timingSpinner2 = ora(
            chalk.green("Performing timing analysis...\n")
          ).start();

          timingAnalysis = await analyzer.analyzeTransactionTiming(address);
          const formatted2 = analyzer.formatAnalysis(timingAnalysis);

          console.log("\n");
          console.log(chalk.bold(formatted2.summary));

          console.log(chalk.green("\nHourly Distribution:"));
          console.table(formatted2.hourlyDistribution);

          console.log(chalk.green("\nDaily Distribution:"));
          console.table(formatted2.dailyDistribution);

          console.log(chalk.green("\nMonthly Distribution:"));
          console.table(formatted2.monthlyDistribution);

          console.log(chalk.green("\nYearly Distribution:"));
          console.table(formatted2.yearlyDistribution);

          timingSpinner2.succeed(chalk.green("Timing analysis complete!\n"));

          const relatedSpinner2 = ora(
            chalk.green("Analyzing related wallets...\n")
          ).start();

          const { wallets: wallets2, contracts: contracts2 } =
            await analyzer.analyzeRelatedWallets(address);

          relatedSpinner2.succeed(
            chalk.green("Related wallets analysis complete!\n")
          );

          const fundingSpinner = ora(
            chalk.green("Finding funding wallets...\n")
          ).start();
          const fundingWallets = await analyzer.getFundingWallets(
            wallets2.map((wallet) => wallet.address)
          );

          fundingSpinner.succeed(chalk.green("Funding wallets found!\n"));

          const walletsWithFunding = wallets2.map((wallet, index) => ({
            ...wallet,
            fundingWallet: fundingWallets.get(wallets2[index].address)?.address,
            fundingWalletEntity: `${
              fundingWallets.get(wallets2[index].address)?.entity
            } (${fundingWallets.get(wallets2[index].address)?.label})`,
          }));

          console.log(chalk.green("Related Wallets:"));
          console.table(walletsWithFunding, [
            "address",
            "txCount",
            "entity",
            "label",
            "fundingWallet",
            "fundingWalletEntity",
          ]);
          console.log(chalk.green("Most interacted contracts:"));
          console.table(contracts2, [
            "address",
            "txCount",
            "entity",
            "label",
            "name",
          ]);

          // completeSpinner.succeed(chalk.green("Complete analysis finished!"));
          break;
      }
    }
  );

program
  .command("transaction-timing")
  .description("Analyze transaction timing patterns for an address")
  .argument("<address>", "The address to analyze")
  .action(async (address: string) => {
    const spinner = ora(chalk.green("Analyzing transaction timing...")).start();
    try {
      const analyzer = new TransactionAnalyzer();
      const analysis = await analyzer.analyzeTransactionTiming(address);
      const formatted = analyzer.formatAnalysis(analysis);

      spinner.succeed(chalk.green("Analysis complete!"));

      console.log(chalk.bold(formatted.summary));

      console.log(chalk.green("\nHourly Distribution:"));
      console.table(formatted.hourlyDistribution);

      console.log(chalk.green("\nDaily Distribution:"));
      console.table(formatted.dailyDistribution);

      console.log(chalk.green("\nMonthly Distribution:"));
      console.table(formatted.monthlyDistribution);

      console.log(chalk.green("\nYearly Distribution:"));
      console.table(formatted.yearlyDistribution);
    } catch (error) {
      spinner.fail(chalk.red("Analysis failed!"));
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("related-wallets")
  .description("Analyze related wallets for an address")
  .argument("<address>", "The address to analyze")
  .action(async (address: string) => {
    const spinner = ora(chalk.green("Analyzing related wallets...")).start();
    try {
      const analyzer = new TransactionAnalyzer();
      const { wallets, contracts } = await analyzer.analyzeRelatedWallets(
        address
      );
      spinner.succeed(chalk.green("Analysis complete!"));

      console.log(chalk.green("Related Wallets:"));
      console.table(wallets, ["address", "txCount", "entity", "label"]);
      console.log(chalk.green("Most interacted contracts:"));
      console.table(contracts, [
        "address",
        "txCount",
        "entity",
        "label",
        "name",
      ]);
    } catch (error) {
      spinner.fail(chalk.red("Analysis failed!"));
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

process.on("unhandledRejection", (error) => {
  console.error(chalk.red("Unhandled promise rejection:"), error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(chalk.red("Uncaught exception:"), error);
  process.exit(1);
});

program.parse();
