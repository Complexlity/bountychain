import {
  getPublicClient,
  SupportedChainKey,
  supportedChains,
} from "@shared/viem";
import { useMutation } from "@tanstack/react-query";
import { Address } from "viem";
import { useWriteContract } from "wagmi";

export const usePayBountyAsync = ({
  writeContractAsync,
  onSuccess,
}: {
  writeContractAsync: ReturnType<typeof useWriteContract>["writeContractAsync"];
  onSuccess?: (txHash: Address) => void;
}) => {
  return useMutation({
    mutationFn: async (options: {
      bountyId: string;
      winnerAddress: Address;
      callerAddress: Address;
      tokenType: keyof (typeof supportedChains)[SupportedChainKey]["contracts"];
    }) => {
      const { bountyId, winnerAddress, callerAddress } = options;
      const activeChain = process.env
        .NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey;
      const publicClient = getPublicClient(activeChain);
      const { address: contractAddress, abi: bountyAbi } =
        supportedChains[activeChain].contracts[options.tokenType];

      const { request } = await publicClient.simulateContract({
        account: callerAddress,
        address: contractAddress,
        abi: bountyAbi,
        functionName: "payBounty",
        args: [bountyId as Address, winnerAddress],
      });

      if (!request) {
        throw new Error("Could not simulate contract");
      }

      const hash = await writeContractAsync(request);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
      console.log(receipt.transactionHash);
      return { hash };
    },
    onSuccess: (data) => {
      onSuccess?.(data.hash);
    },
    onError: () => {
      alert("Something went wrong");
      return;
    },
  });
};
