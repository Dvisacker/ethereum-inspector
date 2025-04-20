interface Transfer {
  fromAddress: Address;
  toAddress: Address;
}

interface Address {
  address: string;
  arkhamEntity?: Entity;
  arkhamLabel?: Label;
}

interface Entity {
  id: string;
  name: string;
}

interface Label {
  name: string;
}

interface TransferResponse {
  transfers: Transfer[];
}

// Function to remove duplicates by key from array of objects
const removeDuplicatesByKey = <T extends Record<string, any>>(
  arr: T[],
  key: keyof T
): T[] => {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
};

const abbreviateAddress = (address: string): string => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};

const cookie =
  "_gcl_au=1.1.1135636805.1742395515; _ga=GA1.1.1035965964.1742395516; mp_db580d24fbe794a9a4765bcbfec0e06b_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A195aedd8251269-0437400a809528-1b525636-384000-195aedd8251269%22%2C%22%24device_id%22%3A%20%22195aedd8251269-0437400a809528-1b525636-384000-195aedd8251269%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fintel.arkm.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22intel.arkm.com%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fintel.arkm.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22intel.arkm.com%22%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpr%22%3A%20%5B%5D%2C%22__mpap%22%3A%20%5B%5D%7D; arkham_is_authed=true; arkham_platform_session=1f82739b-a7e8-4482-ae05-b0ef866cc525; mp_f32068aad7a42457f4470f3e023dd36f_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A195aedd7c0b2f2-06e3c87154712b-1b525636-384000-195aedd7c0b2f2%22%2C%22%24device_id%22%3A%20%22195aedd7c0b2f2-06e3c87154712b-1b525636-384000-195aedd7c0b2f2%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpr%22%3A%20%5B%5D%2C%22__mpap%22%3A%20%5B%5D%7D; _ga_P74N755GGG=GS1.1.1745077493.13.1.1745081478.0.0.0; _ga_K3BXC51SZE=GS1.1.1745077493.8.1.1745081478.0.0.0; _dd_s=rum=2&id=6ade81ea-a567-4221-a235-b86cb790d49f&created=1745081164442&expire=1745082585727";

const fetchTransfers = async (
  entity: string,
  offset: number = 0,
  limit: number = 100
): Promise<TransferResponse> => {
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

interface LabelResult {
  address: string;
  label?: Label;
  entity: Entity;
}

const fetchLabels = async (entity: string): Promise<LabelResult[]> => {
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

type OutputType = "csv" | "json" | "line";

const formatOutput = (
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

const main = async (): Promise<void> => {
  const labels = await fetchLabels("wintermute");
  console.log(formatOutput("line", labels));
};

main();
