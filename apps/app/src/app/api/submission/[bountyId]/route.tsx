import { get, post } from "@/features/bounties/api/submission.bountyid";
import { NextRequest } from "next/server";

// Loader function handles GET requests
export const GET = async (
  _: NextRequest,
  {
    params,
  }: {
    params: Promise<{ bountyId: string }>;
  }
) => {
  const bountyId = (await params).bountyId;
  const res = await get({ params: { bountyId } });
  return new Response(JSON.stringify(res), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (request: NextRequest) => {
  const res = await post({ request });
  return new Response(JSON.stringify(res), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
