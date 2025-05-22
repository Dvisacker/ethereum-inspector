import { config as dotenvConfig } from "dotenv";
import { join } from "path";
import yaml from "yaml";
import fs from "fs";

type OutputFormat = "json" | "table" | "csv";

export interface Config {
  outputFormat: OutputFormat;
  maxRelatedContracts: number;
  relatedWalletsThreshold: number;
  arkhamCookie: string;
  alchemyApiKey: string;
  etherscanApiKey: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  private configPath: string;

  private constructor() {
    this.configPath = join(process.cwd(), "config.yaml");
    let config = {
      outputFormat: "table" as OutputFormat,
      maxRelatedContracts: 10,
      relatedWalletsThreshold: 3,
    };

    // 2. Load from config file
    if (fs.existsSync(this.configPath)) {
      const fileConfig = yaml.parse(fs.readFileSync(this.configPath, "utf8"));
      config = { ...config, ...fileConfig };
    }

    // 3. Load from environment variables
    dotenvConfig();

    if (!process.env.ARKHAM_COOKIE) {
      throw new Error("ARKHAM_COOKIE is not set");
    }

    if (!process.env.ALCHEMY_API_KEY) {
      throw new Error("ALCHEMY_API_KEY is not set");
    }

    if (!process.env.ETHERSCAN_API_KEY) {
      throw new Error("ETHERSCAN_API_KEY is not set");
    }

    this.config = {
      ...config,
      arkhamCookie: process.env.ARKHAM_COOKIE,
      alchemyApiKey: process.env.ALCHEMY_API_KEY,
      etherscanApiKey: process.env.ETHERSCAN_API_KEY,
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public get(key: keyof Config): any {
    return this.config[key];
  }

  public set<K extends keyof Config>(key: K, value: Config[K]) {
    this.config[key] = value;
  }

  // TODO: update this so it doesn't save sensitive data to file
  // public setAndSave<K extends keyof Config>(key: K, value: Config[K]) {
  //   this.set(key, value);
  //   this.saveConfig();
  // }

  // private saveConfig() {
  //   // Create config directory if it doesn't exist
  //   console.log(`Saving config to ${this.configPath}`);
  //   const configDir = join(process.cwd());
  //   if (!fs.existsSync(configDir)) {
  //     fs.mkdirSync(configDir, { recursive: true });
  //   }

  //   // Save to config file
  //   console.log(`Saving config to ${this.configPath}`);
  //   fs.writeFileSync(this.configPath, yaml.stringify(this.config));
  // }
}

export const config = ConfigManager.getInstance();
