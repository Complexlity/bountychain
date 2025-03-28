import { useEffect } from "react";
import { Address, isAddress } from "viem";
import {
  useAccount,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { SupportedChainKey, supportedChains } from "@/lib/viem";
// import { useGasAmountEstimate } from '..';

type PayBountyArgs = {
  bountyId: string;
  submissionId: number;
  winnerAddress: Address;
  callerAddress: Address;
  tokenType: keyof (typeof supportedChains)[SupportedChainKey]["contracts"];
};

export const usePayBounty = (
  {
    bountyId,
    submissionId,
    winnerAddress,
    callerAddress,
    tokenType,
  }: PayBountyArgs,
  options?: {
    onSend?: (txHash: `0x${string}`) => void;
    onSuccess?: (txHash: Address) => Promise<void>;
    onError?: (err: unknown) => void;
  }
) => {
  const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey;
  const { chain } = useAccount();
  const enabled =
    !!bountyId &&
    !!winnerAddress &&
    !!submissionId &&
    isAddress(winnerAddress) &&
    isAddress(callerAddress);

  const { address: contractAddress, abi: bountyAbi } =
    supportedChains[activeChain].contracts[tokenType];

  const { data } = useSimulateContract({
    chainId: chain?.id,
    account: callerAddress,
    address: contractAddress,
    abi: bountyAbi,
    functionName: "payBounty",
    args: [bountyId as Address, winnerAddress],
    query: { enabled },
  });

  const {
    data: txHash,
    isPending: isWaiting,
    isError: isSendingError,
    isSuccess: isSendingSuccess,
    writeContract: _sendPayBountyTransaction,
  } = useWriteContract();

  const sendPayBountyTransaction =
    !!data && !!_sendPayBountyTransaction
      ? () => _sendPayBountyTransaction(data.request)
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
    error,
  } = useWaitForTransactionReceipt({ chainId: chain?.id, hash: txHash });


  useEffect(() => {
    if (!!txReceipt && !!txHash && isSuccess) {
      options?.onSuccess?.(txHash);
    }
  }, [isSuccess]);

  const isError = isSendingError || isConfirmingError;

  useEffect(() => {
    if (isError) {
      options?.onError?.(error);
    }
  }, [isError]);
  const isPending = isWaiting || isConfirming;
  return {
    isPending,
    isWaiting,
    isConfirming,
    isSuccess,
    isError,
    txHash,
    txReceipt,
    sendPayBountyTransaction,
  };
};
