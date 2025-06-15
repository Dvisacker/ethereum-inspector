import { PrismaClient, Wallet } from "@prisma/client";
import { Kysely, SqliteDialect } from "kysely";
import { DB } from "./types";
import BetterSqlite3 from "better-sqlite3";
import { join } from "path";
import { SqliteBooleanPlugin } from "./patch";

export interface CreateWalletInput {
  address: string;
  networkId: number;
  name?: string;
  entity?: string;
  label?: string;
}

export interface UpdateWalletInput {
  name?: string;
  entity?: string;
  label?: string;
}

export class WalletRepository {
  private prisma: PrismaClient;
  private kysely: Kysely<DB>;

  constructor() {
    this.prisma = new PrismaClient();

    const dbPath = join(__dirname, "../../prisma/dev.db");

    this.kysely = new Kysely<DB>({
      dialect: new SqliteDialect({
        database: new BetterSqlite3(dbPath),
      }),
      plugins: [new SqliteBooleanPlugin()],
    });
  }

  async createWallet(data: CreateWalletInput): Promise<Wallet> {
    return this.prisma.wallet.create({
      data,
    });
  }

  async getWallet(address: string, networkId: number): Promise<Wallet | null> {
    return this.prisma.wallet.findUnique({
      where: {
        address_networkId: {
          address,
          networkId,
        },
      },
    });
  }

  async updateWallet(
    address: string,
    networkId: number,
    data: UpdateWalletInput
  ): Promise<Wallet> {
    return this.prisma.wallet.update({
      where: {
        address_networkId: {
          address,
          networkId,
        },
      },
      data,
    });
  }

  async deleteWallet(address: string, networkId: number): Promise<Wallet> {
    return this.prisma.wallet.delete({
      where: {
        address_networkId: {
          address,
          networkId,
        },
      },
    });
  }

  async upsertWallet(data: CreateWalletInput): Promise<Wallet> {
    return this.prisma.wallet.upsert({
      where: {
        address_networkId: {
          address: data.address,
          networkId: data.networkId,
        },
      },
      update: data,
      create: data,
    });
  }

  async getWalletsByEntity(entity: string): Promise<Wallet[]> {
    const result = await this.kysely
      .selectFrom("wallets")
      .selectAll()
      .where("entity", "=", entity)
      .execute();

    return result;
  }

  async getWalletsByNetwork(networkId: number): Promise<Wallet[]> {
    const result = await this.kysely
      .selectFrom("wallets")
      .selectAll()
      .where("networkId", "=", networkId)
      .execute();

    return result;
  }

  async searchWallets(query: string): Promise<Wallet[]> {
    const result = await this.kysely
      .selectFrom("wallets")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb("address", "like", `%${query}%`),
          eb("label", "like", `%${query}%`),
          eb("entity", "like", `%${query}%`),
        ])
      )
      .execute();

    return result;
  }

  async getWalletStats(): Promise<{
    total: number;
    byNetwork: Array<{ networkId: number; count: number }>;
  }> {
    const [total, byNetwork] = await Promise.all([
      this.kysely
        .selectFrom("wallets")
        .select((eb) => eb.fn.count("id").as("count"))
        .executeTakeFirst(),

      this.kysely
        .selectFrom("wallets")
        .select(["networkId", (eb) => eb.fn.count("id").as("count")])
        .groupBy("networkId")
        .execute(),
    ]);

    return {
      total: Number(total?.count || 0),
      byNetwork: byNetwork.map((row) => ({
        networkId: row.networkId,
        count: Number(row.count),
      })),
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    await this.kysely.destroy();
  }
}
