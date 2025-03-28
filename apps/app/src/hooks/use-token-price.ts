import { supportedChains, SupportedChainKey } from "@/lib/viem";
import { GetTokenPriceResponseAdapter } from "@moralisweb3/common-evm-utils";
import { useQuery } from "@tanstack/react-query";

interface TokenPriceParams {
  tokenType:
    | keyof (typeof supportedChains)[SupportedChainKey]["contracts"]
    | undefined;
  chain: keyof typeof supportedChains;
  enabled?: boolean;
}

async function fetchTokenPrice({
  tokenType,
  chain,
}: Omit<TokenPriceParams, "enabled">) {
  if (!tokenType || !chain) {
    throw new Error("Token type or chain not provided");
  }
  const params = new URLSearchParams({
    tokenType,
    chain,
  });

  const response = await fetch(`/api/tokenPrice?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch token price");
  }

  return response.json() as unknown as GetTokenPriceResponseAdapter["raw"];
}

export function useTokenPrice({
  tokenType,
  chain,
  enabled = true,
}: TokenPriceParams) {
  return useQuery({
    queryKey: ["tokenPrice", tokenType, chain],
    queryFn: () => fetchTokenPrice({ tokenType, chain }),
    enabled: Boolean(tokenType && chain && enabled),
  });
}
