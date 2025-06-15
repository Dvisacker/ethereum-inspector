# <div align="center">🔍 Ethereum Inspector</div>

<div align="center">

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/david/wallet-inspector)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/david/wallet-inspector/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)

</div>

A command-line tool for deep analysis of Ethereum addresses. Uncover transaction patterns, identify related wallets and download a spreadsheet with the results. Work in progress.

## 📝 Example Results

View an [example analysis](https://docs.google.com/spreadsheets/d/1vczcM9H1sLU1i7BBWB1b4XgvYOX_xD56e3DJa4yNrhE/edit?gid=167015203#gid=167015203) of Abraxas (an Italian crypto fund).

## 📊 Features

### Transaction Analysis
- **Timing Analysis**
  - Busiest periods and work/sleep windows
  - Timezone inference
  - Transaction distribution patterns
- **Related Wallets**
  - Detection of connected addresses
  - Arkham entity/label integration
  - Scam transaction filtering (WIP)
- **Contract Interactions**
  - Most frequently interacted contracts
  - Contract metadata and proxy information
- **Transfer Analysis**
  - ETH and token transfers
  - Transfer patterns and volumes
- **Excel Export**
  - XLSX export
  - Color-coded tables 
- **Data Integration**
  - Etherscan for contract verification
  - Arkham for entity data
  - HyperSync for efficient blockchain queries

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/david/wallet-inspector.git
cd wallet-inspector
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Configure the following in your `.env` file:
```env
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
ARKHAM_COOKIE=your_arkham_cookie
```

4. Run the tool:
```bash
npm run dev <address>
```

## 🔧 Configuration

### API Keys
- **Etherscan**: Required for contract verification
- **Alchemy**: Required for blockchain data access
- **Arkham**: Required for entity data (cookie can be found in browser developer tools)

## 🛠️ Development

### Project Structure
```
wallet-inspector/
├── src/
│   ├── analysis/      # Analysis logic
│   ├── formatters/    # Output formatting
│   └── utils/         # Utility functions
├── scripts/           # Build and utility scripts
└── tests/            # Test files
```

### Available Scripts
- `npm run dev`: Start development mode
- `npm run build`: Build the project
- `npm test`: Run tests
- `npm run lint`: Run linter

## 📋 Roadmap

### Optimizations
- [ ] Batch HyperSync queries
- [ ] Implement caching layer for external APIs
- [ ] Optimize analysis for high-transaction wallets
- [ ] Cache analysis options

### New Features
- [ ] Wallet similarity analysis
- [ ] Net inflow/outflow tracking
- [ ] Embedded database for labels
- [ ] PDF export
- [ ] Contract function analysis
- [ ] Multi-chain support
- [ ] Bridge transaction tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.