export const removeDuplicatesByKey = <T extends Record<string, any>>(
  arr: T[],
  key: keyof T
): T[] => {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
};

export const abbreviateAddress = (address: string): string => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};
