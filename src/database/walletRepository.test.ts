import { PrismaClient } from "@prisma/client";
import { WalletRepository } from "./walletRepository";

describe("WalletRepository", () => {
  let repository: WalletRepository;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    repository = new WalletRepository();
    await cleanupDatabase();
  });

  afterEach(async () => {
    await repository.disconnect();
  });

  async function cleanupDatabase() {
    // Delete all contracts to start fresh
    try {
      await repository["prisma"].wallet.deleteMany({});
    } catch (error) {
      // Ignore errors if table doesn't exist yet
    }
  }

  describe("createWallet", () => {
    it("should create a new wallet", async () => {
      const walletData = {
        address: "0x1234567890123456789012345678901234567890",
        networkId: 1,
        label: "Test Wallet",
        entity: "Test Entity",
      };

      const wallet = await repository.createWallet(walletData);

      expect(wallet).toBeDefined();
      expect(wallet.address).toBe(walletData.address);
      expect(wallet.networkId).toBe(walletData.networkId);
      expect(wallet.label).toBe(walletData.label);
      expect(wallet.entity).toBe(walletData.entity);
    });
  });

  describe("getWallet", () => {
    it("should return null for non-existent wallet", async () => {
      const wallet = await repository.getWallet(
        "0x1234567890123456789012345678901234567890",
        1
      );
      expect(wallet).toBeNull();
    });

    it("should return wallet if it exists", async () => {
      const walletData = {
        address: "0x1234567890123456789012345678901234567890",
        networkId: 1,
        label: "Test Wallet",
      };

      await repository.createWallet(walletData);
      const wallet = await repository.getWallet(
        walletData.address,
        walletData.networkId
      );

      expect(wallet).toBeDefined();
      expect(wallet?.address).toBe(walletData.address);
      expect(wallet?.networkId).toBe(walletData.networkId);
      expect(wallet?.label).toBe(walletData.label);
    });
  });

  describe("updateWallet", () => {
    it("should update wallet fields", async () => {
      const walletData = {
        address: "0x1234567890123456789012345678901234567890",
        networkId: 1,
        label: "Test Wallet",
      };

      await repository.createWallet(walletData);

      const updateData = {
        label: "Updated Wallet",
        entity: "Updated Entity",
      };

      const updatedWallet = await repository.updateWallet(
        walletData.address,
        walletData.networkId,
        updateData
      );

      expect(updatedWallet.label).toBe(updateData.label);
      expect(updatedWallet.entity).toBe(updateData.entity);
    });
  });

  describe("deleteWallet", () => {
    it("should delete wallet", async () => {
      const walletData = {
        address: "0x1234567890123456789012345678901234567890",
        networkId: 1,
        label: "Test Wallet",
      };

      await repository.createWallet(walletData);
      const deletedWallet = await repository.deleteWallet(
        walletData.address,
        walletData.networkId
      );

      expect(deletedWallet.address).toBe(walletData.address);
      expect(deletedWallet.networkId).toBe(walletData.networkId);

      const wallet = await repository.getWallet(
        walletData.address,
        walletData.networkId
      );
      expect(wallet).toBeNull();
    });
  });

  describe("upsertWallet", () => {
    it("should create new wallet if it doesn't exist", async () => {
      const walletData = {
        address: "0x1234567890123456789012345678901234567890",
        networkId: 1,
        label: "Test Wallet",
      };

      const wallet = await repository.upsertWallet(walletData);

      expect(wallet).toBeDefined();
      expect(wallet.address).toBe(walletData.address);
      expect(wallet.networkId).toBe(walletData.networkId);
      expect(wallet.label).toBe(walletData.label);
    });

    it("should update existing wallet", async () => {
      const walletData = {
        address: "0x1234567890123456789012345678901234567890",
        networkId: 1,
        label: "Test Wallet",
      };

      await repository.createWallet(walletData);

      const updateData = {
        ...walletData,
        label: "Updated Wallet",
      };

      const updatedWallet = await repository.upsertWallet(updateData);

      expect(updatedWallet.label).toBe(updateData.label);
    });
  });

  describe("getWalletsByEntity", () => {
    it("should return wallets for given entity", async () => {
      const entity = "Test Entity";
      const wallets = [
        {
          address: "0x1234567890123456789012345678901234567890",
          networkId: 1,
          label: "Wallet 1",
          entity,
        },
        {
          address: "0x2345678901234567890123456789012345678901",
          networkId: 1,
          label: "Wallet 2",
          entity,
        },
      ];

      for (const wallet of wallets) {
        await repository.createWallet(wallet);
      }

      const result = await repository.getWalletsByEntity(entity);
      expect(result).toHaveLength(2);
      expect(result[0].entity).toBe(entity);
      expect(result[1].entity).toBe(entity);
    });
  });

  describe("getWalletsByNetwork", () => {
    it("should return wallets for given network", async () => {
      const networkId = 1;
      const wallets = [
        {
          address: "0x1234567890123456789012345678901234567890",
          networkId,
          label: "Wallet 1",
        },
        {
          address: "0x2345678901234567890123456789012345678901",
          networkId,
          label: "Wallet 2",
        },
      ];

      for (const wallet of wallets) {
        await repository.createWallet(wallet);
      }

      const result = await repository.getWalletsByNetwork(networkId);
      expect(result).toHaveLength(2);
      expect(result[0].networkId).toBe(networkId);
      expect(result[1].networkId).toBe(networkId);
    });
  });

  describe("searchWallets", () => {
    it("should search wallets by address, label, or entity", async () => {
      const wallets = [
        {
          address: "0x1234567890123456789012345678901234567890",
          networkId: 1,
          label: "Test Wallet 1",
          entity: "Test Entity 1",
        },
        {
          address: "0x2345678901234567890123456789012345678901",
          networkId: 1,
          label: "Test Wallet 2",
          entity: "Test Entity 2",
        },
      ];

      for (const wallet of wallets) {
        await repository.createWallet(wallet);
      }

      const searchResults = await repository.searchWallets("Test");
      expect(searchResults).toHaveLength(2);
    });
  });

  describe("getWalletStats", () => {
    it("should return correct wallet statistics", async () => {
      const wallets = [
        {
          address: "0x1234567890123456789012345678901234567890",
          networkId: 1,
          label: "Wallet 1",
        },
        {
          address: "0x2345678901234567890123456789012345678901",
          networkId: 1,
          label: "Wallet 2",
        },
        {
          address: "0x3456789012345678901234567890123456789012",
          networkId: 2,
          label: "Wallet 3",
        },
      ];

      for (const wallet of wallets) {
        await repository.createWallet(wallet);
      }

      const stats = await repository.getWalletStats();
      expect(stats.total).toBe(3);
      expect(stats.byNetwork).toHaveLength(2);
      expect(stats.byNetwork.find((n) => n.networkId === 1)?.count).toBe(2);
      expect(stats.byNetwork.find((n) => n.networkId === 2)?.count).toBe(1);
    });
  });
});
