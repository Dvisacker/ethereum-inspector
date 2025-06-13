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
