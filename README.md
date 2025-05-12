# Arkham CLI

A command-line interface for analyzing Ethereum addresses and transactions.

## Installation

```bash
npm install -g @arkham/cli
```

## Configuration

Create a `.env` file in your home directory with the following variables:

```env
RPC_URL=your_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Usage

### Get Entity Information

```bash
arkham info <address>
```

### Check if Address is a Smart Contract

```bash
arkham is-contract <address>
```

### Get Contract Name

```bash
arkham contract-name <address>
```

### Get Related Wallets

```bash
arkham related-wallets <address> [--from-block <number>] [--to-block <number>]
```

### Analyze Transaction Timing

```bash
arkham analyze-timing <address> [--from-block <number>] [--to-block <number>]
```

## API Reference

### EtherscanClient

The `EtherscanClient` class provides methods to interact with the Etherscan API V2.

```typescript
import { EtherscanClient } from '@arkham/cli';

const etherscan = new EtherscanClient('YOUR_API_KEY');
```

#### Methods

##### getContractABI(address: string, chainid: number)
Get the ABI for a verified contract.

##### getContractSourceCode(address: string, chainid: number)
Get the source code for a verified contract.

##### getContractName(address: string, chainid: number)
Get the name of a verified contract.

##### getContractCreator(address: string, chainid: number)
Get the creator address and creation transaction hash for a contract.

##### getContractVerificationStatus(address: string, chainid: number)
Check if a contract is verified and get verification details.

##### getContractBytecode(address: string, chainid: number)
Get the bytecode of a contract.

##### getContractStorage(address: string, position: string, chainid: number)
Get the storage value at a specific position in a contract.

##### verifyProxyContract(address: string, chainid: number, expectedImplementation?: string)
Verify a proxy contract.

##### checkProxyVerification(guid: string, chainid: number)
Check the status of a proxy contract verification.

### Chain IDs

The following chain IDs are supported:

- 1: Ethereum Mainnet
- 5: Goerli Testnet
- 11155111: Sepolia Testnet
- 17000: Holesky Testnet

## Examples

### Get Contract Information

```typescript
const etherscan = new EtherscanClient('YOUR_API_KEY');

// Get contract name
const name = await etherscan.getContractName('0x...', 1);

// Get contract creator
const creator = await etherscan.getContractCreator('0x...', 1);
console.log(`Created by: ${creator.creator}`);
console.log(`Creation tx: ${creator.txHash}`);

// Check verification status
const status = await etherscan.getContractVerificationStatus('0x...', 1);
console.log(`Verified: ${status.verified}`);
console.log(`Compiler: ${status.compilerVersion}`);
```

### Analyze Contract Storage

```typescript
const etherscan = new EtherscanClient('YOUR_API_KEY');

// Get contract bytecode
const bytecode = await etherscan.getContractBytecode('0x...', 1);

// Read storage slot
const storage = await etherscan.getContractStorage('0x...', '0x0', 1);
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration
4. Build the project:
   ```bash
   npm run build
   ```

### Testing

```bash
npm test
```

## License

MIT 