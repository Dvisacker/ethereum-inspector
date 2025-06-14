import { TransactionTimingAnalysis } from "../analysis";
import { RelatedWalletInfo } from "../analysis";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx-js-style";
import { getTokenDecimalsByAddress, NetworkId } from "../constants";
import { Transfer } from "../types";
import { getLightRedGradient, shortAddr, shortHash } from "../helpers";

export interface ContractInfo {
  address: string;
  txCount: number;
  entity: string;
  label: string;
  name: string;
  isProxy: boolean;
  proxyType?: string;
  implementationName?: string;
}

const TIMING_ANALYSIS_COL_WIDTHS = [30, 20, 20];
const RELATED_WALLETS_COL_WIDTHS = [44, 18, 22, 32, 12, 12];
const CONTRACTS_COL_WIDTHS = [44, 18, 22, 32, 32, 12, 18, 32];
const TRANSFERS_COL_WIDTHS = [44, 44, 44, 14, 24, 66, 14];

// Helper styles
const headerStyle = {
  font: { bold: true },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  },
};
const cellBorder = {
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  },
};

export class XLSXExporter {
  private workbook: XLSX.WorkBook;
  private address: string;

  constructor(address: string) {
    this.workbook = XLSX.utils.book_new();
    this.address = address;
  }

  formatTimingAnalysis(analysis: TransactionTimingAnalysis) {
    const rows: any[][] = [];
    rows.push([{ v: "Summary", s: headerStyle }]);
    rows.push([
      { v: "Total Transactions", s: headerStyle },
      analysis.totalTransactions,
    ]);
    rows.push([
      { v: "Average Transactions per Day", s: headerStyle },
      analysis.averageTransactionsPerDay.toFixed(2),
    ]);
    rows.push([
      { v: "Busiest Hour", s: headerStyle },
      `${analysis.busiestHour.hour}:00 UTC`,
      analysis.busiestHour.count,
    ]);
    rows.push([
      { v: "Busiest Day", s: headerStyle },
      analysis.busiestDay.day,
      analysis.busiestDay.count,
    ]);
    rows.push([
      { v: "Busiest Month", s: headerStyle },
      analysis.busiestMonth.month,
      analysis.busiestMonth.count,
    ]);
    rows.push([
      { v: "Busiest Year", s: headerStyle },
      analysis.busiestYear.year,
      analysis.busiestYear.count,
    ]);
    rows.push([]);

    rows.push([{ v: "Hourly Distribution", s: headerStyle }]);
    rows.push([
      { v: "Hour (UTC)", s: headerStyle },
      { v: "Count", s: headerStyle },
      { v: "Percentage", s: headerStyle },
    ]);
    const hourlyEntries = Object.entries(analysis.hourlyDistribution).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    const maxHourly = Math.max(...hourlyEntries.map(([_, count]) => count));
    hourlyEntries.forEach(([hour, count]) => {
      const percentage = (count / analysis.totalTransactions) * 100;
      const percentStr = percentage.toFixed(2) + "%";
      const fill = { fgColor: getLightRedGradient((10 * percentage) / 100) };

      rows.push([
        { v: `${hour}:00`, s: { ...cellBorder, fill } },
        { v: count, s: { ...cellBorder, fill } },
        { v: percentStr, s: { ...cellBorder, fill } },
      ]);
    });
    rows.push([]);

    rows.push([{ v: "Daily Distribution", s: headerStyle }]);
    rows.push([
      { v: "Day", s: headerStyle },
      { v: "Count", s: headerStyle },
    ]);
    const dailyEntries = Object.entries(analysis.dailyDistribution).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    const maxDaily = Math.max(...dailyEntries.map(([_, count]) => count));
    dailyEntries.forEach(([day, count]) => {
      const percent = count / maxDaily;
      const fill = { fgColor: getLightRedGradient(percent) };
      rows.push([
        { v: day, s: { ...cellBorder, fill } },
        { v: count, s: { ...cellBorder, fill } },
      ]);
    });
    rows.push([]);

    rows.push([{ v: "Monthly Distribution", s: headerStyle }]);
    rows.push([
      { v: "Month", s: headerStyle },
      { v: "Count", s: headerStyle },
    ]);
    const monthlyEntries = Object.entries(analysis.monthlyDistribution).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    const maxMonthly = Math.max(...monthlyEntries.map(([_, count]) => count));
    monthlyEntries.forEach(([month, count]) => {
      const percent = count / maxMonthly;
      const fill = { fgColor: getLightRedGradient(percent) };
      rows.push([
        { v: month, s: { ...cellBorder, fill } },
        { v: count, s: { ...cellBorder, fill } },
      ]);
    });
    rows.push([]);

    rows.push([{ v: "Yearly Distribution", s: headerStyle }]);
    rows.push([
      { v: "Year", s: headerStyle },
      { v: "Count", s: headerStyle },
    ]);
    Object.entries(analysis.yearlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([year, count]) => {
        rows.push([
          { v: year, s: cellBorder },
          { v: count, s: cellBorder },
        ]);
      });
    return rows;
  }

  formatRelatedWallets(wallets: RelatedWalletInfo[]) {
    const rows: any[][] = [];
    rows.push([
      { v: "Address", s: headerStyle },
      { v: "Transaction Count", s: headerStyle },
      { v: "Entity", s: headerStyle },
      { v: "Label", s: headerStyle },
      { v: "Debank", s: headerStyle },
      { v: "Arkham", s: headerStyle },
    ]);
    wallets.forEach((wallet) => {
      rows.push([
        {
          v: shortAddr(wallet.address),
          l: { Target: `https://etherscan.io/address/${wallet.address}` },
        },
        wallet.txCount,
        wallet.entity,
        wallet.label,
        {
          v: "DEB",
          l: { Target: `https://debank.com/profile/${wallet.address}` },
        },
        {
          v: "ARK",
          l: {
            Target: `https://intel.arkm.com/visualizer/entity/${wallet.address}`,
          },
        },
      ]);
    });
    return rows;
  }

  formatContracts(contracts: ContractInfo[]) {
    const rows: any[][] = [];
    rows.push([
      { v: "Address", s: headerStyle },
      { v: "Transaction Count", s: headerStyle },
      { v: "Entity", s: headerStyle },
      { v: "Label", s: headerStyle },
      { v: "Contract Name", s: headerStyle },
      { v: "Is Proxy", s: headerStyle },
      { v: "Proxy Type", s: headerStyle },
      { v: "Implementation Name", s: headerStyle },
    ]);
    contracts.forEach((contract) => {
      rows.push([
        {
          v: shortAddr(contract.address),
          l: { Target: `https://etherscan.io/address/${contract.address}` },
        },
        contract.txCount,
        contract.entity,
        contract.label,
        contract.name,
        contract.isProxy ? "Yes" : "No",
        contract.proxyType || "",
        contract.implementationName || "",
      ]);
    });
    return rows;
  }

  writeTimingAnalysisSheet(analysis: TransactionTimingAnalysis) {
    const rows = this.formatTimingAnalysis(analysis);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = TIMING_ANALYSIS_COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(this.workbook, ws, "Timing Analysis");
  }

  writeRelatedWalletsSheet(wallets: RelatedWalletInfo[]) {
    const rows = this.formatRelatedWallets(wallets);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = RELATED_WALLETS_COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(this.workbook, ws, "Related Wallets");
  }

  writeContractsSheet(contracts: ContractInfo[]) {
    const rows = this.formatContracts(contracts);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = CONTRACTS_COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(this.workbook, ws, "Interacted Contracts");
  }

  writeTransfersSheet(transfers: Transfer[]) {
    const rows: any[][] = [];
    // Header row with style
    rows.push([
      { v: "From", s: headerStyle },
      { v: "To", s: headerStyle },
      { v: "Token Address", s: headerStyle },
      { v: "Symbol", s: headerStyle },
      { v: "Amount (wei)", s: headerStyle },
      { v: "Amount (formatted)", s: headerStyle },
      { v: "Tx Hash", s: headerStyle },
      { v: "Block #", s: headerStyle },
      { v: "Date", s: headerStyle },
    ]);

    for (const t of transfers) {
      const decimals = getTokenDecimalsByAddress(t.tokenAddress, t.networkId);
      const amount =
        decimals && decimals > 0
          ? (BigInt(t.amount) / BigInt(10 ** decimals)).toString()
          : "";

      rows.push([
        {
          v: shortAddr(t.from),
          l: { Target: `https://etherscan.io/address/${t.from}` },
        },
        {
          v: shortAddr(t.to),
          l: { Target: `https://etherscan.io/address/${t.to}` },
        },
        {
          v: shortAddr(t.tokenAddress),
          l: { Target: `https://etherscan.io/address/${t.tokenAddress}` },
        },
        t.symbol,
        t.amount,
        amount.toString(),
        {
          v: shortHash(t.txHash),
          l: { Target: `https://etherscan.io/tx/${t.txHash}` },
        },
        t.blockNumber,
        new Date(t.timestamp * 1000).toLocaleString("en-US", {
          timeZone: "UTC",
          dateStyle: "short",
          timeStyle: "medium",
        }),
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = TRANSFERS_COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(this.workbook, ws, "Transfers");
  }

  writeTransactionsSheet(transactions: any[]) {
    // Sort by timestamp descending
    transactions = transactions.sort((a, b) => b.timestamp - a.timestamp);
    const rows: any[][] = [];
    rows.push([
      { v: "Tx Hash", s: headerStyle },
      { v: "From", s: headerStyle },
      { v: "To", s: headerStyle },
      { v: "Value", s: headerStyle },
      { v: "Block #", s: headerStyle },
      { v: "Timestamp", s: headerStyle },
    ]);
    for (const tx of transactions) {
      rows.push([
        {
          v: tx.hash,
          l: { Target: `https://etherscan.io/tx/${tx.hash}` },
          s: cellBorder,
        },
        {
          v: tx.from,
          l: { Target: `https://etherscan.io/address/${tx.from}` },
          s: cellBorder,
        },
        {
          v: tx.to,
          l: { Target: `https://etherscan.io/address/${tx.to}` },
          s: cellBorder,
        },
        { v: tx.value, s: cellBorder },
        { v: tx.blockNumber, s: cellBorder },
        {
          v: new Date(tx.timestamp * 1000).toLocaleString("en-US", {
            timeZone: "UTC",
            dateStyle: "short",
            timeStyle: "medium",
          }),
          s: cellBorder,
        },
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 66 }, // Tx Hash
      { wch: 44 }, // From
      { wch: 44 }, // To
      { wch: 24 }, // Value
      { wch: 14 }, // Block #
      { wch: 32 }, // Timestamp
    ];
    XLSX.utils.book_append_sheet(this.workbook, ws, "Transactions");
  }

  exportAnalysisXLSX(outputPath?: string) {
    if (!outputPath) {
      const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      outputPath = path.join(
        process.cwd(),
        "output",
        `${this.address}-${date}.xlsx`
      );
    }
    const outputDir = path.dirname(outputPath);
    console.log("Exporting analysis to", outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    XLSX.writeFile(this.workbook, outputPath);
  }
}
