import { detectScamAddresses, formatSimilarityResult } from "./utils";

describe("detectScamAddresses", () => {
  const targetAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

  test("should detect exact match", () => {
    const addresses = [targetAddress];
    const results = detectScamAddresses(targetAddress, addresses);

    expect(results).toHaveLength(1);
    expect(results[0].address).toBe(targetAddress);
    expect(results[0].similarityScore).toBe(1);
    expect(results[0].isPotentialScam).toBe(true);
  });

  test("should detect similar addresses", () => {
    const addresses = [
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44f", // One character different
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44d", // One character different
      "0x1234567890123456789012345678901234567890", // Completely different
    ];

    const results = detectScamAddresses(targetAddress, addresses);

    expect(results).toHaveLength(2);
    expect(results[0].similarityScore).toBeGreaterThan(0.9);
    expect(results[1].similarityScore).toBeGreaterThan(0.9);
  });

  test("should respect minPrefixLength option", () => {
    const addresses = [
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44f", // Similar
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44d", // Similar
    ];

    // With high minPrefixLength
    const resultsHigh = detectScamAddresses(targetAddress, addresses, {
      minPrefixLength: 40, // Almost entire address
    });
    expect(resultsHigh).toHaveLength(0);

    // With low minPrefixLength
    const resultsLow = detectScamAddresses(targetAddress, addresses, {
      minPrefixLength: 4,
    });
    expect(resultsLow).toHaveLength(2);
  });

  test("should respect similarityThreshold option", () => {
    const addresses = [
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44f", // Similar
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44d", // Similar
      "0x1234567890123456789012345678901234567890", // Different
    ];

    // With high threshold
    const resultsHigh = detectScamAddresses(targetAddress, addresses, {
      similarityThreshold: 0.99,
    });
    expect(resultsHigh).toHaveLength(0);

    // With low threshold
    const resultsLow = detectScamAddresses(targetAddress, addresses, {
      similarityThreshold: 0.5,
    });
    expect(resultsLow.length).toBeGreaterThan(0);
  });

  test("should respect maxResults option", () => {
    const addresses = Array(20).fill(
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44f"
    );

    const results = detectScamAddresses(targetAddress, addresses, {
      maxResults: 5,
    });

    expect(results).toHaveLength(5);
  });

  test("should handle case-insensitive comparison", () => {
    const addresses = [
      targetAddress.toUpperCase(),
      targetAddress.toLowerCase(),
    ];

    const results = detectScamAddresses(targetAddress, addresses);

    expect(results).toHaveLength(2);
    expect(results[0].similarityScore).toBe(1);
    expect(results[1].similarityScore).toBe(1);
  });

  test("should handle addresses with/without 0x prefix", () => {
    const addresses = [targetAddress, targetAddress.replace("0x", "")];

    const results = detectScamAddresses(targetAddress, addresses);

    expect(results).toHaveLength(2);
    expect(results[0].similarityScore).toBe(1);
    expect(results[1].similarityScore).toBe(1);
  });

  test("should handle empty input", () => {
    const results = detectScamAddresses(targetAddress, []);
    expect(results).toHaveLength(0);
  });

  test("should handle invalid addresses", () => {
    const addresses = [
      "invalid",
      "0x123", // Too short
      "0x" + "1".repeat(41), // Too long
    ];

    const results = detectScamAddresses(targetAddress, addresses);
    expect(results).toHaveLength(0);
  });
});

describe("formatSimilarityResult", () => {
  test("should format result correctly", () => {
    const result = {
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44f",
      similarityScore: 0.95,
      matchingPrefix: "742d35Cc6634C0532925a3b844Bc454e4438f44",
      isPotentialScam: true,
    };

    const formatted = formatSimilarityResult(result);

    expect(formatted).toContain(result.address);
    expect(formatted).toContain("95.0%");
    expect(formatted).toContain(result.matchingPrefix);
    expect(formatted).toContain("⚠️ YES");
  });

  test("should format non-scam result correctly", () => {
    const result = {
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44f",
      similarityScore: 0.3,
      matchingPrefix: "742d",
      isPotentialScam: false,
    };

    const formatted = formatSimilarityResult(result);

    expect(formatted).toContain(result.address);
    expect(formatted).toContain("30.0%");
    expect(formatted).toContain(result.matchingPrefix);
    expect(formatted).toContain("✅ NO");
  });
});
