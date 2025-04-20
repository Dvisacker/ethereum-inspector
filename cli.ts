#!/usr/bin/env node
import { Command } from "commander";
import { fetchLabels, formatOutput, OutputType } from "./index";
import { ArkhamClient } from "./arkham";

const program = new Command();

program
  .name("arkham")
  .description("CLI to fetch and format arkham labels for entities")
  .version("1.0.0");

program
  .command("addresses")
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

program
  .command("info")
  .description("Fetch entity information")
  .argument("<entity>", "The entity ID to fetch information for")
  .option("-o, --output <type>", "Output format (json, pretty)", "pretty")
  .action(async (entity: string, options: { output: "json" | "pretty" }) => {
    try {
      const cookie = process.env.ARKHAM_COOKIE;
      if (!cookie) {
        throw new Error("ARKHAM_COOKIE environment variable is required");
      }

      const client = new ArkhamClient(cookie);
      const entityInfo = await client.fetchEntity(entity);

      if (options.output === "json") {
        console.log(JSON.stringify(entityInfo));
      } else {
        console.log("Name:", entityInfo.name);
        console.log("ID:", entityInfo.id);
        console.log("Type:", entityInfo.type);
        if (entityInfo.twitter) console.log("Twitter:", entityInfo.twitter);
        console.log("\nTags:");
        entityInfo.populatedTags.forEach((tag) => {
          console.log(
            `- ${tag.label}${tag.tagParams ? ` (${tag.tagParams})` : ""}`
          );
        });
      }
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();
