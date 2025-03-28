import { post } from "@/features/bounties/api/bounty.bountyid.complete";
import { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const res = await post({ request });
  return new Response(JSON.stringify(res), {
    status: 200,
  });
};
