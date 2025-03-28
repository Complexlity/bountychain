import { get, post } from "@/features/bounties/api/bounties";
import { NextRequest } from "next/server";

export const revalidate = 2;
export const GET = async () => {
  const res = await get();
  return new Response(JSON.stringify(res));
};

export const POST = async (request: NextRequest) => {
  const res = await post({ request });
  if ("statusCode" in res && res.statusCode) {
    const { statusCode, ...rest } = res;
    return new Response(JSON.stringify(rest), {
      status: statusCode,
    });
  }
  return new Response(JSON.stringify(res));
};
