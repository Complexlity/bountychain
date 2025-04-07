import { type SupportedChainKey, supportedChains } from "@shared/viem";
import { useReadContract } from "wagmi";
import { type Address, erc20Abi, formatUnits } from "viem";
import { formatBalance } from "@/lib/utils";

type UseUserBalanceProps = {
  tokenType:
    | keyof (typeof supportedChains)[SupportedChainKey]["contracts"]
    | undefined;
  chain: keyof typeof supportedChains;
  userAddress: Address | undefined;
};

export const useUserBalance = ({
  tokenType,
  chain,
  userAddress,
}: UseUserBalanceProps) => {
  const enabled =
    !!userAddress && !!chain && !!tokenType && tokenType !== "eth";
  const { token: tokenAddress } =
    supportedChains[chain].contracts[tokenType ?? "eth"];
  const chainId = supportedChains[chain].chain.id;
  const tokenDecimals =
    supportedChains[chain].contracts[tokenType ?? "eth"].decimals;
  const parameters = {
    chainId,
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "balanceOf",
    args: [userAddress],
    query: {
      enabled,
    },
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  const { data, ...rest } = useReadContract(parameters);
  let tokenBalance = 0;
  if (data) {
    //@ts-expect-error: data could be string or number but it actually would work
    tokenBalance = formatBalance(formatUnits(data, tokenDecimals));
  }
  return { data: tokenBalance, ...rest };
};
