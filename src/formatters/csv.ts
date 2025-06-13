import { TransactionTimingAnalysis } from "../analysis";
import { RelatedWalletInfo } from "../analysis";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx-js-style";
import { getTokenDecimalsByAddress, NetworkId } from "../constants";
import { Transfer } from "../types";

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
const RELATED_WALLETS_COL_WIDTHS = [44, 18, 22, 32];
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

// Helper to shorten addresses and hashes
function shortAddr(addr: string) {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}
function shortHash(hash: string) {
  if (!hash) return "";
  return hash.length > 14 ? `${hash.slice(0, 10)}...${hash.slice(-4)}` : hash;
}

export class XLSXExporter {
  private workbook: XLSX.WorkBook;

  constructor() {
    this.workbook = XLSX.utils.book_new();
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
    Object.entries(analysis.hourlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([hour, count]) => {
        const percentage = ((count / analysis.totalTransactions) * 100).toFixed(
          2
        );
        rows.push([
          { v: `${hour}:00`, s: cellBorder },
          { v: count, s: cellBorder },
          { v: `${percentage}%`, s: cellBorder },
        ]);
      });
    rows.push([]);

    rows.push([{ v: "Daily Distribution", s: headerStyle }]);
    rows.push([
      { v: "Day", s: headerStyle },
      { v: "Count", s: headerStyle },
    ]);
    Object.entries(analysis.dailyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([day, count]) => {
        rows.push([
          { v: day, s: cellBorder },
          { v: count, s: cellBorder },
        ]);
      });
    rows.push([]);

    rows.push([{ v: "Monthly Distribution", s: headerStyle }]);
    rows.push([
      { v: "Month", s: headerStyle },
      { v: "Count", s: headerStyle },
    ]);
    Object.entries(analysis.monthlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([month, count]) => {
        rows.push([
          { v: month, s: cellBorder },
          { v: count, s: cellBorder },
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

  exportAnalysisXLSX(outputPath?: string) {
    if (!outputPath) {
      outputPath = path.join(process.cwd(), "output", "analysis.xlsx");
    }
    const outputDir = path.dirname(outputPath);
    console.log("Exporting analysis to", outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    XLSX.writeFile(this.workbook, outputPath);
  }
}
