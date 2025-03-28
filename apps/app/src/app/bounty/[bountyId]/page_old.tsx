"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useBounty } from "@/features/bounties/hooks/bounties";
import { usePayBounty } from "@/features/bounties/hooks/use-pay-bounty";
import {
  CreateBountySubmissionSchema,
  WithSignature,
} from "@/features/bounties/lib/types";
import { toast } from "@/hooks/use-toast";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HandCoins, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { Address, isAddress } from "viem";
import { useAccount, useSignMessage } from "wagmi";

type Props = {
  bounty: NonNullable<ReturnType<typeof useBounty>["data"]>;
};

export default function Page({ params }: { params: { bountyId: string } }) {
  const { bountyId } = params;
  const router = useRouter();
  invariant(bountyId, "Bounty Id is not defined");

  const { data: bounty, isLoading, isError } = useBounty(bountyId);

  useEffect(() => {
    if (!bountyId) {
      router.push("/bounties");
      return;
    }
  }, [bountyId]);

  useEffect(() => {
    if (!isLoading && (!bounty || isError)) {
      router.push("/bounties");
    }
  }, [isLoading, bounty, isError]);

  if (!bountyId || isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div></div>;
  }

  if (!bounty) {
    return <div></div>;
  }

  return <Bounty bounty={bounty} />;
}

function Bounty({ bounty }: Props) {
  const [newSubmission, setNewSubmission] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const { address } = useAccount();
  const { signMessageAsync: signMessage } = useSignMessage();
  const queryClient = useQueryClient();
  const bountyId = bounty.id;
  const { openConnectModal } = useConnectModal();

  const { mutate: createSubmission, isPending } = useMutation({
    mutationKey: ["createBountySubmission"],
    mutationFn: async (data: WithSignature<CreateBountySubmissionSchema>) => {
      const res = await fetch(`/api/submission/${bountyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw result;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounty", bountyId] });
      toast({
        title: "Submission added successfully",
      });
      setNewSubmission("");
    },
    onError: (error) => {
      toast({
        title: "Error creating bounty submisson",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !isAddress) {
      if (!!openConnectModal) {
        openConnectModal();
      } else return;
    }

    if (!newSubmission) {
      toast({
        variant: "destructive",
        title: "Submission Required",
        description: "Please provide a description of your solution",
      });
      return;
    }

    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to submit a solution",
      });
      return;
    }
    const submission: CreateBountySubmissionSchema = {
      bountyId,
      submissionDescription: newSubmission,
      creator: address,
    };
    setIsSigning(true);
    const signature = await signMessage({
      message: JSON.stringify(submission),
    });
    setIsSigning(false);
    createSubmission({ ...submission, signature, address });
  };

  const submissions = bounty.submissions;
  const userHasSubmitted = submissions.some(
    (submission) => submission.creator === address
  );
  return (
    <div className="container mx-auto grid max-w-[70ch] gap-8 px-4 py-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-center text-5xl font-bold">{bounty.title}</h1>
        <div>
          <div className="flex items-center justify-center gap-2">
            <span className="flex items-center gap-1">
              Creator
              <UserIcon className="h-4 w-4" />-<span>{bounty.creator}</span>
            </span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <span className="flex items-center gap-1">
              Reward
              <HandCoins className="h-4 w-4" />
            </span>
            -
            <span className="text-3xl font-bold text-green-600">
              {bounty.amount} ETH
            </span>
          </div>
        </div>
        <div>{bounty.description}</div>
      </div>

      {!userHasSubmitted && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit Your Solution</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid w-full gap-4">
                <Textarea
                  placeholder="Describe your solution or provide a link to your work"
                  value={newSubmission}
                  onChange={(e) => setNewSubmission(e.target.value)}
                  required
                />
                <Button type="submit" isLoading={isPending || isSigning}>
                  Submit Solution
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <h2 className="text-center text-4xl font-bold">
        Submissions ({submissions.length})
      </h2>
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          bounty={bounty}
        />
      ))}
    </div>
  );
}

function SubmissionCard({
  submission,
  bounty,
}: {
  submission: {
    id: number;
    creator: string;
    createdAt: Date;
    updatedAt: Date;
    bountyId: string;
    isComplete: boolean | null;
    submissionDescription: string;
  };
  bounty: {
    creator: string;
    status: string;
  };
}) {
  const { address } = useAccount();
  const bountyStatus = bounty.status;
  const bountyCreator = bounty.creator;

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div>
            <CardTitle>{submission.creator}</CardTitle>
            <CardDescription>
              {submission.createdAt.toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>{submission.submissionDescription}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        {bountyStatus == "ongoing" && address && address === bountyCreator && (
          <PayButton
            bountyId={submission.bountyId}
            submissionId={submission.id}
            winnerAddress={submission.creator as Address}
            callerAddress={address}
          >
            Mark as Correct
          </PayButton>
        )}
      </CardFooter>
    </Card>
  );
}

function PayButton({
  bountyId,
  submissionId,
  winnerAddress,
  callerAddress,
  children,
}: {
  bountyId: string;
  submissionId: number;
  winnerAddress: Address;
  callerAddress: Address;
  children: React.ReactNode;
}) {
  const { mutateAsync: updateBounty, isPending: isSavingToDb } = useMutation({
    mutationKey: ["payBounty"],
    mutationFn: async (txHash: Address) => {
      const res = await fetch(`/api/bounty/${bountyId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash: txHash,
          submissionId,
          bountyId,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw result;
      }
      return result;
    },
    onError: () => {
      //TODO: Retry this, or save for later. Handle bad db updates somehow.
      console.log("Failed to update bounty");
    },
  });
  const queryClient = useQueryClient();

  const { isPending, sendPayBountyTransaction: payBounty } = usePayBounty(
    { bountyId, submissionId, winnerAddress, callerAddress, tokenType: "eth" },
    {
      onSuccess: async (txHash: Address) => {
        await updateBounty(txHash);
        queryClient.invalidateQueries({ queryKey: ["bounty", bountyId] });
      },
      onError: (e) => {
        console.error(e);
        toast({
          title: "Something went wrong paying bounty",
        });
      },
    }
  );
  return (
    <Button
      isLoading={isSavingToDb || isPending}
      variant="outline"
      onClick={payBounty}
    >
      {children}
    </Button>
  );
}
