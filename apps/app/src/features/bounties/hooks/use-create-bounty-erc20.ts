import {
  getPublicClient,
  SupportedChainKey,
  supportedChains,
} from "@shared/viem";
import { useMutation } from "@tanstack/react-query";
import { Address, decodeEventLog, parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";

export const useCreateBountyErc20 = ({
  writeContractAsync,
}: {
  writeContractAsync: ReturnType<typeof useWriteContract>["writeContractAsync"];
}) => {
  const { address } = useAccount();
  return useMutation({
    mutationFn: async ({
      amount,
      tokenType,
    }: {
      amount: number;
      tokenType: keyof (typeof supportedChains)[SupportedChainKey]["contracts"];
    }) => {
      if (tokenType === "eth") {
        throw new Error("ETH is not supported here");
      }

      const activeChain = process.env
        .NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey;
      const publicClient = getPublicClient(activeChain);
      const {
        address: contractAddress,
        decimals,
        abi: bountyAbi,
      } = supportedChains[activeChain].contracts[tokenType];

      const depositAmount = parseUnits(`${amount}`, decimals);

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        account: address,
        abi: bountyAbi,
        functionName: "createBounty",
        args: [depositAmount],
      });

      if (!request) {
        throw new Error("Could not simulate contract");
      }

      const hash = await writeContractAsync(request);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
      let decoded = null;
      for (const log of receipt.logs) {
        try {
          decoded = decodeEventLog({
            abi: bountyAbi,
            data: log.data,
            eventName: "BountyCreated",
            topics: log.topics,
          });
        } catch (error) {
          console.log(error);
          console.log("I errrored");
        }
      }
      if (decoded) {
        const bountyId = decoded.args.bountyId as Address;
        return { bountyId, hash };
      }
      return { bountyId: null, hash };
    },
  });
};
