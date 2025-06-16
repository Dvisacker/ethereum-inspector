# Bridge Transactions Fetcher

A comprehensive bridge transactions fetcher that aggregates cross-chain transactions from multiple bridge providers.

## Features

- **Multi-Provider Support**: Fetches transactions from Lifi, Socket, DLN, and Relay
- **Unified Interface**: Normalizes data from different APIs into a consistent format
- **Error Handling**: Gracefully handles API failures and rate limiting
- **Extensible**: Easy to add new bridge providers
- **Modular Architecture**: Organized into separate files for maintainability

## Supported Bridges

### 1. Lifi
- **URL**: `https://li.quest/v1/analytics/transfers`
- **Method**: GET
- **Features**: Comprehensive cross-chain transfer data with tool details

### 2. Socket
- **URL**: `https://microservices.socket.tech/loki/tx-history`
- **Method**: GET
- **Features**: Pagination support, detailed transaction status tracking
- **Special**: Fetches all pages automatically

### 3. DLN (deBridge Liquidity Network)
- **URL**: `https://stats-api.dln.trade/api/Orders/filteredList`
- **Method**: POST
- **Features**: Order-based bridging with fulfillment tracking

### 4. Relay
- **URL**: `https://api.relay.link/requests/v2`
- **Method**: GET
- **Features**: Fast bridging with relayer network

## Usage

### Basic Usage

```typescript
import { BridgeTransactionsFetcher } from './src/bridges';

const fetcher = new BridgeTransactionsFetcher();
const address = '0xed0c6079229e2d407672a117c22b62064f4a4312';

// Fetch from all providers
const allTransactions = await fetcher.fetchAllBridgeTransactions(address);

// Fetch from specific provider
const socketTransactions = await fetcher.fetchFromProvider('Socket', address);

// Get supported providers
const providers = fetcher.getSupportedProviders();
```

### Using Individual Providers

```typescript
import { SocketProvider, LifiProvider } from './src/bridges/providers';
import axios from 'axios';

const axiosInstance = axios.create({ timeout: 30000 });
const socketProvider = new SocketProvider(axiosInstance);
const lifiProvider = new LifiProvider(axiosInstance);

// Use individual providers directly
const socketTxs = await socketProvider.fetchTransactions(address);
const lifiTxs = await lifiProvider.fetchTransactions(address);
```

### Advanced Usage

```typescript
// Filter transactions by bridge
const lifiTransactions = allTransactions.filter(tx => tx.bridge === 'Lifi');

// Filter by status
const completedTransactions = allTransactions.filter(tx => tx.status === 'completed');

// Filter by chain
const ethereumTransactions = allTransactions.filter(tx => tx.fromChain === 1);

// Sort by amount
const sortedByAmount = allTransactions.sort((a, b) => 
  parseFloat(b.fromAmount) - parseFloat(a.fromAmount)
);
```

## Data Structure

Bridge transactions are normalized to the following structure:

```typescript
interface BridgeTransaction {
  txHash: string;              // Source transaction hash
  destTxHash?: string;         // Destination transaction hash
  bridge: string;              // Bridge name (e.g., 'Lifi', 'Socket')
  fromChain: number;           // Source chain ID
  toChain: number;             // Destination chain ID
  fromToken: string;           // Source token address
  toToken: string;             // Destination token address
  fromAmount: string;          // Amount sent (in wei/smallest unit)
  toAmount: string;            // Amount received (in wei/smallest unit)
  fromSymbol: string;          // Source token symbol
  toSymbol: string;            // Destination token symbol
  sender: string;              // Sender address
  recipient: string;           // Recipient address
  timestamp: number;           // Unix timestamp
  status: 'pending' | 'completed' | 'failed';
  fees?: string;               // Bridge fees (if available)
  blockNumber: number;         // Source block number
  destBlockNumber?: number;    // Destination block number
}
```

## Error Handling

The fetcher uses `Promise.allSettled` to ensure that failures from one provider don't affect others:

```typescript
// Failed providers are logged as warnings
const transactions = await fetcher.fetchAllBridgeTransactions(address);
// Will return transactions from successful providers even if some fail
```

## Chain ID Mapping

Common chain IDs used in responses:

- `1` - Ethereum Mainnet
- `10` - Optimism
- `56` - BSC
- `137` - Polygon
- `8453` - Base
- `42161` - Arbitrum

## LayerZero Integration (Future)

### Suggested Implementation

LayerZero provides cross-chain messaging infrastructure. To fetch LayerZero transactions:

```typescript
// Conceptual LayerZero API endpoints:
// 1. LayerZero Scan API
const layerZeroUrl = 'https://layerzeroscan.com/api/messages';

// 2. LayerZero Network API
const layerZeroNetworkUrl = 'https://api.layerzero.network/messages';

// Parameters:
// - address: wallet address
// - srcChainId: source chain ID (optional)
// - dstChainId: destination chain ID (optional)
// - limit: number of results
```

### Implementation Notes

1. **Message vs Transaction**: LayerZero deals with messages, not just token transfers
2. **Omnichain Apps**: Different apps use LayerZero differently (Stargate, Aptos Bridge, etc.)
3. **Status Tracking**: Messages have states like INFLIGHT, DELIVERED, FAILED

## CCTP Integration (Future)

### Suggested Implementation

Circle's Cross-Chain Transfer Protocol (CCTP) enables native USDC transfers:

```typescript
// Conceptual CCTP API endpoints:
// 1. Circle Iris API
const cctpUrl = 'https://iris-api.circle.com/v1/transfers';

// 2. Circle Attestation Service
const attestationUrl = 'https://iris-api.circle.com/v1/attestations';

// Parameters:
// - account: wallet address
// - source_domain: source chain domain
// - destination_domain: destination chain domain
// - limit: number of results
```

### Implementation Notes

1. **USDC Only**: CCTP primarily handles USDC transfers
2. **Domain Mapping**: Uses domain IDs instead of chain IDs
3. **Attestation**: Requires attestation service for completion
4. **Burn/Mint**: Uses burn-and-mint mechanism

## API Rate Limits

Different providers have different rate limits:

- **Lifi**: Generally permissive for analytics endpoints
- **Socket**: May have rate limiting on high-frequency requests
- **DLN**: Requires proper headers to avoid blocking
- **Relay**: Standard rate limiting applies

## Testing

Run the test suite:

```bash
npm test src/bridge.test.ts
```

Example test addresses with known bridge activity:
- `0xed0c6079229e2d407672a117c22b62064f4a4312` (Active bridge user)
- `0x1234567890123456789012345678901234567890` (Test address)

## Performance Considerations

1. **Parallel Fetching**: All providers are called in parallel
2. **Timeout Handling**: 30-second timeout for API calls
3. **Memory Usage**: Large address histories may consume significant memory
4. **Caching**: Consider implementing caching for frequently accessed addresses

## Future Enhancements

1. **Database Integration**: Store fetched transactions for historical analysis
2. **Real-time Updates**: WebSocket connections for live transaction tracking
3. **More Bridges**: Add Hop, Across, Celer, and other bridges
4. **Filtering**: Advanced filtering by time range, amount, chains
5. **Analytics**: Built-in analytics for bridge usage patterns
