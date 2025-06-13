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

export interface AddressResponse {
  address: string;
  chain: string;
  arkhamEntity: {
    name: string;
    note: string;
    id: string;
    type: string;
    service: string | null;
    addresses: string[] | null;
    website: string;
  };
  arkhamLabel: {
    name: string;
    address: string;
    chainType: string;
  };
  isUserAddress: boolean;
  contract?: boolean;
}

export interface SearchEntityResponse {
  arkhamEntities: {
    name: string;
    note: string;
    id: string;
    type: string;
    service: boolean;
    addresses: string[] | null;
  }[];
  arkhamAddresses: AddressResponse[];
  ens: { name: string; address: string }[];
  services: {
    name: string;
    note: string;
    id: string;
    type: string;
    service: boolean;
    addresses: string[] | null;
    twitter: string | null;
  }[];
}

export class ArkhamClient {
  private readonly baseUrl = "https://api.arkm.com";
  private readonly cookie: string;
  private lastRequestTime: number = 0;
  private inFlightRequests: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  private readonly minTimeBetweenRequests: number;
  private readonly maxConcurrentRequests: number;

  constructor(
    cookie: string,
    options: {
      minTimeBetweenRequests?: number;
      maxConcurrentRequests?: number;
    } = {}
  ) {
    if (!cookie) {
      throw new Error("ARKHAM_COOKIE is required");
    }
    this.cookie = cookie;
    this.minTimeBetweenRequests = options.minTimeBetweenRequests || 20; // Default 20ms between requests
    this.maxConcurrentRequests = options.maxConcurrentRequests || 5; // Default 5 concurrent requests
  }

  private getHeaders() {
    return {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=0, i",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie: this.cookie,
    };
  }

  private async processQueue() {
    if (
      this.isProcessingQueue ||
      this.requestQueue.length === 0 ||
      this.inFlightRequests >= this.maxConcurrentRequests
    ) {
      return;
    }

    this.isProcessingQueue = true;

    while (
      this.requestQueue.length > 0 &&
      this.inFlightRequests < this.maxConcurrentRequests
    ) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const waitTime = Math.max(
        0,
        this.minTimeBetweenRequests - timeSinceLastRequest
      );

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        this.inFlightRequests++;
        this.lastRequestTime = Date.now();

        try {
          await nextRequest();
        } finally {
          this.inFlightRequests--;
          this.processQueue();
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(executeRequest);
      this.processQueue();
    });
  }

  async fetchTransfers(
    entity: string,
    offset: number = 0,
    limit: number = 100
  ): Promise<TransferResponse> {
    return this.makeRequest(async () => {
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
    });
  }

  async fetchEntity(entityId: string): Promise<EntityResponse> {
    return this.makeRequest(async () => {
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
    });
  }

  async fetchAddress(address: string): Promise<AddressResponse> {
    return this.makeRequest(async () => {
      const response = await fetch(
        `${this.baseUrl}/intelligence/address/${address}`,
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
    });
  }

  async searchEntities(query: string): Promise<SearchEntityResponse> {
    return this.makeRequest(async () => {
      const response = await fetch(
        `${this.baseUrl}/intelligence/search?query=${query}`,
        {
          headers: this.getHeaders(),
          referrerPolicy: "strict-origin-when-cross-origin",
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search entities: ${response.statusText}`);
      }

      return response.json();
    });
  }
}
