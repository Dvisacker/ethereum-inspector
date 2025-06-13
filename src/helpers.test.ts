import {
  removeDuplicatesByKey,
  abbreviateAddress,
  addressToTopic,
  createTerminalLink,
  createEtherscanLink,
  createTenderlyLink,
  createArkhamLink,
  safePromise,
  createThrottledFunction,
  shortAddr,
  shortHash,
  getLightRedGradient,
} from "./helpers";

describe("helpers.ts", () => {
  test("removeDuplicatesByKey removes duplicates by key", () => {
    const arr = [
      { id: 1, value: "a" },
      { id: 2, value: "b" },
      { id: 1, value: "c" },
    ];
    expect(removeDuplicatesByKey(arr, "id")).toEqual([
      { id: 2, value: "b" },
      { id: 1, value: "c" },
    ]);
  });

  test("abbreviateAddress shortens address", () => {
    expect(
      abbreviateAddress("0x1234567890abcdef1234567890abcdef12345678")
    ).toBe("0x1234...5678");
  });

  test("addressToTopic pads address correctly", () => {
    expect(addressToTopic("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x0000000000000000000000001234567890abcdef1234567890abcdef12345678"
    );
  });

  test("createTerminalLink creates OSC 8 link", () => {
    expect(createTerminalLink("text", "https://example.com")).toBe(
      "\x1b]8;;https://example.com\x1b\\text\x1b]8;;\x1b\\"
    );
  });

  test("createEtherscanLink creates etherscan link", () => {
    expect(createEtherscanLink("0xabc")).toContain(
      "etherscan.io/address/0xabc"
    );
  });

  test("createTenderlyLink creates tenderly link", () => {
    expect(createTenderlyLink("0xabc")).toContain(
      "tenderly.co/contract/mainnet/0xabc"
    );
  });

  test("createArkhamLink creates arkham link", () => {
    expect(createArkhamLink("0xabc")).toContain(
      "arkhamintelligence.com/explorer/address/0xabc"
    );
  });

  test("safePromise returns value on resolve", async () => {
    const result = await safePromise(Promise.resolve(42));
    expect(result).toBe(42);
  });

  test("safePromise returns null on reject", async () => {
    const result = await safePromise(Promise.reject(new Error("fail")));
    expect(result).toBeNull();
  });

  test("createThrottledFunction throttles calls", async () => {
    let callCount = 0;
    const fn = async (x: number) => {
      callCount++;
      return x * 2;
    };
    const throttled = createThrottledFunction(fn, {
      minTimeBetweenCalls: 10,
      maxConcurrent: 1,
    });
    const results = await Promise.all([
      throttled(1),
      throttled(2),
      throttled(3),
    ]);
    expect(results).toEqual([2, 4, 6]);
    expect(callCount).toBe(3);
  });

  test("shortAddr shortens long address", () => {
    expect(shortAddr("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234...5678"
    );
    expect(shortAddr("0x1234")).toBe("0x1234");
  });

  test("shortHash shortens long hash", () => {
    expect(shortHash("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x12345678...5678"
    );
    expect(shortHash("0x1234")).toBe("0x1234");
  });

  test("getLightRedGradient returns correct color for 0%", () => {
    expect(getLightRedGradient(0)).toEqual({ rgb: "FFFFFF" });
  });
  test("getLightRedGradient returns correct color for 100%", () => {
    expect(getLightRedGradient(1)).toEqual({ rgb: "FFCCCC" });
  });
  test("getLightRedGradient returns correct color for 50%", () => {
    expect(getLightRedGradient(0.5)).toEqual({ rgb: "FFE6E6" });
  });
});
