import { PrismaClient, Contract } from "@prisma/client";
import { Kysely, SqliteDialect } from "kysely";
import { DB } from "./types";
import BetterSqlite3 from "better-sqlite3";
import { join } from "path";
import { transformContracts, SqliteBooleanPlugin } from "./patch";

export interface CreateContractInput {
  address: string;
  networkId: number;
  name?: string;
  isProxy?: boolean;
  proxyType?: string;
  implementationAddress?: string;
  entity?: string;
  bytecode?: string;
  deployedBytecode?: string;
  abi?: string;
}

export interface UpdateContractInput {
  name?: string;
  isProxy?: boolean;
  proxyType?: string;
  implementationAddress?: string;
  entity?: string;
  bytecode?: string;
  deployedBytecode?: string;
  abi?: string;
}

export class ContractRepository {
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

  async createContract(data: CreateContractInput): Promise<Contract> {
    return this.prisma.contract.create({
      data,
    });
  }

  async getContract(
    address: string,
    networkId: number
  ): Promise<Contract | null> {
    return this.prisma.contract.findUnique({
      where: {
        address_networkId: {
          address,
          networkId,
        },
      },
    });
  }

  async updateContract(
    address: string,
    networkId: number,
    data: UpdateContractInput
  ): Promise<Contract> {
    return this.prisma.contract.update({
      where: {
        address_networkId: {
          address,
          networkId,
        },
      },
      data,
    });
  }

  async deleteContract(address: string, networkId: number): Promise<Contract> {
    return this.prisma.contract.delete({
      where: {
        address_networkId: {
          address,
          networkId,
        },
      },
    });
  }

  async upsertContract(data: CreateContractInput): Promise<Contract> {
    return this.prisma.contract.upsert({
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

  async getContractsByEntity(entity: string): Promise<Contract[]> {
    const result = await this.kysely
      .selectFrom("contracts")
      .selectAll()
      .where("entity", "=", entity)
      .execute();

    return transformContracts(result);
  }

  async getProxyContracts(): Promise<Contract[]> {
    const result = await this.kysely
      .selectFrom("contracts")
      .selectAll()
      .where("isProxy", "=", true)
      .execute();

    return transformContracts(result);
  }

  async getContractsByNetwork(networkId: number): Promise<Contract[]> {
    const result = await this.kysely
      .selectFrom("contracts")
      .selectAll()
      .where("networkId", "=", networkId)
      .execute();

    return transformContracts(result);
  }

  async getContractsWithImplementation(): Promise<
    Array<{
      address: string;
      name: string | null;
      proxyType: string | null;
      implementationName: string | null;
      implementationAbi: any;
    }>
  > {
    return this.kysely
      .selectFrom("contracts as c1")
      .leftJoin("contracts as c2", (join) =>
        join
          .onRef("c1.implementationAddress", "=", "c2.address")
          .onRef("c1.networkId", "=", "c2.networkId")
      )
      .select([
        "c1.address",
        "c1.name",
        "c1.proxyType",
        "c2.name as implementationName",
        "c2.abi as implementationAbi",
      ])
      .where("c1.isProxy", "=", true)
      .execute();
  }

  async searchContracts(query: string): Promise<Contract[]> {
    const result = await this.kysely
      .selectFrom("contracts")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb("address", "like", `%${query}%`),
          eb("name", "like", `%${query}%`),
          eb("entity", "like", `%${query}%`),
        ])
      )
      .execute();

    return transformContracts(result);
  }

  async getContractStats(): Promise<{
    total: number;
    proxies: number;
    verified: number;
    byNetwork: Array<{ networkId: number; count: number }>;
  }> {
    const [total, proxies, verified, byNetwork] = await Promise.all([
      this.kysely
        .selectFrom("contracts")
        .select((eb) => eb.fn.count("id").as("count"))
        .executeTakeFirst(),

      this.kysely
        .selectFrom("contracts")
        .select((eb) => eb.fn.count("id").as("count"))
        .where("isProxy", "=", true)
        .executeTakeFirst(),

      this.kysely
        .selectFrom("contracts")
        .select((eb) => eb.fn.count("id").as("count"))
        .where("abi", "is not", null)
        .executeTakeFirst(),

      this.kysely
        .selectFrom("contracts")
        .select(["networkId", (eb) => eb.fn.count("id").as("count")])
        .groupBy("networkId")
        .execute(),
    ]);

    return {
      total: Number(total?.count || 0),
      proxies: Number(proxies?.count || 0),
      verified: Number(verified?.count || 0),
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
