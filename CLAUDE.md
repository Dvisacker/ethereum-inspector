# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript CLI tool for analyzing Ethereum wallet addresses called "wallet-inspector" (binary: `searchor`). It performs comprehensive analysis including transaction timing patterns, related wallet discovery, contract interactions, funding source analysis, and bridge transaction tracking. The tool integrates with Etherscan, Alchemy, Arkham Intelligence, and HyperSync APIs to provide detailed wallet analysis with Excel export capabilities.

## Common Commands

### Development & Build
```bash
npm run dev <address>          # Clean, build, and run analysis on an address
npm run build                  # Compile TypeScript to dist/
npm run clean                  # Remove dist/ directory  
npm start                      # Run compiled version from dist/
```

### Testing
```bash
npm test                       # Run all Jest tests
npm test -- --watch          # Run tests in watch mode
npm test -- --coverage       # Run tests with coverage report
```

### Database Management
```bash
npm run db:generate           # Generate Prisma client
npm run db:push              # Push schema to database
npm run db:studio            # Open Prisma Studio
npm run db:reset             # Reset database with force
npm run db:seed              # Seed database with example data
```

### Versioning
```bash
npm run version              # Update version using scripts/version.js
npm run postversion          # Push tags after version bump
```

## Architecture

### Core Analysis Flow
1. **Entry Point**: `src/index.ts` - CLI interface using Commander.js with interactive prompts
2. **Main Analyzer**: `src/analysis.ts` - Orchestrates different analysis modules
3. **Data Sources**: 
   - `src/hypersync.ts` - Efficient blockchain data via HyperSync
   - `src/etherscan.ts` - Transaction history and contract verification
   - `src/arkham.ts` - Entity labeling and wallet information
4. **Output**: `src/formatters/` - Terminal display and Excel export

### Key Modules
- **Configuration**: `src/config.ts` - YAML + environment variable configuration
- **Blockchain Interaction**: `src/evm.ts` - Ethers.js utilities and contract detection
- **Time Analysis**: `src/time.ts` - Timezone inference and temporal pattern analysis
- **Database**: `src/database/` - Prisma-based repositories for contracts and wallets
- **Bridge Analysis**: `src/bridges/` - Cross-chain transaction detection (LayerZero, CCTP, etc.)
- **Types**: `src/types.ts` - Core TypeScript interfaces

### Bridge Providers
The bridge analysis system supports multiple providers in `src/bridges/providers/`:
- **LayerZero**: `layerzero.ts` - LayerZero V1/V2 cross-chain transactions
- **CCTP**: `cctp.ts` - Circle's Cross-Chain Transfer Protocol
- **Relay**: `relay.ts` - Relay protocol bridge transactions
- **DLN**: `dln.ts` - Debridge Liquidity Network
- **LiFi/Socket**: Cross-chain aggregators

## Required Environment Variables
```env
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key  
ARKHAM_COOKIE=your_arkham_cookie
```

## Testing Approach
- Tests are co-located with source files (`.test.ts` suffix)
- Integration-focused testing without extensive mocking
- Run specific test: `npm test -- --testNamePattern="test name"`
- Database tests use in-memory SQLite

## Key Development Patterns
- **Error Handling**: All async operations wrapped with proper error handling
- **Rate Limiting**: API clients implement backoff strategies for external services
- **Type Safety**: Strict TypeScript with interfaces in `types.ts`
- **Configuration Precedence**: Environment variables > config.yaml > defaults
- **Database**: Prisma ORM with SQLite for local development

## Output Formats
- **Terminal**: Colored tables via cli-table3 and chalk
- **Excel**: Multi-sheet XLSX export with color-coded address mapping
- **Logging**: Winston-based logging system in `src/logger.ts`