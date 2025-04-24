import axios from "axios";

export class EtherscanClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = this.getBaseUrl();
  }

  private getBaseUrl(): string {
    return "https://api.etherscan.io/v2/api";
  }

  /**
   * Get contract ABI for a verified contract
   * @param address The contract address
   */
  async getContractABI(address: string): Promise<string> {
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
  }

  /**
   * Get contract source code for a verified contract
   * @param address The contract address
   */
  async getContractSourceCode(address: string, chainid: number): Promise<any> {
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
        `Failed to get contract source code: ${response.data.message}`
      );
    }

    return response.data.result[0];
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
  }

  /**
   * Check proxy contract verification status
   * @param guid The verification GUID
   */
  async checkProxyVerification(guid: string, chainid: number): Promise<string> {
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
  }

  /**
   * Get contract name from verified source code
   * @param address The contract address
   */
  async getContractName(address: string, chainid: number): Promise<string> {
    const sourceCode = await this.getContractSourceCode(address, chainid);
    if (!sourceCode.ContractName) {
      throw new Error("Contract name not found in verified source code");
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
  }

  /**
   * Get contract bytecode
   * @param address The contract address
   */
  async getContractBytecode(address: string, chainid: number): Promise<string> {
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
  }
}
