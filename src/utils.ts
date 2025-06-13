import fs from "fs";
import path from "path";
import open from "open";
import { logger } from "./logger";
import { LabelResult } from "./types";

interface CSVOptions {
  filename?: string;
  directory?: string;
  openFile?: boolean;
}

/**
 * Writes CSV data to a file and optionally opens it
 * @param data Array of objects to write as CSV
 * @param options Configuration options
 * @returns The path to the created file
 */
export async function writeCSVAndOpen<T extends Record<string, any>>(
  data: T[],
  options: CSVOptions = {}
): Promise<string> {
  try {
    // Set default options
    const {
      filename = `export_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`,
      directory = "exports",
      openFile = true,
    } = options;

    // Create directory if it doesn't exist
    const dirPath = path.resolve(process.cwd(), directory);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Get headers from the first object
    if (data.length === 0) {
      throw new Error("No data provided for CSV export");
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // Header row
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle special cases
            if (value === null || value === undefined) return "";
            if (typeof value === "string") {
              // Escape quotes and wrap in quotes if contains comma or quote
              return value.includes(",") || value.includes('"')
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            }
            return String(value);
          })
          .join(",")
      ),
    ];

    // Write to file
    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, csvRows.join("\n"));

    logger.info("CSV file created", { filePath, rows: data.length });

    // Open file if requested
    if (openFile) {
      await open(filePath);
      logger.info("CSV file opened", { filePath });
    }

    return filePath;
  } catch (error) {
    logger.error("Failed to write CSV file", { error });
    throw error;
  }
}

export type OutputType = "csv" | "json" | "line" | "table";

export const printOutput = (outputType: OutputType, labels: LabelResult[]) => {
  switch (outputType) {
    case "csv":
      const output = labels
        .map(
          (label) =>
            `${label.address},${label.entity.name},${label.label?.name ?? ""}`
        )
        .join("\n");
      console.log(output);
    case "json":
      console.log(JSON.stringify(labels, null, 2));
    case "line": {
      let lines: string[] = [];
      const nameIterator: Record<string, number> = {};
      for (const label of labels) {
        if (!nameIterator[label.entity.name]) {
          nameIterator[label.entity.name] = 0;
        }
        nameIterator[label.entity.name]++;
        const name = `${label.entity.name}${
          nameIterator[label.entity.name] > 1
            ? ` (${label.label?.name ?? ""}${nameIterator[label.entity.name]})`
            : ""
        }`;
        lines.push(`${label.address} ${name}`);
      }
      const output = lines.join("\n");
      console.log(output);
    }
    case "table":
      console.table(labels);
    default:
      console.log(JSON.stringify(labels));
  }
};

interface SimilarityResult {
  address: string;
  similarityScore: number;
  matchingPrefix: string;
  isPotentialScam: boolean;
}

// Normalize addresses (remove '0x' prefix and convert to lowercase)
const normalizeAddress = (addr: string) => addr.toLowerCase().replace("0x", "");

// Calculate similarity score between two addresses
const calculateSimilarity = (addr1: string, addr2: string): number => {
  let matches = 0;
  const minLength = Math.min(addr1.length, addr2.length);

  for (let i = 0; i < minLength; i++) {
    if (addr1[i] === addr2[i]) matches++;
  }

  return matches / minLength;
};

const findMatchingPrefix = (addr1: string, addr2: string): string => {
  let prefix = "";
  const minLength = Math.min(addr1.length, addr2.length);

  for (let i = 0; i < minLength; i++) {
    if (addr1[i] === addr2[i]) {
      prefix += addr1[i];
    } else {
      break;
    }
  }

  return prefix;
};

/**
 * Detects potential scam addresses by analyzing similarity to a target address
 * @param targetAddress The legitimate address to compare against
 * @param addresses Array of addresses to check
 * @param options Configuration options
 * @returns Array of addresses with similarity analysis
 */
export function detectScamAddresses(
  targetAddress: string,
  addresses: string[],
  options: {
    minPrefixLength?: number; // Minimum length of matching prefix to consider
    similarityThreshold?: number; // Threshold for considering an address as potential scam
    maxResults?: number; // Maximum number of results to return
  } = {}
): SimilarityResult[] {
  const {
    minPrefixLength = 4, // Default: check first 4 characters
    similarityThreshold = 0.7, // Default: 70% similarity threshold
    maxResults = 10, // Default: return top 10 most similar addresses
  } = options;

  const targetNormalized = normalizeAddress(targetAddress);

  // Find the longest matching prefix

  // Analyze each address
  const results: SimilarityResult[] = addresses
    .map((address) => {
      const normalized = normalizeAddress(address);
      const similarityScore = calculateSimilarity(targetNormalized, normalized);
      const matchingPrefix = findMatchingPrefix(targetNormalized, normalized);

      return {
        address,
        similarityScore,
        matchingPrefix,
        isPotentialScam:
          similarityScore >= similarityThreshold &&
          matchingPrefix.length >= minPrefixLength,
      };
    })
    .filter((result) => result.isPotentialScam)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, maxResults);

  return results;
}

/**
 * Formats a similarity result for display
 * @param result Similarity analysis result
 * @returns Formatted string
 */
export function formatSimilarityResult(result: SimilarityResult): string {
  return `
Address: ${result.address}
Similarity Score: ${(result.similarityScore * 100).toFixed(1)}%
Matching Prefix: ${result.matchingPrefix}
Potential Scam: ${result.isPotentialScam ? "⚠️ YES" : "✅ NO"}
-------------------`;
}

// Example usage:
/*
const targetAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const addressesToCheck = [
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Original
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44f', // Similar
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44d', // Similar
  '0x1234567890123456789012345678901234567890', // Different
];

const results = detectScamAddresses(targetAddress, addressesToCheck, {
  minPrefixLength: 4,
  similarityThreshold: 0.7,
  maxResults: 5
});

console.log('Potential Scam Addresses:');
results.forEach(result => {
  console.log(formatSimilarityResult(result));
});
*/
