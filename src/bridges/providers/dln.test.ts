import { DlnProvider } from "./dln";
import axios from "axios";

describe("DlnProvider", () => {
  const axiosInstance = axios.create({ timeout: 30000 });
  const provider = new DlnProvider(axiosInstance);
  const testAddress = "0x09307868cb3f32ce0c147d25307839b0bbae6d65";

  it("should fetch DLN transactions", async () => {
    const transactions = await provider.fetchTransactions(testAddress);
    console.log(transactions);
    expect(Array.isArray(transactions)).toBe(true);

    const tx = transactions[0];

    // Check required properties
    expect(tx).toHaveProperty("txHash");
    expect(tx).toHaveProperty("bridge");
    expect(tx.bridge).toBe("DLN");

    // Check chain IDs
    expect(typeof tx.fromChain).toBe("number");
    expect(typeof tx.toChain).toBe("number");

    // Check addresses
    expect(typeof tx.sender).toBe("string");
    expect(typeof tx.recipient).toBe("string");

    // Check address formats - allow both Ethereum and Solana addresses
    const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/;
    const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    expect(
      isEthereumAddress.test(tx.sender) || isSolanaAddress.test(tx.sender)
    ).toBe(true);
    expect(
      isEthereumAddress.test(tx.recipient) || isSolanaAddress.test(tx.recipient)
    ).toBe(true);

    // Check amounts
    expect(typeof tx.fromAmount).toBe("string");
    expect(typeof tx.toAmount).toBe("string");

    // Check timestamps and block numbers
    expect(typeof tx.timestamp).toBe("number");
    expect(typeof tx.blockNumber).toBe("number");
    if (tx.destBlockNumber) {
      expect(typeof tx.destBlockNumber).toBe("number");
    }

    // Check status
    expect(["pending", "completed", "failed"]).toContain(tx.status);

    console.log("DLN transaction sample:", {
      bridge: tx.bridge,
      fromChain: tx.fromChain,
      toChain: tx.toChain,
      status: tx.status,
      timestamp: new Date(tx.timestamp * 1000).toISOString(),
      fromAmount: tx.fromAmount,
      toAmount: tx.toAmount,
    });
  }, 30000);

  it("should handle API errors gracefully", async () => {
    const invalidAddress = "invalid_address";
    try {
      await provider.fetchTransactions(invalidAddress);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("DLN API error");
    }
  });
});
