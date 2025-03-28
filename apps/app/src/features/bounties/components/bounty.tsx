"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TruncatedAddress } from "@/components/ui/truncated-address";
import { useTokenPrice } from "@/hooks/use-token-price";
import { SupportedChainKey, supportedChains } from "@/lib/viem";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { type Bounty } from "../lib/types";
import { SubmissionCard } from "./submission";
import { SubmitSolution } from "./submission-form";

export function Bounty({ bounty }: { bounty: Bounty }) {
  const [expandedSubmissionIndex, setExpandedSubmissionIndex] = useState<
    number | null
  >(null);
  const { address } = useAccount();
  const isCreator = address === bounty.creator;
  const isOngoing = bounty.status === "ongoing";

  const { data: tokenPrice } = useTokenPrice({
    tokenType:
      bounty.token as keyof (typeof supportedChains)[SupportedChainKey]["contracts"],
    chain: process.env.NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey,
  });

  const handleSubmissionToggle = (index: number) => {
    setExpandedSubmissionIndex(
      expandedSubmissionIndex === index ? null : index
    );
  };

  const submissions = bounty.submissions ?? [];
  const userSubmission = submissions.find(
    (submission) => submission.creator === address
  );
  const completedSubmissions = submissions.filter(
    (submission) => submission.isComplete && submission.creator !== address
  );
  const otherSubmissions = submissions.filter(
    (submission) => !submission.isComplete && submission.creator !== address
  );

  const userHasSubmitted = !!userSubmission;

  return (
    <div className="w-full max-w-3xl mx-auto bg-background/50 backdrop-blur-sm rounded-lg">
      <div className="p-4 sm:p-8 flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-4">
          {/* Header with Title and Status */}
          <div className="flex items-start justify-between relative">
            <div className="flex items-center justify-center absolute top-[60%] -left-4 sm:-left-7 md:-left-14 -translate-y-1/2">
              <Link href="/bounties">
                <button>
                  <ArrowLeft className="h-6 w-6 md:h-8 md:w-8" />
                  <span className="sr-only">Back to bounties</span>
                </button>
              </Link>
            </div>
            <div className="flex-1 px-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">
                {bounty.title}
              </h1>
            </div>
            <Badge
              variant={isOngoing ? "default" : "secondary"}
              className={`flex-shrink-0 ${
                isOngoing
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {bounty.status}
            </Badge>
          </div>

          {/* Creator Info */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>Creator</span>
            </div>
            <div className="flex items-center gap-2">
              {isCreator ? (
                <Badge variant="outline">You</Badge>
              ) : (
                <TruncatedAddress address={bounty.creator} />
              )}
              {/* <div className="flex-shrink-0">
                <CopyButton text={bounty.creator} />
              </div> */}
            </div>
          </div>

          {/* Reward Info */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-500 whitespace-nowrap">
              {bounty.amount} {bounty.token.toUpperCase()}
            </span>
            {tokenPrice && (
              <span className="bg-[#191D200f] rounded-sm px-1 py-[1px] whitespace-nowrap text-[#191D20b3] text-xs font-bold">
                ({(tokenPrice.usdPrice * bounty.amount).toFixed(2)} USD)
              </span>
            )}
            <Badge
              variant="outline"
              className="text-emerald-500 border-emerald-500"
            >
              Reward
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Description */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {bounty.description}
          </p>
          <Separator className="bg-gray-400/50" />

          {/* Submit Solution Section */}
          {!isCreator && !userHasSubmitted && isOngoing && (
            <>
              <SubmitSolution bounty={bounty} />
              <Separator className="bg-gray-400/50" />
            </>
          )}

          {/* Submissions Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold">
              Submissions ({submissions.length})
            </h2>

            <div className="space-y-4">
              {/* Completed submissions */}
              {completedSubmissions.map((submission, index) => (
                <SubmissionCard
                  key={`completed-${index}`}
                  callerAddress={address!}
                  submission={submission}
                  tokenType={
                    bounty.token as keyof (typeof supportedChains)[SupportedChainKey]["contracts"]
                  }
                  isExpanded={
                    expandedSubmissionIndex === submissions.indexOf(submission)
                  }
                  onToggle={() =>
                    handleSubmissionToggle(submissions.indexOf(submission))
                  }
                  isCreator={isCreator}
                  isOngoing={isOngoing}
                />
              ))}

              {/* User's submission */}
              {userSubmission && (
                <SubmissionCard
                  callerAddress={address!}
                  tokenType={
                    bounty.token as keyof (typeof supportedChains)[SupportedChainKey]["contracts"]
                  }
                  submission={userSubmission}
                  isExpanded={
                    expandedSubmissionIndex ===
                    submissions.indexOf(userSubmission)
                  }
                  onToggle={() =>
                    handleSubmissionToggle(submissions.indexOf(userSubmission))
                  }
                  isCreator={isCreator}
                  isOngoing={isOngoing}
                />
              )}

              {/* Other ongoing submissions */}
              {otherSubmissions.map((submission, index) => (
                <SubmissionCard
                  key={`ongoing-${index}`}
                  callerAddress={address!}
                  submission={submission}
                  tokenType={
                    bounty.token as keyof (typeof supportedChains)[SupportedChainKey]["contracts"]
                  }
                  isExpanded={
                    expandedSubmissionIndex === submissions.indexOf(submission)
                  }
                  onToggle={() =>
                    handleSubmissionToggle(submissions.indexOf(submission))
                  }
                  isCreator={isCreator}
                  isOngoing={isOngoing}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
