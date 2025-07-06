import { LayerZeroProvider } from "./providers/layerzero";
import axios from "axios";

describe("Stargate Transaction Parsing", () => {
  const axiosInstance = axios.create({ timeout: 30000 });
  const provider = new LayerZeroProvider(axiosInstance);
  const testTxHash =
    "0xde7a2ba00b2d7141aac680aec6b477db5b1ce082d74e1c477824859885cca239";

  it("should parse a real Stargate transaction", async () => {
    const message = await provider.fetchMessageByTxHash(testTxHash);
    expect(message).not.toBeNull();

    console.log(message);

    if (!message) {
      throw new Error("No LayerZero message found for transaction");
    }

    const result = await provider.normalizeLayerZeroMessage(message);

    if (!result) {
      throw new Error("Failed to parse LayerZero message");
    }

    console.log(
      "Parsed Stargate transaction:",
      JSON.stringify(result, null, 2)
    );

    // Basic validation
    expect(result.bridge).toBe("Stargate V1 (LayerZero)");
    expect(result.txHash).toBe(testTxHash);
    expect(result.fromChain).toBeGreaterThan(0);
    expect(result.toChain).toBeGreaterThan(0);
    expect(result.fromToken).not.toBe(
      "0x0000000000000000000000000000000000000000"
    );
    expect(result.toToken).not.toBe(
      "0x0000000000000000000000000000000000000000"
    );
    expect(result.fromAmount).not.toBe("0");
    expect(result.toAmount).not.toBe("0");
  }, 30000);
});
