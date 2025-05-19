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
