"use client";

import { wagmiConfig } from "@/lib/wagmi-config";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "./ui/toaster";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          showRecentTransactions={true}
          appInfo={{ appName: "Bountychain" }}
        >
          {children}
          <ProgressBar
            height="5px"
            color="#3b82f6"
            options={{ showSpinner: false }}
            shallowRouting
          />
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
