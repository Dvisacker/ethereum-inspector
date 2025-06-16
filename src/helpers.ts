export const removeDuplicatesByKey = <T extends Record<string, any>>(
  arr: T[],
  key: keyof T
): T[] => {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
};

export const abbreviateAddress = (address: string): string => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};

export function addressToTopic(address: string): string {
  return "0x000000000000000000000000" + address.slice(2, address.length);
}

export function createTerminalLink(text: string, url: string): string {
  // OSC 8 is the escape sequence for hyperlinks
  // \x1b]8;; is the start of the link
  // \x1b\\ is the end of the link
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

export function createEtherscanLink(address: string): string {
  return createTerminalLink(address, `https://etherscan.io/address/${address}`);
}

export function createTenderlyLink(address: string): string {
  return createTerminalLink(
    address,
    `https://dashboard.tenderly.co/contract/mainnet/${address}`
  );
}

export function createArkhamLink(address: string): string {
  return createTerminalLink(
    address,
    `https://app.arkhamintelligence.com/explorer/address/${address}`
  );
}

export async function safePromise<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.log("API call failed:", error);
    return null;
  }
}

type AsyncFunction<T> = (...args: any[]) => Promise<T>;

export function createThrottledFunction<T>(
  fn: AsyncFunction<T>,
  options: {
    minTimeBetweenCalls?: number;
    maxConcurrent?: number;
  } = {}
): AsyncFunction<T> {
  const {
    minTimeBetweenCalls = 20, // Default 20ms second between calls
    maxConcurrent = 5, // Default max 5 concurrent calls
  } = options;

  let lastCallTime = 0;
  let inFlightCalls = 0;
  const queue: Array<() => Promise<T>> = [];

  const processQueue = async () => {
    if (queue.length === 0 || inFlightCalls >= maxConcurrent) return;

    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    const waitTime = Math.max(0, minTimeBetweenCalls - timeSinceLastCall);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    const nextCall = queue.shift();
    if (nextCall) {
      inFlightCalls++;
      try {
        await nextCall();
      } finally {
        inFlightCalls--;
        lastCallTime = Date.now();
        processQueue();
      }
    }
  };

  return async (...args: any[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      const executeCall = async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      queue.push(executeCall as () => Promise<T>);
      processQueue();
    });
  };
}

// Helper to shorten addresses and hashes
export function shortAddr(addr: string) {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}
export function shortHash(hash: string) {
  if (!hash) return "";
  return hash.length > 14 ? `${hash.slice(0, 10)}...${hash.slice(-4)}` : hash;
}

export function getLightRedGradient(percent: number) {
  // percent: 0 to 1
  // White (#FFFFFF) to light red (#FFCCCC)
  const r = 255;
  const g = Math.round(255 - percent * (255 - 204)); // 255 to 204
  const b = Math.round(255 - percent * (255 - 204)); // 255 to 204
  // Convert to 2-digit hex and concatenate
  const hex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return { rgb: `${hex(r)}${hex(g)}${hex(b)}` };
}

export function getEtherscanTxLink(txHash: string): string {
  return `https://etherscan.io/tx/${txHash}`;
}

export function getEtherscanAddressLink(address: string): string {
  return `https://etherscan.io/address/${address}`;
}

export function getDebankLink(address: string): string {
  return `https://debank.com/profile/${address}`;
}

export function getArkhamLink(address: string): string {
  return `https://intel.arkm.com/visualizer/entity/${address}`;
}
