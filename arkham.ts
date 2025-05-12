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
  isUserAddress: boolean;
  contract?: boolean;
}

/* 
Example response:
{
    "arkhamEntities": [
        {
            "name": "DCF GOD",
            "note": "",
            "id": "dcfgod",
            "type": "individual",
            "service": false,
            "addresses": null
        },
        {
            "name": "@_dcfc13",
            "note": "",
            "id": "dcfc13",
            "type": "individual",
            "service": false,
            "addresses": null
        },
        {
            "name": "@dcfpascal_",
            "note": "",
            "id": "dcfpascal",
            "type": "individual",
            "service": false,
            "addresses": null
        },
        {
            "name": "@dcfintern",
            "note": "",
            "id": "dcfintern",
            "type": "individual",
            "service": false,
            "addresses": null
        },
        {
            "name": "@dcfrbvhnjuk",
            "note": "",
            "id": "dcfrbvhnjuk",
            "type": "individual",
            "service": false,
            "addresses": null
        }
    ],
    "arkhamAddresses": [
        {
            "address": "0xFa4FC4ec2F81A4897743C5b4f45907c02ce06199",
            "chain": "ethereum",
            "arkhamEntity": {
                "name": "DCF GOD",
                "note": "",
                "id": "dcfgod",
                "type": null,
                "service": null,
                "addresses": null
            },
            "arkhamLabel": {
                "name": "OpenSea User",
                "address": "0xFa4FC4ec2F81A4897743C5b4f45907c02ce06199",
                "chainType": "evm"
            },
            "isUserAddress": false
        },
        {
            "address": "TCYGCdTkY52bFNDLMMaNqYjwB6ELoLecSj",
            "chain": "tron",
            "arkhamEntity": {
                "name": "Dcoin",
                "note": "",
                "id": "dcoin",
                "type": null,
                "service": null,
                "addresses": null
            },
            "arkhamLabel": {
                "name": "Hot Wallet",
                "address": "TCYGCdTkY52bFNDLMMaNqYjwB6ELoLecSj",
                "chainType": "tron"
            },
            "isUserAddress": false
        },
        {
            "address": "Dht7MqnC2bW76MNnPPHCemE5CXfeSwpXVhCMQh5D7SeJ",
            "chain": "solana",
            "arkhamLabel": {
                "name": "dchad.sol",
                "address": "Dht7MqnC2bW76MNnPPHCemE5CXfeSwpXVhCMQh5D7SeJ",
                "chainType": "solana"
            },
            "isUserAddress": false
        },
        {
            "address": "TYMe62y8ZhguBDeQ6jgfSENFviZpSVC4H4",
            "chain": "tron",
            "arkhamLabel": {
                "name": "DCM (DCM)",
                "address": "TYMe62y8ZhguBDeQ6jgfSENFviZpSVC4H4",
                "chainType": "tron"
            },
            "isUserAddress": false
        },
        {
            "address": "BtxnBqqgCnDQfXLJeijdJm2GdNz3iFEqKAkMw3SuJtNG",
            "chain": "solana",
            "arkhamEntity": {
                "name": "@dci_crypto",
                "note": "",
                "id": "dci-crypto",
                "type": null,
                "service": null,
                "addresses": null
            },
            "isUserAddress": false
        }
    ],
    "ens": [
        {
            "name": "dcfpascal.eth",
            "address": "0xdFB7009edD56adA61Ce83EF03111815eFA604c7E"
        },
        {
            "name": "dcftw.eth",
            "address": "0x338E4D22b039468eD06B02C268e826628f0Aa7FD"
        },
        {
            "name": "dcba.eth",
            "address": "0x07ba468c1DAbbD5483B9E65cb1680884D1aCA50d"
        },
        {
            "name": "dcfsan.eth",
            "address": "0x6A8D01c884D3047f7f17f123b4126CF509D8dC4E"
        },
        {
            "name": "dcarbs.eth",
            "address": "0x7c76Bc0E71ece83b02C599E95ee8eB91fc389b55"
        }
    ],
    "services": [
        {
            "name": "Dcoin",
            "note": "",
            "id": "dcoin",
            "type": "cex",
            "service": true,
            "addresses": null,
            "twitter": "dcoinexchange"
        },
        {
            "name": "Bake.io (Cake DeFi)",
            "note": "",
            "id": "bake-io",
            "type": "yield",
            "service": true,
            "addresses": null,
            "twitter": "bake_io"
        }
    ],
    "twitter": [
        {
            "name": "DCF GOD",
            "note": "",
            "id": "dcfgod",
            "type": "individual",
            "service": false,
            "addresses": null,
            "twitter": "dcfgod"
        },
        {
            "name": "@dcfpascal_",
            "note": "",
            "id": "dcfpascal",
            "type": "individual",
            "service": false,
            "addresses": null,
            "twitter": "dcfpascal_"
        },
        {
            "name": "@dcfintern",
            "note": "",
            "id": "dcfintern",
            "type": "individual",
            "service": false,
            "addresses": null,
            "twitter": "dcfintern"
        },
        {
            "name": "@dcfrbvhnjuk",
            "note": "",
            "id": "dcfrbvhnjuk",
            "type": "individual",
            "service": false,
            "addresses": null,
            "twitter": "dcfrbvhnjuk"
        },
        {
            "name": "@dcf_sensei",
            "note": "",
            "id": "dcf-sensei",
            "type": "individual",
            "service": false,
            "addresses": null,
            "twitter": "dcf_sensei"
        }
    ],
    "opensea": [
        {
            "address": "0xAE9155be72fD213DBF5aD46308c7EAfC63A71b16",
            "username": "dcfrens",
            "profileImage": "https://storage.googleapis.com/opensea-static/opensea-profile/22.png"
        },
        {
            "address": "0xc6136d5d747350f0a9D46730c12bB6c5A14aDCCe",
            "username": "DCCe",
            "profileImage": "https://i.seadn.io/gae/Y8DJXnvcLo-iTT0NyrQIyQkno9p4QQdw-R53S-F0gbKZh2QD8ythEekI4T8zgiuarfcHYCbf4L8HEWSj8N1zQSB-rLe_uhUgeXZZnBg?w=500\u0026auto=format"
        },
        {
            "address": "0xdCf7226458Ec8785ea474334AF5fff25E90fA70e",
            "username": "dcf",
            "profileImage": "https://storage.googleapis.com/opensea-static/opensea-profile/5.png"
        },
        {
            "address": "0xEF9EFf0479d57032cda12e0d6bBEDb55B9b8c9E7",
            "username": "DC9",
            "profileImage": "https://storage.googleapis.com/opensea-static/opensea-profile/7.png"
        },
        {
            "address": "0x478680c5B1c6378451DebAFcD65AF4827236DC3b",
            "username": "dc3b",
            "profileImage": "https://i.seadn.io/gae/ygEJ5aMACq65IVfBThOPSn7ioGXCeMuWgs4Sn9Sifxr0hphEm1FYtVCpTe9ToIaP3qsT9dNY1Ow-8NXCaJBiBPWFrouKZnP0Wz4PxBs?w=500\u0026auto=format"
        }
    ],
    "tokens": [
        {
            "identifier": {
                "pricingID": "decentralized-finance"
            },
            "name": "Decentralized Finance",
            "symbol": "dcf"
        }
    ]
}
 */
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

  async fetchAddress(address: string): Promise<AddressResponse> {
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
  }

  async searchEntities(query: string): Promise<SearchEntityResponse> {
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
  }
}
