import axios from "axios";

export class EtherscanClient {
  private apiKey: string;
  private baseUrl: string;
  private lastRequestTime: number = 0;
  private inFlightRequests: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  private readonly minTimeBetweenRequests: number;
  private readonly maxConcurrentRequests: number;

  constructor(
    apiKey: string,
    options: {
      minTimeBetweenRequests?: number;
      maxConcurrentRequests?: number;
    } = {}
  ) {
    this.apiKey = apiKey;
    this.baseUrl = this.getBaseUrl();
    this.minTimeBetweenRequests = options.minTimeBetweenRequests || 200; // Etherscan's free tier allows 5 requests per second
    this.maxConcurrentRequests = options.maxConcurrentRequests || 5;
  }

  private getBaseUrl(): string {
    return "https://api.etherscan.io/v2/api";
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

  /**
   * Get contract ABI for a verified contract
   * @param address The contract address
   */
  async getContractABI(address: string): Promise<string> {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          module: "contract",
          action: "getabi",
          address,
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(`Failed to get contract ABI: ${response.data.message}`);
      }

      return response.data.result;
    });
  }

  /**
   * Get contract source code for a verified contract
   * @param address The contract address
   */
  async getContractSourceCode(address: string, chainid: number): Promise<any> {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          chainid,
          module: "contract",
          action: "getsourcecode",
          address,
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          `Failed to get contract source code for ${address} on chain ${chainid}: ${response.data.message}`
        );
      }

      return response.data.result[0];
    });
  }

  /**
   * Verify a proxy contract
   * @param address The proxy contract address
   * @param expectedImplementation Optional expected implementation address
   */
  async verifyProxyContract(
    address: string,
    chainid: number,
    expectedImplementation?: string
  ): Promise<string> {
    return this.makeRequest(async () => {
      const params: any = {
        chainid,
        module: "contract",
        action: "verifyproxycontract",
        address,
        apikey: this.apiKey,
      };

      if (expectedImplementation) {
        params.expectedimplementation = expectedImplementation;
      }

      const response = await axios.post(this.baseUrl, null, { params });

      if (response.data.status !== "1") {
        throw new Error(
          `Failed to verify proxy contract: ${response.data.message}`
        );
      }

      return response.data.result;
    });
  }

  /**
   * Check proxy contract verification status
   * @param guid The verification GUID
   */
  async checkProxyVerification(guid: string, chainid: number): Promise<string> {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          chainid,
          module: "contract",
          action: "checkproxyverification",
          guid,
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          `Failed to check proxy verification: ${response.data.message}`
        );
      }

      return response.data.result;
    });
  }

  /**
   * Get contract name from verified source code
   * @param address The contract address
   */
  async getContractName(address: string, chainid: number): Promise<string> {
    const sourceCode = await this.getContractSourceCode(address, chainid);
    if (!sourceCode.ContractName) {
      return "Unknown";
    }

    return sourceCode.ContractName;
  }

  /**
   * Get contract creator and creation transaction hash
   * @param address The contract address
   */
  async getContractCreator(
    address: string,
    chainid: number
  ): Promise<{ creator: string; txHash: string }> {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          chainid,
          module: "contract",
          action: "getcontractcreation",
          contractaddresses: address,
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          `Failed to get contract creator: ${response.data.message}`
        );
      }

      const result = response.data.result[0];
      return {
        creator: result.contractCreator,
        txHash: result.txHash,
      };
    });
  }

  /**
   * Get contract source code verification status
   * @param address The contract address
   */
  async getContractVerificationStatus(
    address: string,
    chainid: number
  ): Promise<{
    verified: boolean;
    verificationDate?: string;
    compilerVersion?: string;
  }> {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          chainid,
          module: "contract",
          action: "getcontractverificationstatus",
          address,
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          `Failed to get verification status: ${response.data.message}`
        );
      }

      const result = response.data.result;
      return {
        verified: result.verified === "1",
        verificationDate: result.verificationDate,
        compilerVersion: result.compilerVersion,
      };
    });
  }

  /**
   * Get contract bytecode
   * @param address The contract address
   */
  async getContractBytecode(address: string, chainid: number): Promise<string> {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          chainid,
          module: "proxy",
          action: "eth_getCode",
          address,
          tag: "latest",
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          `Failed to get contract bytecode: ${response.data.message}`
        );
      }

      return response.data.result;
    });
  }

  /**
   * Get contract storage at a specific position
   * @param address The contract address
   * @param position The storage position
   */
  async getContractStorage(
    address: string,
    position: string,
    chainid: number
  ): Promise<string> {
    return this.makeRequest(async () => {
      const response = await axios.get(this.baseUrl, {
        params: {
          chainid,
          module: "proxy",
          action: "eth_getStorageAt",
          address,
          position,
          tag: "latest",
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          `Failed to get contract storage: ${response.data.message}`
        );
      }

      return response.data.result;
    });
  }
}
