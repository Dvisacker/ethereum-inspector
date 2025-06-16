import { TransactionTimingAnalysis } from "../analysis";
import { RelatedWalletInfo } from "../analysis";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx-js-style";
import { getTokenDecimalsByAddress, NetworkId } from "../constants";
import { Transfer } from "../types";
import {
  getLightRedGradient,
  shortAddr,
  shortHash,
  getEtherscanTxLink,
  getEtherscanAddressLink,
  getDebankLink,
  getArkhamLink,
} from "../helpers";
import { BridgeTransaction } from "../bridges/types";

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

const TIMING_ANALYSIS_COL_WIDTHS = [30, 24, 20];
const RELATED_WALLETS_COL_WIDTHS = [24, 12, 32, 32, 12, 12];
const CONTRACTS_COL_WIDTHS = [24, 12, 22, 44, 44, 12, 18, 32];
const TRANSFERS_COL_WIDTHS = [24, 24, 24, 14, 30, 14, 44, 14, 24];
const BRIDGE_TRANSACTIONS_COL_WIDTHS = [
  24, 24, 20, 14, 14, 24, 24, 24, 24, 14, 14, 14, 14, 32,
];
const TRANSACTIONS_COL_WIDTHS = [24, 24, 24, 14, 14, 32];

// Address color constants for the 20 most frequent addresses
const ADDRESS_COLORS = [
  { rgb: "E3F2FD" }, // Light Blue
  { rgb: "E8F5E8" }, // Light Green
  { rgb: "FFF3E0" }, // Light Orange
  { rgb: "F3E5F5" }, // Light Purple
  { rgb: "FCE4EC" }, // Light Pink
  { rgb: "E0F2F1" }, // Light Teal
  { rgb: "FFF8E1" }, // Light Yellow
  { rgb: "EFEBE9" }, // Light Brown
  { rgb: "FAFAFA" }, // Light Gray
  { rgb: "E1F5FE" }, // Light Cyan
  { rgb: "F1F8E9" }, // Light Lime
  { rgb: "FFF2CC" }, // Light Amber
  { rgb: "EDE7F6" }, // Light Deep Purple
  { rgb: "E8EAF6" }, // Light Indigo
  { rgb: "E0F7FA" }, // Light Cyan
  { rgb: "F3E5F5" }, // Light Pink
  { rgb: "FFF8E1" }, // Light Yellow Green
  { rgb: "FCE4EC" }, // Light Rose
  { rgb: "E1F5FE" }, // Light Sky Blue
  { rgb: "F9FBE7" }, // Light Lime Green
];

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
  private addressColorMap: Map<string, string> = new Map();

  constructor(address: string) {
    this.workbook = XLSX.utils.book_new();
    this.address = address;
  }

  // Analyze address frequency across all data sources and create color mapping
  private analyzeAddressFrequency(
    wallets: RelatedWalletInfo[],
    contracts: ContractInfo[],
    transfers: Transfer[],
    transactions: any[]
  ) {
    const addressCounts = new Map<string, number>();

    // Count wallet addresses
    wallets.forEach((wallet) => {
      const count = addressCounts.get(wallet.address) || 0;
      addressCounts.set(wallet.address, count + wallet.txCount);
    });

    // Count contract addresses
    contracts.forEach((contract) => {
      const count = addressCounts.get(contract.address) || 0;
      addressCounts.set(contract.address, count + contract.txCount);
    });

    // Count addresses in transfers
    transfers.forEach((transfer) => {
      // Count 'from' addresses
      const fromCount = addressCounts.get(transfer.from) || 0;
      addressCounts.set(transfer.from, fromCount + 1);

      // Count 'to' addresses
      const toCount = addressCounts.get(transfer.to) || 0;
      addressCounts.set(transfer.to, toCount + 1);

      // Count token addresses
      const tokenCount = addressCounts.get(transfer.tokenAddress) || 0;
      addressCounts.set(transfer.tokenAddress, tokenCount + 1);
    });

    // Count addresses in transactions
    transactions.forEach((tx) => {
      if (tx.from) {
        const fromCount = addressCounts.get(tx.from) || 0;
        addressCounts.set(tx.from, fromCount + 1);
      }
      if (tx.to) {
        const toCount = addressCounts.get(tx.to) || 0;
        addressCounts.set(tx.to, toCount + 1);
      }
    });

    // Get top 20 most frequent addresses
    const sortedAddresses = Array.from(addressCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    // Create color mapping
    this.addressColorMap.clear();
    sortedAddresses.forEach(([address], index) => {
      if (index < ADDRESS_COLORS.length) {
        this.addressColorMap.set(address, ADDRESS_COLORS[index].rgb);
      }
    });

    console.log("Top 20 most frequent addresses:");
    sortedAddresses.forEach(([address, count], index) => {
      const color = ADDRESS_COLORS[index]?.rgb || "default";
      console.log(
        `${index + 1}. ${shortAddr(
          address
        )}: ${count} occurrences (color: #${color})`
      );
    });
  }

  // Helper method to get address color
  private getAddressColor(address: string): any {
    const colorRgb = this.addressColorMap.get(address);
    return colorRgb ? { fgColor: { rgb: colorRgb } } : undefined;
  }

  // Set up address color mapping - call this before writing sheets
  setupAddressColorMapping(
    wallets: RelatedWalletInfo[] = [],
    contracts: ContractInfo[] = [],
    transfers: Transfer[] = [],
    transactions: any[] = []
  ) {
    this.analyzeAddressFrequency(wallets, contracts, transfers, transactions);
  }

  formatTimingAnalysis(analysis: TransactionTimingAnalysis) {
    const rows: any[][] = [];
    rows.push([{ v: "Summary", s: headerStyle }]);
    rows.push([
      { v: "Total Transactions", s: headerStyle },
      {
        v: analysis.totalTransactions,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);
    rows.push([
      { v: "Average Transactions per Day", s: headerStyle },
      {
        v: analysis.averageTransactionsPerDay.toFixed(2),
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);
    rows.push([
      { v: "Busiest Hour", s: headerStyle },
      {
        v: `${analysis.busiestHour.hour}:00 UTC`,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
      {
        v: analysis.busiestHour.count,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);
    rows.push([
      { v: "Busiest Day", s: headerStyle },
      {
        v: analysis.busiestDay.day,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
      {
        v: analysis.busiestDay.count,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);
    rows.push([
      { v: "Busiest Month", s: headerStyle },
      {
        v: analysis.busiestMonth.month,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
      {
        v: analysis.busiestMonth.count,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);
    rows.push([
      { v: "Busiest Year", s: headerStyle },
      {
        v: analysis.busiestYear.year,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
      {
        v: analysis.busiestYear.count,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);

    // Add work window (most active 6 hour period)
    rows.push([
      { v: "Work Window", s: headerStyle },
      {
        v: `${analysis.busiest6Hour.startHour}:00 - ${
          (analysis.busiest6Hour.startHour + 6) % 24
        }:00 UTC`,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
      {
        v: analysis.busiest6Hour.count,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);

    // Add sleep window (least active 6 hour period)
    rows.push([
      { v: "Sleep Window", s: headerStyle },
      {
        v: `${analysis.leastBusy6Hour.startHour}:00 - ${
          (analysis.leastBusy6Hour.startHour + 6) % 24
        }:00 UTC`,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
      {
        v: analysis.leastBusy6Hour.count,
        s: { ...cellBorder, alignment: { horizontal: "right" } },
      },
    ]);

    // Add inferred region based on work window
    if (analysis.inferredTimezone) {
      rows.push([
        { v: "Inferred Region", s: headerStyle },
        {
          v: `${analysis.inferredTimezone.region} (${(
            analysis.inferredTimezone.confidence * 100
          ).toFixed(1)}% confidence)`,
          s: { ...cellBorder, alignment: { horizontal: "right" } },
        },
      ]);
    }

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
      const addressFill = this.getAddressColor(wallet.address);
      const addressStyle = addressFill
        ? { ...cellBorder, fill: addressFill }
        : cellBorder;

      rows.push([
        {
          v: shortAddr(wallet.address),
          l: { Target: getEtherscanAddressLink(wallet.address) },
          s: addressStyle,
        },
        {
          v: wallet.txCount,
          s: cellBorder,
        },
        {
          v: wallet.entity,
          s: cellBorder,
        },
        {
          v: wallet.label,
          s: cellBorder,
        },
        {
          v: "DEB",
          l: { Target: getDebankLink(wallet.address) },
          s: cellBorder,
        },
        {
          v: "ARK",
          l: { Target: getArkhamLink(wallet.address) },
          s: cellBorder,
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
      const addressFill = this.getAddressColor(contract.address);
      const addressStyle = addressFill
        ? { ...cellBorder, fill: addressFill }
        : cellBorder;

      rows.push([
        {
          v: shortAddr(contract.address),
          l: { Target: getEtherscanAddressLink(contract.address) },
          s: addressStyle,
        },
        {
          v: contract.txCount,
          s: cellBorder,
        },
        {
          v: contract.entity,
          s: cellBorder,
        },
        {
          v: contract.label,
          s: cellBorder,
        },
        {
          v: contract.name,
          s: cellBorder,
        },
        {
          v: contract.isProxy ? "Yes" : "No",
          s: cellBorder,
        },
        {
          v: contract.proxyType,
          s: cellBorder,
        },
        {
          v: contract.implementationName,
          s: cellBorder,
        },
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

      const fromFill = this.getAddressColor(t.from);
      const toFill = this.getAddressColor(t.to);
      const tokenFill = this.getAddressColor(t.tokenAddress);

      rows.push([
        {
          v: shortAddr(t.from),
          l: { Target: getEtherscanAddressLink(t.from) },
          s: fromFill ? { fill: fromFill } : undefined,
        },
        {
          v: shortAddr(t.to),
          l: { Target: getEtherscanAddressLink(t.to) },
          s: toFill ? { fill: toFill } : undefined,
        },
        {
          v: shortAddr(t.tokenAddress),
          l: { Target: getEtherscanAddressLink(t.tokenAddress) },
          s: tokenFill ? { fill: tokenFill } : undefined,
        },
        t.symbol,
        t.amount,
        amount.toString(),
        {
          v: shortHash(t.txHash),
          l: { Target: getEtherscanTxLink(t.txHash) },
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
      const fromFill = this.getAddressColor(tx.from);
      const toFill = this.getAddressColor(tx.to);

      rows.push([
        {
          v: shortHash(tx.hash),
          l: { Target: getEtherscanTxLink(tx.hash) },
          s: cellBorder,
        },
        {
          v: shortAddr(tx.from),
          l: { Target: getEtherscanAddressLink(tx.from) },
          s: fromFill ? { ...cellBorder, fill: fromFill } : cellBorder,
        },
        {
          v: shortAddr(tx.to),
          l: { Target: getEtherscanAddressLink(tx.to) },
          s: toFill ? { ...cellBorder, fill: toFill } : cellBorder,
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
    ws["!cols"] = TRANSACTIONS_COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(this.workbook, ws, "Transactions");
  }

  writeBridgeTransactionsSheet(transactions: BridgeTransaction[]) {
    const rows: any[][] = [];
    rows.push([
      { v: "Source Tx Hash", s: headerStyle },
      { v: "Destination Tx Hash", s: headerStyle },
      { v: "Bridge", s: headerStyle },
      { v: "From Chain", s: headerStyle },
      { v: "To Chain", s: headerStyle },
      { v: "From Token", s: headerStyle },
      { v: "To Token", s: headerStyle },
      { v: "From Amount", s: headerStyle },
      { v: "To Amount", s: headerStyle },
      { v: "From Symbol", s: headerStyle },
      { v: "To Symbol", s: headerStyle },
      { v: "Sender", s: headerStyle },
      { v: "Recipient", s: headerStyle },
      { v: "Timestamp", s: headerStyle },
      { v: "Status", s: headerStyle },
      { v: "Block #", s: headerStyle },
      { v: "Dest Block #", s: headerStyle },
    ]);

    for (const tx of transactions) {
      const senderFill = this.getAddressColor(tx.sender);
      const recipientFill = this.getAddressColor(tx.recipient);
      const fromTokenFill = this.getAddressColor(tx.fromToken);
      const toTokenFill = this.getAddressColor(tx.toToken);

      rows.push([
        {
          v: shortHash(tx.txHash),
          l: { Target: getEtherscanTxLink(tx.txHash) },
          s: cellBorder,
        },
        {
          v: tx.destTxHash ? shortHash(tx.destTxHash) : "",
          l: tx.destTxHash
            ? { Target: getEtherscanTxLink(tx.destTxHash) }
            : undefined,
          s: cellBorder,
        },
        { v: tx.bridge, s: cellBorder },
        { v: tx.fromChain, s: cellBorder },
        { v: tx.toChain, s: cellBorder },
        {
          v: shortAddr(tx.fromToken),
          l: { Target: getEtherscanAddressLink(tx.fromToken) },
          s: fromTokenFill
            ? { ...cellBorder, fill: fromTokenFill }
            : cellBorder,
        },
        {
          v: shortAddr(tx.toToken),
          l: { Target: getEtherscanAddressLink(tx.toToken) },
          s: toTokenFill ? { ...cellBorder, fill: toTokenFill } : cellBorder,
        },
        { v: tx.fromAmount, s: cellBorder },
        { v: tx.toAmount, s: cellBorder },
        { v: tx.fromSymbol, s: cellBorder },
        { v: tx.toSymbol, s: cellBorder },
        {
          v: shortAddr(tx.sender),
          l: { Target: getEtherscanAddressLink(tx.sender) },
          s: senderFill ? { ...cellBorder, fill: senderFill } : cellBorder,
        },
        {
          v: shortAddr(tx.recipient),
          l: { Target: getEtherscanAddressLink(tx.recipient) },
          s: recipientFill
            ? { ...cellBorder, fill: recipientFill }
            : cellBorder,
        },
        {
          v: new Date(tx.timestamp * 1000).toLocaleString("en-US", {
            timeZone: "UTC",
            dateStyle: "short",
            timeStyle: "medium",
          }),
          s: cellBorder,
        },
        { v: tx.status, s: cellBorder },
        { v: tx.blockNumber, s: cellBorder },
        { v: tx.destBlockNumber || "", s: cellBorder },
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = BRIDGE_TRANSACTIONS_COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(this.workbook, ws, "Bridge Transactions");
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
