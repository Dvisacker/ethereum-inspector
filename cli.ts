#!/usr/bin/env node

import { Command } from "commander";
import { fetchLabels, formatOutput, OutputType } from "./index";

const program = new Command();

program
  .name("arkham-labels")
  .description("CLI to fetch and format Arkham labels for entities")
  .version("1.0.0");

program
  .command("fetch")
  .description("Fetch labels for an entity")
  .argument("<entity>", "The entity ID to fetch labels for")
  .option("-o, --output <type>", "Output format (csv, json, line)", "line")
  .action(async (entity: string, options: { output: OutputType }) => {
    try {
      const labels = await fetchLabels(entity);
      console.log(formatOutput(options.output, labels));
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();
