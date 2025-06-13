import chalk from "chalk";
import Table from "cli-table3";
import { TransactionTimingAnalysis, RelatedWalletInfo } from "../analysis";
import { ContractInfo } from "./csv";

export class TerminalFormatter {
  static printTimingAnalysis(timingAnalysis: TransactionTimingAnalysis) {
    console.log(chalk.green("\nBasic Timing Analysis:"));
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const format6HourWindow = (startHour: number) => {
      const endHour = (startHour + 6) % 24;
      return `${startHour.toString().padStart(2, "0")}:00 - ${endHour
        .toString()
        .padStart(2, "0")}:00 UTC`;
    };

    let timezoneInfo = "";

    if (timingAnalysis.inferredTimezone) {
      const { region, confidence } = timingAnalysis.inferredTimezone;
      timezoneInfo = `- Region: ${region} (${(confidence * 100).toFixed(
        1
      )}% confidence)`;
    }

    const summary = `
  Total Transactions: ${timingAnalysis.totalTransactions}
  Average Transactions per day: ${timingAnalysis.averageTransactionsPerDay.toFixed(
    2
  )}
  Busiest Periods:
  - Hour: ${timingAnalysis.busiestHour.hour}:00 UTC (${
      timingAnalysis.busiestHour.count
    } transactions)
  - Day: ${days[timingAnalysis.busiestDay.day]} (${
      timingAnalysis.busiestDay.count
    } transactions)
  - Month: ${months[timingAnalysis.busiestMonth.month]} (${
      timingAnalysis.busiestMonth.count
    } transactions)
  - Year: ${timingAnalysis.busiestYear.year} (${
      timingAnalysis.busiestYear.count
    } transactions)
  Timezone Analysis:
  - "Work" Window (Most active): ${format6HourWindow(
    timingAnalysis.busiest6Hour.startHour
  )} (${timingAnalysis.busiest6Hour.count} transactions)
  - "Sleep" Window (Least active): ${format6HourWindow(
    timingAnalysis.leastBusy6Hour.startHour
  )} (${timingAnalysis.leastBusy6Hour.count} transactions)
  ${timezoneInfo}`;

    const hourlyDistribution = Object.entries(timingAnalysis.hourlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([hour, count]) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        count,
      }));

    const dailyDistribution = Object.entries(timingAnalysis.dailyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, count]) => ({
        day: days[Number(day)],
        count,
      }));

    const monthlyDistribution = Object.entries(
      timingAnalysis.monthlyDistribution
    )
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([month, count]) => ({
        month: months[Number(month)],
        count,
      }));

    const yearlyDistribution = Object.entries(timingAnalysis.yearlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => ({
        year,
        count,
      }));

    console.log(chalk.bold(summary));

    console.log(chalk.green("\nHourly Distribution:"));
    const hourlyTable = new Table({
      head: ["Hour (UTC)", "Tx Count", "Percentage"],
      style: { head: ["green"] },
    });
    Object.entries(hourlyDistribution).forEach(([_, { hour, count }]: any) => {
      const percentage = (
        (Number(count) / timingAnalysis.totalTransactions) *
        100
      ).toFixed(2);
      hourlyTable.push([hour, count.toString(), `${percentage}%`]);
    });
    console.log(hourlyTable.toString());

    console.log(chalk.green("\nDaily Distribution:"));
    const dailyTable = new Table({
      head: ["Day", "Tx Count", "Percentage"],
      style: { head: ["green"] },
    });
    Object.entries(dailyDistribution).forEach(([_, { day, count }]: any) => {
      const percentage = (
        (Number(count) / timingAnalysis.totalTransactions) *
        100
      ).toFixed(2);
      dailyTable.push([day, count.toString(), `${percentage}%`]);
    });
    console.log(dailyTable.toString());

    console.log(chalk.green("\nMonthly Distribution:"));
    const monthlyTable = new Table({
      head: ["Month", "Tx Count", "Percentage"],
      style: { head: ["green"] },
    });
    Object.entries(monthlyDistribution).forEach(
      ([_, { month, count }]: any) => {
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
    Object.entries(yearlyDistribution).forEach(([_, { year, count }]: any) => {
      const percentage = (
        (Number(count) / timingAnalysis.totalTransactions) *
        100
      ).toFixed(2);
      yearlyTable.push([year, count.toString(), `${percentage}%`]);
    });
    console.log(yearlyTable.toString());
  }

  static printRelatedWallets(wallets: RelatedWalletInfo[]) {
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

  static printRelatedWalletsWithFunding(wallets: RelatedWalletInfo[]) {
    console.log(chalk.green("\nRelated Wallets with Funding:"));
    const walletsTable = new Table({
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
    wallets.forEach((wallet) => {
      walletsTable.push([
        wallet.address,
        wallet.txCount,
        wallet.entity,
        wallet.label,
      ]);
    });
  }

  static printInteractedContracts(contracts: ContractInfo[]) {
    console.log(chalk.green("\nMost interacted contracts:"));
    const contractsTable = new Table({
      head: ["Address", "Tx Count", "Entity", "Label", "ContractName", "Proxy"],
      style: { head: ["green"] },
    });
    contracts.forEach((contract) => {
      const contractName = contract.isProxy
        ? `${contract.proxyType} -> ${contract.implementationName}`
        : contract.name;
      contractsTable.push([
        contract.address,
        contract.txCount,
        contract.entity,
        contract.label,
        contractName,
        contract.isProxy ? "Yes" : "No",
      ]);
    });
    console.log(contractsTable.toString());
  }
}
