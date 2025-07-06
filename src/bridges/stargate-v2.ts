import { ethers } from "ethers";
import { BridgeTransaction, LayerZeroMessage } from "./types";
import { chainMapping } from "./providers/layerzero";

export const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

export async function parseStargateV2Transaction(
  message: LayerZeroMessage,
  provider: ethers.Provider
): Promise<BridgeTransaction | null> {
  try {
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

    return {
      txHash: sourceTx.txHash,
      destTxHash: message.destination?.tx?.txHash,
      bridge: "Stargate V2 (LayerZero)",
      fromChain: sourceNetworkId,
      toChain: chainMapping[message.pathway.dstEid],
      fromToken: tokenAddress,
      toToken: "",
      fromAmount: amount.toString(),
      toAmount: amount.toString(), // Same amount on both chains
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
    console.error("Error parsing Stargate V2 transaction:", error);
    return null;
  }
}

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
