import { ArkhamClient } from "./arkham";
import dotenv from "dotenv";

dotenv.config();

const arkham = new ArkhamClient(process.env.ARKHAM_COOKIE || "");

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
    }, 30000);
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
    }, 30000);
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
});
