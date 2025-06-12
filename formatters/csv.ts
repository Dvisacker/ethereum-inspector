import { TransactionTimingAnalysis } from "../analysis";
import { RelatedWalletInfo } from "../analysis";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

// Define a type for contract info based on analyzeRelatedWallets output
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

export class XLSXExporter {
  private workbook: XLSX.WorkBook;

  constructor() {
    this.workbook = XLSX.utils.book_new();
  }

  formatTimingAnalysis(analysis: TransactionTimingAnalysis) {
    const rows: any[][] = [];
    rows.push(["Summary"]);
    rows.push(["Total Transactions", analysis.totalTransactions]);
    rows.push([
      "Average Transactions per Day",
      analysis.averageTransactionsPerDay.toFixed(2),
    ]);
    rows.push([
      "Busiest Hour",
      `${analysis.busiestHour.hour}:00 UTC`,
      analysis.busiestHour.count,
    ]);
    rows.push([
      "Busiest Day",
      analysis.busiestDay.day,
      analysis.busiestDay.count,
    ]);
    rows.push([
      "Busiest Month",
      analysis.busiestMonth.month,
      analysis.busiestMonth.count,
    ]);
    rows.push([
      "Busiest Year",
      analysis.busiestYear.year,
      analysis.busiestYear.count,
    ]);
    rows.push([]);
    rows.push(["Hourly Distribution"]);
    rows.push(["Hour (UTC)", "Count", "Percentage"]);
    Object.entries(analysis.hourlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([hour, count]) => {
        const percentage = ((count / analysis.totalTransactions) * 100).toFixed(
          2
        );
        rows.push([`${hour}:00`, count, `${percentage}%`]);
      });
    rows.push([]);
    rows.push(["Daily Distribution"]);
    rows.push(["Day", "Count"]);
    Object.entries(analysis.dailyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([day, count]) => {
        rows.push([day, count]);
      });
    rows.push([]);
    rows.push(["Monthly Distribution"]);
    rows.push(["Month", "Count"]);
    Object.entries(analysis.monthlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([month, count]) => {
        rows.push([month, count]);
      });
    rows.push([]);
    rows.push(["Yearly Distribution"]);
    rows.push(["Year", "Count"]);
    Object.entries(analysis.yearlyDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([year, count]) => {
        rows.push([year, count]);
      });
    return rows;
  }

  formatRelatedWallets(wallets: RelatedWalletInfo[]) {
    const rows: any[][] = [];
    rows.push(["Address", "Transaction Count", "Entity", "Label"]);
    wallets.forEach((wallet) => {
      rows.push([wallet.address, wallet.txCount, wallet.entity, wallet.label]);
    });
    return rows;
  }

  formatContracts(contracts: ContractInfo[]) {
    const rows: any[][] = [];
    rows.push([
      "Address",
      "Transaction Count",
      "Entity",
      "Label",
      "Contract Name",
      "Is Proxy",
      "Proxy Type",
      "Implementation Name",
    ]);
    contracts.forEach((contract) => {
      rows.push([
        contract.address,
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
