import { createConfig, http } from "wagmi";
import { SupportedChainKey, supportedChains } from "@shared/viem";
import { mainnet } from "viem/chains";

const activeChain =
  supportedChains[process.env.NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey];

export const wagmiConfig = createConfig({
  chains: [activeChain.chain],
  //@ts-expect-error: This is valid
  transports: {
    [activeChain.chain.id]: http(),
  },
});

export const ensNameConfig = createConfig({
  chains: [mainnet], 
  transports: {
    [mainnet.id]: http()
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
