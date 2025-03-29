"use client";

import MaxWidthWrapper from "@/components/max-width-wrapper";
import { GradientSpinner } from "@/components/ui/gradient-spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BountyCard } from "@/features/bounties/components/bounty-card";
import { CreateBountyDialog } from "@/features/bounties/components/create-bounty-dialog";
import FloatingButton from "@/features/bounties/components/floating-button";
import { useBounties } from "@/features/bounties/hooks/bounties";
import { SupportedChainKey, supportedChains } from "@shared/viem";
import { useMemo, useState } from "react";

export default function BountiesPage() {
  const { data, isPending } = useBounties();
  const [status, setStatus] = useState("ongoing");
  const [selectedToken, setSelectedToken] = useState("all");

  const activeChainId =
    supportedChains[process.env.NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey]
      .chain.id;

  // Get unique tokens from bounties
  const uniqueTokens = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((bounty) => bounty.token))).sort();
  }, [data]);

  // Filter bounties based on both status and token
  const filteredBounties = useMemo(() => {
    if (!data) return [];
    return data.filter((bounty) => {
      const statusMatch = status === "all" || bounty.status === status;
      const tokenMatch =
        selectedToken === "all" || bounty.token === selectedToken;
      const chainMatch = bounty.chainId === activeChainId;
      return statusMatch && tokenMatch && chainMatch;
    });
  }, [data, status, selectedToken, activeChainId]);

  return (
    <MaxWidthWrapper className="relative max-w-[1200px] py-8 flex-1 flex flex-col">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl sm:text-3xl font-bold dark:text-white">
          {isPending
            ? "Bounties"
            : status === "all"
            ? "All Bounties"
            : status === "ongoing"
            ? "Ongoing"
            : "Completed"}{" "}
          {!isPending ? `(${filteredBounties?.length})` : ""}
        </h1>
        <div className="flex gap-4">
          {isPending ? (
            <>
              <Skeleton className="sm:w-[180px] rounded-none h-9" />
              <Skeleton className="sm:w-[180px] rounded-none h-9" />
            </>
          ) : (
            <>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value)}
              >
                <SelectTrigger className="sm:w-[180px] rounded-none dark:text-white">
                  <SelectValue placeholder="Filter By Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Bounty Status</SelectLabel>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={selectedToken}
                onValueChange={(value) => setSelectedToken(value)}
              >
                <SelectTrigger className="sm:w-[180px] rounded-none dark:text-white">
                  <SelectValue placeholder="Filter By Token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Token Type</SelectLabel>
                    <SelectItem value="all">All Tokens</SelectItem>
                    {uniqueTokens.map((token) => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-8 items-center justify-center flex-1">
          <GradientSpinner />
          <p>Getting Bounties...</p>
        </div>
      ) : filteredBounties && filteredBounties.length > 0 ? (
        <div className="grid justify-center gap-6 py-2 md:grid-cols-2 lg:grid-cols-3 grid-flow-row">
          {filteredBounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <p className="text-lg text-gray-500">
            No bounties match the selected filters
          </p>
        </div>
      )}

      <CreateBountyDialog>
        <FloatingButton />
      </CreateBountyDialog>
    </MaxWidthWrapper>
  );
}
