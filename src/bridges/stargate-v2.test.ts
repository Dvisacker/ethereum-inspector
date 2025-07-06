import { chainMapping, LayerZeroProvider } from "./providers/layerzero";
import axios from "axios";

describe("Stargate V2 Transaction Parsing", () => {
  const axiosInstance = axios.create({ timeout: 30000 });
  const provider = new LayerZeroProvider(axiosInstance);
  const testTxHash =
    "0xb241772e9a013dfd459b5bd59d1d642a9e2c44d84fde85a62c555c8b7d91a6b0";

  it("should parse a real Stargate V2 TokenMessaging transaction", async () => {
    const message = await provider.fetchMessageByTxHash(testTxHash);
    expect(message).not.toBeNull();

    if (!message) {
      throw new Error("No LayerZero message found for transaction");
    }

    // Parse the message
    const result = await provider.normalizeLayerZeroMessage(message);
    expect(result).not.toBeNull();

    if (!result) {
      throw new Error("Failed to parse LayerZero message");
    }

    // Verify the transaction details
    expect(result.bridge).toBe("Stargate V2 (LayerZero)");
    expect(result.fromChain).toBe(chainMapping[message.pathway.srcEid]);
    expect(result.toChain).toBe(chainMapping[message.pathway.dstEid]);
    expect(result.status).toBe(
      message.status.name === "DELIVERED" ? "completed" : "pending"
    );

    // Verify token details
    expect(result.fromToken).toBeDefined();
    expect(result.toToken).toBeDefined();
    expect(result.fromAmount).toBeDefined();
    expect(result.toAmount).toBeDefined();
    expect(result.fromSymbol).toBeDefined();
    expect(result.toSymbol).toBeDefined();

    // Verify addresses
    expect(result.sender).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should parse another real Stargate V2 TokenMessaging transaction", async () => {
    const txHash2 =
      "0x78bd3d28481681d24a78d0035568d1fc743c92662b38dd2c5c4b3e68826f4015";
    const message = await provider.fetchMessageByTxHash(txHash2);
    expect(message).not.toBeNull();

    if (!message) {
      throw new Error("No LayerZero message found for transaction");
    }

    // Parse the message
    const result = await provider.normalizeLayerZeroMessage(message);
    expect(result).not.toBeNull();

    if (!result) {
      throw new Error("Failed to parse LayerZero message");
    }

    // Verify the transaction details
    expect(result.bridge).toBe("Stargate V2 (LayerZero)");
    expect(result.fromChain).toBe(chainMapping[message.pathway.srcEid]);
    expect(result.toChain).toBe(chainMapping[message.pathway.dstEid]);
    expect(result.status).toBe(
      message.status.name === "DELIVERED" ? "completed" : "pending"
    );

    // Verify token details
    expect(result.fromToken).toBeDefined();
    expect(result.toToken).toBeDefined();
    expect(result.fromAmount).toBeDefined();
    expect(result.toAmount).toBeDefined();
    expect(result.fromSymbol).toBeDefined();
    expect(result.toSymbol).toBeDefined();

    // Verify addresses
    expect(result.sender).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
