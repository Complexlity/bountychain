import { supportedChains } from "@/lib/viem";
import { useEffect } from "react";
import { Address, erc20Abi, TransactionReceipt } from "viem";
import {
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

/**
 * Prepares and submits an `approve` transaction for a token to the TWAB rewards contract
 * @param options optional callbacks
 * @returns
 */
export const useApproveToken = (
  chainName: keyof typeof supportedChains,
  tokenSymbol:
    | keyof (typeof supportedChains)[typeof chainName]["contracts"]
    | undefined
    | (string & {}),
  amount: number,
  options?: {
    onSend?: (txHash: `0x${string}`) => void;
    onSuccess?: (txReceipt: TransactionReceipt) => void;
    onError?: () => void;
  }
): {
  isWaiting: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
  txHash?: Address;
  txReceipt?: TransactionReceipt;
  sendApproveTransaction?: () => void;
} => {
  const currentChain = supportedChains[chainName];
  const { address: contractAddress, token: tokenAddress } =
    //@ts-expect-error: tokenSymbol could be undefined but query would be disabled in that case
    currentChain.contracts[tokenSymbol] ?? {
      address: undefined,
      token: undefined,
      decimals: 18,
    };
  const chainId = currentChain.chain.id;
  const depositAmount = BigInt(2) ** BigInt(256) - BigInt(1); // Maximum ethereum approval amount
  // const depositAmount = !!amount
  //   ? parseUnits(`${amount}`, tokenDecimals as number)
  //   : 0n;
  // const depositAmount = parseUnits(
  //   `${MAX_APPROVAL_AMOUNT}`,
  //   tokenDecimals as number
  // );

  const enabled =
    !!chainName &&
    !!tokenSymbol &&
    !!amount &&
    !!contractAddress &&
    !!tokenAddress;

  const { data } = useSimulateContract({
    chainId,
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [contractAddress as Address, depositAmount],
    query: { enabled },
  });

  const {
    data: txHash,
    isPending: isWaiting,
    isError: isSendingError,
    isSuccess: isSendingSuccess,
    writeContract: _sendApproveTransaction,
  } = useWriteContract();

  const sendApproveTransaction =
    !!data && !!_sendApproveTransaction
      ? () => _sendApproveTransaction(data.request)
      : undefined;

  useEffect(() => {
    if (!!txHash && isSendingSuccess) {
      options?.onSend?.(txHash);
    }
  }, [isSendingSuccess]);

  const {
    data: txReceipt,
    isFetching: isConfirming,
    isSuccess,
    isError: isConfirmingError,
  } = useWaitForTransactionReceipt({ chainId, hash: txHash });

  useEffect(() => {
    if (!!txReceipt && isSuccess) {
      options?.onSuccess?.(txReceipt);
    }
  }, [isSuccess]);

  const isError = isSendingError || isConfirmingError;

  useEffect(() => {
    if (isError) {
      options?.onError?.();
    }
  }, [isError]);

  return {
    isWaiting,
    isConfirming,
    isSuccess,
    isError,
    txHash,
    txReceipt,
    sendApproveTransaction,
  };
};
