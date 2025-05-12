import fs from "fs";
import path from "path";
import open from "open";
import { logger } from "./logger";

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

// Example usage:
/*
const data = [
  { address: '0x123...', balance: '1.5 ETH', type: 'Contract' },
  { address: '0x456...', balance: '0.8 ETH', type: 'EOA' }
];

await writeCSVAndOpen(data, {
  filename: 'addresses.csv',
  directory: 'exports',
  openFile: true
});
*/
