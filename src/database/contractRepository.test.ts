import { ContractRepository } from "./contractRepository";

describe("ContractRepository", () => {
  let repo: ContractRepository;

  beforeEach(async () => {
    repo = new ContractRepository();
    await cleanupDatabase();
  });

  afterEach(async () => {
    await repo.disconnect();
  });

  async function cleanupDatabase() {
    // Delete all contracts to start fresh
    try {
      await repo["prisma"].contract.deleteMany({});
    } catch (error) {
      // Ignore errors if table doesn't exist yet
    }
  }

  describe("Basic CRUD operations", () => {
    it("should create a contract", async () => {
      const contractData = {
        address: "0x1234567890123456789012345678901234567890",
        networkId: 1,
        name: "TestContract",
        isProxy: false,
        entity: "TestProtocol",
      };

      const contract = await repo.createContract(contractData);

      expect(contract).toBeDefined();
      expect(contract.address).toBe(contractData.address);
      expect(contract.networkId).toBe(contractData.networkId);
      expect(contract.name).toBe(contractData.name);
      expect(contract.isProxy).toBe(contractData.isProxy);
      expect(contract.entity).toBe(contractData.entity);
    });

    it("should get a contract by address and networkId", async () => {
      const contractData = {
        address: "0x2234567890123456789012345678901234567890",
        networkId: 1,
        name: "GetTestContract",
      };

      await repo.createContract(contractData);
      const retrievedContract = await repo.getContract(
        contractData.address,
        contractData.networkId
      );

      expect(retrievedContract).toBeDefined();
      expect(retrievedContract?.address).toBe(contractData.address);
      expect(retrievedContract?.name).toBe(contractData.name);
    });

    it("should update a contract", async () => {
      const contractData = {
        address: "0x3234567890123456789012345678901234567890",
        networkId: 1,
        name: "UpdateTestContract",
      };

      await repo.createContract(contractData);
      const updatedContract = await repo.updateContract(
        contractData.address,
        contractData.networkId,
        { name: "UpdatedName", entity: "UpdatedProtocol" }
      );

      expect(updatedContract.name).toBe("UpdatedName");
      expect(updatedContract.entity).toBe("UpdatedProtocol");
    });

    it("should upsert a contract", async () => {
      const contractData = {
        address: "0x4234567890123456789012345678901234567890",
        networkId: 1,
        name: "UpsertTestContract",
      };

      // First upsert (create)
      const contract1 = await repo.upsertContract(contractData);
      expect(contract1.name).toBe(contractData.name);

      // Second upsert (update)
      const contract2 = await repo.upsertContract({
        ...contractData,
        name: "UpsertedName",
      });
      expect(contract2.name).toBe("UpsertedName");
      expect(contract2.id).toBe(contract1.id); // Same record
    });
  });

  describe("Complex queries with Kysely", () => {
    beforeEach(async () => {
      // Setup test data
      await repo.createContract({
        address: "0x1111111111111111111111111111111111111111",
        networkId: 1,
        name: "ProxyContract",
        isProxy: true,
        proxyType: "EIP1967",
        implementationAddress: "0x2222222222222222222222222222222222222222",
        entity: "TestProtocol",
      });

      await repo.createContract({
        address: "0x2222222222222222222222222222222222222222",
        networkId: 1,
        name: "ImplementationContract",
        entity: "TestProtocol",
        abi: JSON.stringify([{ type: "function", name: "test" }]),
      });

      await repo.createContract({
        address: "0x3333333333333333333333333333333333333333",
        networkId: 137, // Polygon
        name: "PolygonContract",
        entity: "AnotherProtocol",
      });
    });

    it("should get contracts by entity", async () => {
      const contracts = await repo.getContractsByEntity("TestProtocol");
      expect(contracts).toHaveLength(2);
      expect(contracts.every((c) => c.entity === "TestProtocol")).toBe(true);
    });

    it("should get proxy contracts", async () => {
      const proxyContracts = await repo.getProxyContracts();
      console.log("proxyContracts", proxyContracts);
      expect(proxyContracts.length).toBeGreaterThan(0);
      expect(proxyContracts.every((c) => c.isProxy === true)).toBe(true);
    });

    it("should get contracts by network", async () => {
      const mainnetContracts = await repo.getContractsByNetwork(1);
      const polygonContracts = await repo.getContractsByNetwork(137);

      expect(mainnetContracts.length).toBeGreaterThan(0);
      expect(polygonContracts).toHaveLength(1);
      expect(polygonContracts[0].networkId).toBe(137);
    });

    it("should get contracts with implementation details", async () => {
      const contractsWithImpl = await repo.getContractsWithImplementation();

      expect(contractsWithImpl.length).toBeGreaterThan(0);
      const proxyContract = contractsWithImpl.find(
        (c) => c.address === "0x1111111111111111111111111111111111111111"
      );

      expect(proxyContract).toBeDefined();
      expect(proxyContract?.implementationName).toBe("ImplementationContract");
    });

    it("should search contracts", async () => {
      const searchResults = await repo.searchContracts("Proxy");
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some((c) => c.name?.includes("Proxy"))).toBe(true);
    });

    it("should get contract statistics", async () => {
      const stats = await repo.getContractStats();

      console.log("stats", stats);

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.proxies).toBeGreaterThan(0);
      expect(stats.verified).toBeGreaterThan(0);
      expect(stats.byNetwork.length).toBeGreaterThan(0);

      const mainnetStats = stats.byNetwork.find((n) => n.networkId === 1);
      const polygonStats = stats.byNetwork.find((n) => n.networkId === 137);

      expect(mainnetStats?.count).toBeGreaterThan(0);
      expect(polygonStats?.count).toBe(1);
    });
  });
});
