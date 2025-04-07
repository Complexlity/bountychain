import {
  getPublicClient,
  type SupportedChainKey,
  supportedChains,
} from "@shared/viem";
import { NextRequest } from "next/server";
import { type Address, decodeEventLog } from "viem";
import { z } from "zod";
import { completeBounty } from "../lib/queries";
import { isZeroAddress } from "../lib/utils";
import serverEnv from "@/lib/server-env";

const completeBountySchema = z.object({
  hash: z
    .string()
    .startsWith("0x")
    .transform((val): Address => val as Address),
  bountyId: z
    .string()
    .startsWith("0x")
    .transform((val): Address => val as Address),
  submissionId: z.coerce.number(),
  tokenType: z.string(),
});

export const post = async ({ request }: { request: NextRequest }) => {
  const formData = await request.json();
  const { hash, bountyId, submissionId, tokenType } =
    completeBountySchema.parse(formData);
  const activeChain = serverEnv.NEXT_PUBLIC_ACTIVE_CHAIN;
  const txReceipt = await getPublicClient(activeChain).getTransactionReceipt({
    hash,
  });
  const type =
    (tokenType as keyof (typeof supportedChains)[SupportedChainKey]["contracts"]) ??
    "eth";
  const { abi: bountyAbi } = supportedChains[activeChain].contracts[type];
  const logs = txReceipt.logs;
  let decoded;
  for (const log of logs) {
    try {
      decoded = decodeEventLog({
        abi: bountyAbi,
        data: log.data,
        eventName: "BountyPaid",
        topics: log.topics,
      });
    } catch (error) {
      console.log(error);
      console.log("I errrored");
    }
  }

  if (
    decoded &&
    "bountyId" in decoded.args &&
    !isZeroAddress(decoded.args.bountyId)
  ) {
    await completeBounty(bountyId, submissionId);
    return { message: "ok" };
  }
  return { message: "Something went wrong" };
};
