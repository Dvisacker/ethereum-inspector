export const ETHER = 1e18;

export const NETWORKS = {
  MAINNET: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  POLYGON: 137,
} as const;

export type NetworkId = (typeof NETWORKS)[keyof typeof NETWORKS];

export interface TokenInfo {
  symbol: string;
  decimals: number;
}

export const TOKENS_BY_NETWORK: Record<NetworkId, Record<string, TokenInfo>> = {
  [NETWORKS.MAINNET]: {
    "0xdac17f958d2ee523a2206206994597c13d831ec7": {
      symbol: "USDT",
      decimals: 6,
    },
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
      symbol: "USDC",
      decimals: 6,
    },
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
      symbol: "WETH",
      decimals: 18,
    },
    "0x6b175474e89094c44da98b954eedeac495271d0f": {
      symbol: "DAI",
      decimals: 18,
    },
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
      symbol: "WBTC",
      decimals: 8,
    },
    "0x6c3ea9036406852006290770bedfcaba0e23a0e8": {
      symbol: "USDS",
      decimals: 6,
    },
  },
  [NETWORKS.ARBITRUM]: {
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": {
      symbol: "USDT",
      decimals: 6,
    },
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": {
      symbol: "USDC",
      decimals: 6,
    },
    "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": {
      symbol: "WETH",
      decimals: 18,
    },
    "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": {
      symbol: "DAI",
      decimals: 18,
    },
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": {
      symbol: "WBTC",
      decimals: 8,
    },
  },
  [NETWORKS.OPTIMISM]: {
    "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": {
      symbol: "USDT",
      decimals: 6,
    },
    "0x7f5c764cbc14f9669b88837ca1490cca17c31607": {
      symbol: "USDC",
      decimals: 6,
    },
    "0x4200000000000000000000000000000000000006": {
      symbol: "WETH",
      decimals: 18,
    },
    "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": {
      symbol: "DAI",
      decimals: 18,
    },
    "0x68f180fcce6836688e9084f035309e29bf0a2095": {
      symbol: "WBTC",
      decimals: 8,
    },
  },
  [NETWORKS.BASE]: {
    "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": {
      symbol: "USDT",
      decimals: 6,
    },
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {
      symbol: "USDC",
      decimals: 6,
    },
    "0x4200000000000000000000000000000000000006": {
      symbol: "WETH",
      decimals: 18,
    },
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
      symbol: "WBTC",
      decimals: 8,
    },
  },
  [NETWORKS.POLYGON]: {
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": {
      symbol: "USDT",
      decimals: 6,
    },
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": {
      symbol: "USDC",
      decimals: 6,
    },
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": {
      symbol: "WETH",
      decimals: 18,
    },
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": {
      symbol: "DAI",
      decimals: 18,
    },
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": {
      symbol: "WBTC",
      decimals: 8,
    },
  },
} as const;

export function getTokenInfoByAddress(
  address: string,
  networkId: NetworkId
): TokenInfo | undefined {
  return TOKENS_BY_NETWORK[networkId]?.[address.toLowerCase()];
}

export function getTokenSymbolByAddress(
  address: string,
  networkId: NetworkId
): string | undefined {
  return getTokenInfoByAddress(address, networkId)?.symbol;
}

export function getTokenDecimalsByAddress(
  address: string,
  networkId: NetworkId
): number | undefined {
  return getTokenInfoByAddress(address, networkId)?.decimals;
}

// For backward compatibility with existing code (mainnet only)
export const WHITELISTED_TOKENS = Object.fromEntries(
  Object.entries(TOKENS_BY_NETWORK[NETWORKS.MAINNET]).map(([address, info]) => [
    info.symbol,
    address,
  ])
) as Record<string, string>;

export const addressToSymbol = Object.fromEntries(
  Object.entries(TOKENS_BY_NETWORK[NETWORKS.MAINNET]).map(([address, info]) => [
    address,
    info.symbol,
  ])
) as Record<string, string>;
