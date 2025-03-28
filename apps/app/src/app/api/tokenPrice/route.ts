import { NextRequest, NextResponse } from "next/server";
import Moralis from "moralis";
import serverEnv from "@/lib/server-env";
import { SupportedChainKey, supportedChains } from "@/lib/viem";
import * as z from "zod";

let moralisInitialized = false;
const initializeMoralis = async () => {
  if (!moralisInitialized) {
    await Moralis.start({
      apiKey: serverEnv.MORALIS_API_KEY,
    });
    moralisInitialized = true;
  }
};

const schema = z
  .object({
    chain: z
      .string()
      .refine((val): val is SupportedChainKey => val in supportedChains, {
        message:
          "ACTIVE_CHAIN must be one of the supported chains: " +
          Object.keys(supportedChains).join(", "),
      }),
    tokenType: z.string(),
  })
  .superRefine((input, ctx) => {
    const chain = input.chain;
    const tokenType = input.tokenType;

    if (
      chain &&
      !(tokenType in supportedChains[chain as SupportedChainKey].contracts)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tokenType"],
        message: `Invalid token type for the specified chain, ${chain}`,
      });
    }
  });

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      chain: searchParams.get("chain"),
      tokenType: searchParams.get("tokenType"),
    };

    const result = schema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        {
          errors: result.error.errors.map((e) => ({
            message: e.message,
            path: e.path,
          })),
        },
        { status: 422 }
      );
    }

    // Initialize Moralis
    await initializeMoralis();
    const { chain, tokenType } = result.data;
    const priceAddress =
      supportedChains[chain].contracts[
        tokenType as keyof (typeof supportedChains)[SupportedChainKey]["contracts"]
      ].priceAddress;

    const moralisChain = `0x${supportedChains[
      chain as SupportedChainKey
    ].chain.id.toString(16)}`;

    // Fetch token price
    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain: moralisChain,
      include: "percent_change",
      address: priceAddress,
    });

    return NextResponse.json(response.raw);
  } catch (error) {
    console.error("Token price fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch token price" },
      { status: 500 }
    );
  }
}
