// import { TransactionAnalyzer, TransactionTimingAnalysis } from "./analysis";
// import { HyperSync } from "./hypersync";

// // Well-known Ethereum addresses for testing
// const VITALIK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // Vitalik's address (EOA)
// const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router (Contract)

// describe("TransactionAnalyzer", () => {
//   let analyzer: TransactionAnalyzer;

//   beforeEach(() => {
//     analyzer = new TransactionAnalyzer();
//   });

//   describe("analyzeTransactionTiming", () => {
//     it("should analyze transaction timing patterns for an active address", async () => {
//       const analysis = await analyzer.analyzeTransactionTiming(VITALIK_ADDRESS);

//       expect(analysis).toBeDefined();
//       expect(analysis.totalTransactions).toBeGreaterThan(0);
//       expect(analysis.averageTransactionsPerDay).toBeGreaterThan(0);

//       // Check distributions
//       expect(Object.keys(analysis.hourlyDistribution).length).toBeGreaterThan(
//         0
//       );
//       expect(Object.keys(analysis.dailyDistribution).length).toBeGreaterThan(0);
//       expect(Object.keys(analysis.monthlyDistribution).length).toBeGreaterThan(
//         0
//       );

//       // Check busiest periods
//       expect(analysis.busiestHour).toBeDefined();
//       expect(analysis.busiestDay).toBeDefined();
//       expect(analysis.busiestMonth).toBeDefined();
//     }, 100000);

//     it("should handle empty transaction history", async () => {
//       // Using a newly created address that likely has no transactions
//       const newAddress = "0x0000000000000000000000000000000000000000";
//       const analysis = await analyzer.analyzeTransactionTiming(newAddress);

//       expect(analysis.totalTransactions).toBe(0);
//       expect(analysis.averageTransactionsPerDay).toBe(0);
//       expect(Object.keys(analysis.hourlyDistribution)).toHaveLength(0);
//       expect(Object.keys(analysis.dailyDistribution)).toHaveLength(0);
//       expect(Object.keys(analysis.monthlyDistribution)).toHaveLength(0);
//     });
//   });

//   describe("formatAnalysis", () => {
//     it("should format analysis results correctly", async () => {
//       // Get real analysis data first
//       const analysis = await analyzer.analyzeTransactionTiming(VITALIK_ADDRESS);
//       const formatted = analyzer.formatAnalysis(analysis);

//       // Check for key information in the formatted string
//       expect(formatted).toContain(
//         `Total Transactions: ${analysis.totalTransactions}`
//       );
//       expect(formatted).toContain(
//         `Average Transactions per Day: ${analysis.averageTransactionsPerDay.toFixed(
//           2
//         )}`
//       );

//       // Check for distribution sections
//       expect(formatted).toContain("Hourly Distribution:");
//       expect(formatted).toContain("Daily Distribution:");
//       expect(formatted).toContain("Monthly Distribution:");

//       // Check for busiest periods
//       expect(formatted).toContain("Busiest Periods:");
//       expect(formatted).toContain(`Hour: ${analysis.busiestHour.hour}:00 UTC`);
//       expect(formatted).toContain(
//         `Day: ${
//           [
//             "Sunday",
//             "Monday",
//             "Tuesday",
//             "Wednesday",
//             "Thursday",
//             "Friday",
//             "Saturday",
//           ][analysis.busiestDay.day]
//         }`
//       );
//       expect(formatted).toContain(
//         `Month: ${
//           [
//             "January",
//             "February",
//             "March",
//             "April",
//             "May",
//             "June",
//             "July",
//             "August",
//             "September",
//             "October",
//             "November",
//             "December",
//           ][analysis.busiestMonth.month]
//         }`
//       );
//     }, 100000);
//   });
// });
