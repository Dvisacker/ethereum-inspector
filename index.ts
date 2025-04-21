import { removeDuplicatesByKey } from "./helpers";
import { LabelResult, Transfer, TransferResponse } from "./types";
import { Command } from "commander";
import {
  isSmartContract,
  filterEOAAddresses,
  findContractFunders,
  findEOAFunder,
} from "./evm";
import { TransactionAnalyzer } from "./analysis";

export const fetchTransfers = async (
  entity: string,
  offset: number = 0,
  limit: number = 100
): Promise<TransferResponse> => {
  const cookie = process.env.ARKHAM_COOKIE;
  if (!cookie) {
    throw new Error("ARKHAM_COOKIE is not set");
  }

  const response = await fetch(
    `https://api.arkm.com/transfers?base=${entity}&flow=all&usdGte=1&sortKey=time&sortDir=desc&limit=${limit}&offset=${offset}`,
    {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=0, i",
        "sec-ch-ua":
          '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: cookie,
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    }
  );

  const data = await response.json();
  return data;
};

export const fetchLabels = async (entity: string): Promise<LabelResult[]> => {
  const allTransfers: Transfer[] = [];

  let offset = 0;
  const limit = 100;
  const max = 200;
  while (offset < max) {
    const data = await fetchTransfers(entity, offset, limit);
    console.log("Got", data.transfers.length, "transfers");
    allTransfers.push(...data.transfers);
    if (data.transfers.length < limit) {
      break;
    }
    offset += limit;
  }

  const fromAddresses = allTransfers.map((transfer) => transfer.fromAddress);
  console.log(fromAddresses);
  const fromAddressLabels = fromAddresses
    .filter((data) => data?.arkhamEntity?.id === entity)
    .map((data) => ({
      address: data.address,
      label: data.arkhamLabel,
      entity: data.arkhamEntity,
    }))
    .filter(Boolean) as LabelResult[];

  const toAddresses = allTransfers.map((transfer) => transfer.toAddress);
  console.log(toAddresses);
  const toAddressLabels = toAddresses
    .filter((data) => data?.arkhamEntity?.id === entity)
    .map((data) => ({
      address: data.address,
      label: data.arkhamLabel,
      entity: data.arkhamEntity,
    }))
    .filter(Boolean) as LabelResult[];

  const labels = [...fromAddressLabels, ...toAddressLabels];
  const uniqueLabels = removeDuplicatesByKey(labels, "address");
  return uniqueLabels;
};

export type OutputType = "csv" | "json" | "line";

export const formatOutput = (
  outputType: OutputType,
  labels: LabelResult[]
): string => {
  switch (outputType) {
    case "csv":
      return labels
        .map(
          (label) =>
            `${label.address},${label.entity.name},${label.label?.name ?? ""}`
        )
        .join("\n");
    case "json":
      return JSON.stringify(labels, null, 2);
    case "line": {
      const output: string[] = [];
      const nameIterator: Record<string, number> = {};
      for (const label of labels) {
        console.log(label);
        if (!nameIterator[label.entity.name]) {
          nameIterator[label.entity.name] = 0;
        }
        nameIterator[label.entity.name]++;
        const name = `${label.entity.name}${
          nameIterator[label.entity.name] > 1
            ? ` (${label.label?.name ?? ""}${nameIterator[label.entity.name]})`
            : ""
        }`;
        output.push(`${label.address} ${name}`);
      }
      return output.join("\n");
    }
    default:
      return JSON.stringify(labels);
  }
};
