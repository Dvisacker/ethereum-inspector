import { TransferResponse } from "./types";

export interface EntityTag {
  id: string;
  label: string;
  rank: number;
  excludeEntities: boolean;
  disablePage: boolean;
  tagParams?: string;
}

export interface EntityResponse {
  name: string;
  note: string;
  id: string;
  customized: boolean;
  type: string;
  service: string | null;
  addresses: string[] | null;
  twitter: string | null;
  populatedTags: EntityTag[];
}

export class ArkhamClient {
  private readonly baseUrl = "https://api.arkm.com";
  private readonly cookie: string;

  constructor(cookie: string) {
    if (!cookie) {
      throw new Error("ARKHAM_COOKIE is required");
    }
    this.cookie = cookie;
  }

  private getHeaders() {
    return {
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
      cookie: this.cookie,
    };
  }

  async fetchTransfers(
    entity: string,
    offset: number = 0,
    limit: number = 100
  ): Promise<TransferResponse> {
    const response = await fetch(
      `${this.baseUrl}/transfers?base=${entity}&flow=all&usdGte=1&sortKey=time&sortDir=desc&limit=${limit}&offset=${offset}`,
      {
        headers: this.getHeaders(),
        referrerPolicy: "strict-origin-when-cross-origin",
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transfers: ${response.statusText}`);
    }

    return response.json();
  }

  async fetchEntity(entityId: string): Promise<EntityResponse> {
    const response = await fetch(
      `${this.baseUrl}/intelligence/entity/${entityId}`,
      {
        headers: this.getHeaders(),
        referrerPolicy: "strict-origin-when-cross-origin",
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch entity: ${response.statusText}`);
    }

    return response.json();
  }
}
