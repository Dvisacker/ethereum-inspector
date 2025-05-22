import { ArkhamClient } from "./arkham";
import dotenv from "dotenv";
import { performance } from "perf_hooks";

dotenv.config();

const ARKHAM_COOKIE = process.env.ARKHAM_COOKIE;

if (!ARKHAM_COOKIE) {
  throw new Error("ARKHAM_COOKIE is not set");
}

const arkham = new ArkhamClient(ARKHAM_COOKIE);

describe("ArkhamClient", () => {
  describe("searchEntities", () => {
    it('should return search results for "dcfgod"', async () => {
      const results = await arkham.searchEntities("dcfgod");

      console.log("Search Results:", JSON.stringify(results, null, 2));

      expect(results).toBeDefined();
      expect(Array.isArray(results.arkhamEntities)).toBe(true);
      expect(Array.isArray(results.arkhamAddresses)).toBe(true);
      expect(Array.isArray(results.ens)).toBe(true);

      const dcfgod = results.arkhamEntities.find((e) => e.id === "dcfgod");
      expect(dcfgod).toBeDefined();
      expect(dcfgod?.name).toBe("DCF GOD");
      expect(dcfgod?.type).toBe("individual");
    }, 2000);
  });

  // Test fetchEntity endpoint
  describe("fetchEntity", () => {
    it('should return entity information for "dcfgod"', async () => {
      const entity = await arkham.fetchEntity("dcfgod");

      console.log("Entity Info:", JSON.stringify(entity, null, 2));

      expect(entity).toBeDefined();
      expect(entity.name).toBe("DCF GOD");
      expect(entity.id).toBe("dcfgod");
      expect(entity.type).toBe("individual");
      expect(Array.isArray(entity.populatedTags)).toBe(true);
      expect(entity.addresses).toBeDefined();
    }, 2000);
  });

  describe("fetchAddress", () => {
    it("should return address information for a known address", async () => {
      const address = "0xFa4FC4ec2F81A4897743C5b4f45907c02ce06199";
      const addressInfo = await arkham.fetchAddress(address);

      console.log("Address Info:", JSON.stringify(addressInfo, null, 2));

      expect(addressInfo).toBeDefined();
      expect(addressInfo.address).toBe(address);
      expect(addressInfo.chain).toBe("ethereum");
      expect(typeof addressInfo.isUserAddress).toBe("boolean");
      expect(typeof addressInfo.contract).toBe("boolean");
      expect(addressInfo.arkhamEntity).toBeDefined();
    }, 30000);
  });

  describe("fetchTransfers", () => {
    it('should return transfers for "dcfgod"', async () => {
      const transfers = await arkham.fetchTransfers("dcfgod", 0, 5);

      console.log("Transfers:", JSON.stringify(transfers, null, 2));

      expect(transfers).toBeDefined();
      expect(Array.isArray(transfers.transfers)).toBe(true);
      expect(transfers.transfers.length).toBeLessThanOrEqual(5);

      if (transfers.transfers.length > 0) {
        const transfer = transfers.transfers[0];
        expect(transfer.fromAddress).toBeDefined();
        expect(transfer.toAddress).toBeDefined();
        expect(transfer.fromAddress.address).toBeDefined();
        expect(transfer.toAddress.address).toBeDefined();
      }
    }, 30000);
  });

  describe("error handling", () => {
    it("should handle invalid entity ID", async () => {
      await expect(arkham.fetchEntity("invalid-entity-id")).rejects.toThrow();
    }, 30000);

    it("should handle invalid address", async () => {
      await expect(arkham.fetchAddress("0xinvalid")).rejects.toThrow();
    }, 30000);
  });

  describe("throttling", () => {
    it("should respect rate limiting and concurrency limits", async () => {
      const client = new ArkhamClient(ARKHAM_COOKIE, {
        minTimeBetweenRequests: 1000, // 1 request per second
        maxConcurrentRequests: 2,
      });

      // Test addresses
      const addresses = [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
      ];

      const startTime = performance.now();

      // Make parallel requests for address info
      const results = await Promise.all(
        addresses.map((address) => client.fetchAddress(address))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify results
      expect(results).toHaveLength(addresses.length);
      expect(results.every((response) => response.address)).toBe(true);

      // Verify timing
      // With 4 addresses and 2 concurrent requests, we expect 2 batches
      // Each batch should take at least 1000ms (minTimeBetweenRequests)
      // So total time should be at least 2000ms
      expect(totalTime).toBeGreaterThanOrEqual(2000);

      console.log("Arkham throttling test results:", {
        totalTime: `${totalTime.toFixed(2)}ms`,
        results: results.map((r) => ({
          address: r.address,
          entity: r.arkhamEntity?.name,
          label: r.arkhamLabel?.name,
        })),
      });
    }, 30000); // 30 second timeout

    it("should handle mixed API calls with throttling", async () => {
      const client = new ArkhamClient(ARKHAM_COOKIE, {
        minTimeBetweenRequests: 1000,
        maxConcurrentRequests: 2,
      });

      const entityId = "dcfgod";
      const address = "0xFa4FC4ec2F81A4897743C5b4f45907c02ce06199";

      const startTime = performance.now();

      // Make parallel requests for different entity info
      const [entityInfo, addressInfo, transfers] = await Promise.all([
        client.fetchEntity(entityId),
        client.fetchAddress(address),
        client.fetchTransfers(entityId, 0, 5),
      ]);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify results
      expect(entityInfo.id).toBe(entityId);
      expect(addressInfo.address).toBe(address);
      expect(Array.isArray(transfers.transfers)).toBe(true);

      console.log("Arkham mixed API test results:", {
        totalTime: `${totalTime.toFixed(2)}ms`,
        entityName: entityInfo.name,
        addressLabel: addressInfo.arkhamLabel?.name,
        transferCount: transfers.transfers.length,
      });
    }, 30000); // 30 second timeout
  });
});
