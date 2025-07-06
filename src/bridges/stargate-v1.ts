import { ethers } from "ethers";
import { BridgeTransaction, LayerZeroMessage } from "./types";
import { chainMapping } from "./providers/layerzero";
import { ERC20_ABI } from "./stargate-v2";

// Known Stargate Router addresses by chain
const STARGATE_ROUTERS: Record<number, string> = {
  30101: "0x8731d54E9D02c286767d56ac03e8037C07e01e98", // Ethereum
  30102: "0x4a364f8c717cAAD9A442737Eb7b8A55cc6cf18D8", // BSC
  30320: "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd", // Polygon
  30106: "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd", // Avalanche
  30421: "0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614", // Arbitrum
  30110: "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b", // Optimism
  30250: "0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6", // Fantom
};

const tokenMessagingContracts: { [endpointId: string]: string } = {
  "30101": "0x6E3d884C96d640526F273C61dfcF08915eBd7e2B",
  "30109": "0x6CE9bf8CDaB780416AD1fd87b318A077D2f50EaC",
  "30110": "0x19cFCE47eD54a88614648DC3f19A5980097007dD",
  "30111": "0xF1fCb4CBd57B67d683972A59B6a7b1e2E8Bf27E6",
  "30151": "0xcbE78230CcA58b9EF4c3c5D1bC0D7E4b3206588a",
  "30183": "0x5f688F563Dc16590e570f97b542FA87931AF2feD",
  "30181": "0x41B491285A4f888F9f636cEc8a363AB9770a0AEF",
  "30184": "0x5634c4a5FEd09819E3c46D86A965Dd9447d86e47",
  "30177": "0x6B73D3cBbb278Ce2E8698E983AecCdD94Dc4594B",
  "30214": "0x4e422B0aCb2Bd7e3aC70B5c0E5eb806e86a94038",
  "30211": "0x5f688F563Dc16590e570f97b542FA87931AF2feD",
  "30145": "0xAf368c91793CB22739386DFCbBb2F1A9e4bCBeBf",
  "30153": "0xAF54BE5B6eEc24d6BFACf1cce4eaF680A8239398",
  "30332": "0x2086f755A6d9254045C257ea3d382ef854849B0f",
  "30320": "0xB1EeAD6959cb5B9B20417d6689922523B2B86C3",
};

// Known Stargate Pool Registry addresses by chain
const STARGATE_POOL_REGISTRIES: Record<number, string> = {
  30101: "0x9D1B1669c73b033DFe47ae5a0164Ab96df25B944", // Ethereum
  30102: "0x9D1B1669c73b033DFe47ae5a0164Ab96df25B944", // BSC
  30320: "0x9D1B1669c73b033DFe47ae5a0164Ab96df25B944", // Polygon
  30106: "0x9D1B1669c73b033DFe47ae5a0164Ab96df25B944", // Avalanche
  30421: "0x9D1B1669c73b033DFe47ae5a0164Ab96df25B944", // Arbitrum
  30110: "0x9D1B1669c73b033DFe47ae5a0164Ab96df25B944", // Optimism
  30250: "0x9D1B1669c73b033DFe47ae5a0164Ab96df25B944", // Fantom
};

export async function parseStargateTransaction(
  message: LayerZeroMessage,
  provider: ethers.Provider
): Promise<BridgeTransaction | null> {
  try {
    // Get the source transaction
    const sourceTx = message.source.tx;
    if (!sourceTx) return null;

    const sourceNetworkId = chainMapping[message.pathway.srcEid];

    const sourceNetworkProvider = new ethers.AlchemyProvider(
      sourceNetworkId,
      process.env.ALCHEMY_API_KEY
    );

    const contractInterface = new ethers.Interface(ERC20_ABI);
    const receipt = await sourceNetworkProvider.getTransactionReceipt(
      sourceTx.txHash
    );
    if (!receipt) return null;

    // // Get the router contract for the source chain
    // const routerAddress = STARGATE_ROUTERS[message.pathway.srcEid];
    // if (!routerAddress) return null;

    // Create contract instance
    // const routerContract = new ethers.Contract(
    //   routerAddress,
    //   STARGATE_ROUTER_ABI,
    //   provider
    // );

    const parsedEvents = receipt.logs
      .map((log) => {
        try {
          return {
            ...log,
            decoded: contractInterface.parseLog(log),
          };
        } catch {
          return null;
        }
      })
      .filter((event) => event !== null);

    const transferEvents = parsedEvents.filter(
      (event) => event?.decoded?.name === "Transfer"
    );

    // TODO: handle case where there are multiple transfer events

    const transferEvent = transferEvents[0];
    if (!transferEvent) return null;

    const decoded = transferEvent.decoded;

    if (!decoded) return null;
    const { value: amount, from } = decoded.args;
    const tokenAddress = transferEvents[0]?.address;

    const fromSymbol = await getTokenSymbol(
      tokenAddress,
      sourceNetworkProvider
    );

    // // Get token addresses from pool IDs
    // const poolRegistry = new ethers.Contract(
    //   STARGATE_POOL_REGISTRIES[message.pathway.srcEid],
    //   STARGATE_POOL_REGISTRY_ABI,
    //   provider
    // );

    // const fromToken = await poolRegistry.getToken(srcPoolId);
    // const toToken = await poolRegistry.getToken(dstPoolId);

    // Create the bridge transaction object
    return {
      txHash: sourceTx.txHash,
      destTxHash: message.destination?.tx?.txHash,
      bridge: "Stargate V1 (LayerZero)",
      fromChain: sourceNetworkId,
      toChain: chainMapping[message.pathway.dstEid],
      fromToken: tokenAddress,
      toToken: "",
      fromAmount: amount.toString(),
      toAmount: amount.toString(), // Stargate maintains 1:1 ratio
      fromSymbol,
      toSymbol: fromSymbol, // Same symbol on both chains
      sender: from,
      recipient: "",
      timestamp: sourceTx.blockTimestamp,
      status: message.status.name === "DELIVERED" ? "completed" : "pending",
      blockNumber: parseInt(sourceTx.blockNumber),
      destBlockNumber: message.destination?.tx?.blockNumber,
    };
  } catch (error) {
    console.error("Error parsing Stargate transaction:", error);
    return null;
  }
}

// Helper function to get token symbol
async function getTokenSymbol(
  tokenAddress: string,
  provider: ethers.Provider
): Promise<string> {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ["function symbol() view returns (string)"],
      provider
    );
    return await tokenContract.symbol();
  } catch {
    return "";
  }
}
