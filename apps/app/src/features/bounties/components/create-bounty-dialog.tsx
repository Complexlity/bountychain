"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { insertBountiesSchema } from "@/db/schema";
import { useCreateBountyNative } from "@/features/bounties/hooks/use-create-bounty-native";
import { toast } from "@/hooks/use-toast";
import { useTokenPrice } from "@/hooks/use-token-price";
import { SupportedChainKey, supportedChains } from "@/lib/viem";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, erc20Abi, formatEther, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { z } from "zod";
import { useApproveToken } from "../hooks/use-approve-token";
import { useCreateBountyErc20 } from "../hooks/use-create-bounty-erc20";
import { useUserBalance } from "../hooks/use-user-balance";
import { createBounty } from "../lib/queries";
import { formatBalance } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title not provided",
  }),
  description: z.string().min(1, {
    message: "Description not provided",
  }),
  amount: z.coerce
    .number({
      required_error: "Amount not provided",
      invalid_type_error: "Amount must be a number",
    })
    .positive({
      message: "Amount must be greater than 0",
    }),
  currency: z.string({
    required_error: "Please select a currency",
  }),
});

type CreateBountySchema = z.infer<typeof insertBountiesSchema>;
export function CreateBountyDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { isConnected } = useAccount();
  const [container, setContainer] = useState(null);
  const { openConnectModal } = useConnectModal();
  const { address, chain } = useAccount();
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      currency: undefined,
    },
  });

  const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey;
  const currentChain = supportedChains[activeChain];
  const supportedTokens = Object.keys(
    currentChain.contracts
  ) as (keyof (typeof supportedChains)[SupportedChainKey]["contracts"])[];
  const {} = currentChain.contracts;
  const currentCurrency = form.getValues().currency as
    | "eth"
    | "usdc"
    | undefined;
  const chainContract = currentChain.contracts[currentCurrency ?? "eth"];

  const isNotEth = !!(
    form.getValues().amount &&
    currentCurrency &&
    currentCurrency !== "eth"
  );

  const {
    data: allowance,
    isLoading: isGettingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    abi: erc20Abi,
    address: chainContract?.token,
    functionName: "allowance",
    args: [address as Address, chainContract?.address],
    query: {
      enabled: isNotEth && !!address,
    },
  });

  const {
    data: userTokenBalance,
    isLoading: isFetchingUserTokenBalance,
    refetch: refetchUserTokenBalance,
  } = useUserBalance({
    chain: activeChain,
    tokenType: currentCurrency,
    userAddress: address,
  });
  const {
    data: nativeBalance,
    isLoading: isFetchingNativeUserBalance,
    refetch: refetchNativeBalance,
  } = useBalance({
    address,
    blockTag: "latest",
    chainId: currentChain.chain.id,
  });

  const ethBalance = formatBalance(
    Number(formatEther(nativeBalance?.value ?? 0n))
  );

  const currentBalance =
    currentCurrency === "eth"
      ? ethBalance
      : userTokenBalance
      ? userTokenBalance
      : 0;

  const isBalanceLoading =
    currentCurrency === "eth"
      ? isFetchingNativeUserBalance
      : isFetchingUserTokenBalance;

  const amount = form.watch("amount");
  const hasInsufficientBalance =
    currentCurrency && !isBalanceLoading
      ? Number(amount) > currentBalance
      : false;

  useEffect(() => {
    if (!isBalanceLoading) {
      if (hasInsufficientBalance) {
        form.setError("amount", {
          type: "manual",
          message: "Amount exceeds available balance",
        });
      } else {
        form.clearErrors("amount");
      }
    } else {
      form.clearErrors("amount");
    }
  }, [hasInsufficientBalance, form, currentBalance, isBalanceLoading]);


  const currency = form.watch("currency");
  useEffect(() => {
    if (currentCurrency === "eth") {
      refetchNativeBalance();
    } else if (currentCurrency) {
      refetchUserTokenBalance();
    }
  }, [currency, currentCurrency]);

  const { mutate: sendDataToBackupServer } = useMutation({
    mutationKey: ["backupBounty"],
    mutationFn: async (data: CreateBountySchema) => {
      const baseUrl = process.env.NEXT_PUBLIC_BACKUP_SERVER;
      const res = await fetch(`${baseUrl}/bounties`, {
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
      const returned = result as Awaited<ReturnType<typeof createBounty>>;
      return returned;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      queryClient.refetchQueries({ queryKey: ["bounties"] });
      form.reset();
      toast({
        title: "Bounty created on backup",
        description:
          "Please wait an hour for the bounty to be created on main db",
      });
      setOpen(false);
      router.push(`/`);
    },
    onError: async (error, data) => {
      sendDataToBackupServer(data);
      toast({
        title: "Error creating bounty",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const { mutate: sendDataToDb, isPending: isSendingDataToDb } = useMutation({
    mutationKey: ["createBounty"],
    mutationFn: async (data: CreateBountySchema) => {
      const res = await fetch("/api/bounties", {
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
      const returned = result as Awaited<ReturnType<typeof createBounty>>;
      return returned;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      queryClient.refetchQueries({ queryKey: ["bounties"] });
      form.reset();
      toast({
        title: "Bounty created successfully",
      });
      setOpen(false);
      router.push(`/bounty/${data.id}`);
    },
    onError: async (error, data) => {
      sendDataToBackupServer(data);
      toast({
        title: "Error creating bounty",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { writeContractAsync } = useWriteContract();

  const {
    mutateAsync: createBountyOnChainNative,
    isPending: isCreatingBountyOnchainNative,
  } = useCreateBountyNative({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    writeContractAsync,
  });
  const {
    mutateAsync: createBountyOnChainErc20,
    isPending: isCreatingBountyOnchainErc20,
  } = useCreateBountyErc20({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    writeContractAsync,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!address || !chain) {
      toast({
        title: "Address not found. Please connect your wallet",
        variant: "destructive",
      });
      setOpen(false);
      return;
    }
    if (!currentCurrency) {
      toast({
        title: "Please select a currency",
        variant: "destructive",
      });
      setOpen(false);
      return;
    }
    const bountyData = {
      title: values.title,
      description: values.description,
      amount: Number(values.amount),
      token: currentCurrency,
      creator: address,
      chainId: supportedChains[activeChain].chain.id,
    };

    const createBountyOnChain =
      currentCurrency === "eth"
        ? createBountyOnChainNative
        : createBountyOnChainErc20;

    const { bountyId } = await createBountyOnChain({
      amount: values.amount,
      tokenType: currentCurrency,
    }).catch((e) => {
      toast({
        title: "Something went wrong creating bounty",
        description: e.message,
        variant: "destructive",
      });
      return { bountyId: null, hash: null };
    });

    if (bountyId) {
      const data: CreateBountySchema = { ...bountyData, id: bountyId };
      sendDataToDb(data);
    }
  };

  const { sendApproveTransaction, isConfirming, isWaiting } = useApproveToken(
    activeChain,
    currentCurrency,
    form.getValues().amount,
    {
      onSuccess: () => {
        refetchAllowance();
      },
    }
  );

  const {
    data: tokenPrice,
    refetch: refetchTokenPrice,
    isRefetching: isRefetchingTokenPrice,
  } = useTokenPrice({
    tokenType: currentCurrency,
    chain: activeChain,
  });

  const usdValue = tokenPrice?.usdPrice ? amount * tokenPrice.usdPrice : null;

  const hasEnoughAllowance =
    allowance &&
    Number(allowance) >=
      Number(parseUnits(`${form.getValues().amount}`, chainContract?.decimals));

  return (
    <div>
      <Dialog open={open && isConnected} onOpenChange={setOpen}>
        <DialogTrigger
          asChild
          onClick={!isConnected ? openConnectModal : () => {}}
        >
          {children ? children : <Button>Create Bounty</Button>}
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px] rounded-none sm:rounded-none z-[60]"
          portalContainer={container}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-3xl">
                Create New Bounty
              </DialogTitle>

              <DialogDescription className="text-center">
                Fill in the details for your new bounty.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 rounded-none"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-none"
                          placeholder="title for your bounty"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="rounded-none min-h-[100px] resize-y"
                          placeholder="Provide detailed information about your bounty..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={(e) => {
                          refetchTokenPrice();
                          field.onChange(e);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-none">
                            <SelectValue
                              placeholder="Select currency"
                              className="text-gray-600 italic "
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[61]">
                          {supportedTokens.map((token) => (
                            <SelectItem
                              key={`supportedToken-${token}`}
                              value={token}
                            >
                              {token.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {currentCurrency && (
                        <p className="text-sm text-muted-foreground">
                          Balance:{" "}
                          {(
                            currentCurrency === "eth"
                              ? isFetchingNativeUserBalance
                              : isFetchingUserTokenBalance
                          ) ? (
                            <Loader2 className="inline ease animate-spin w-4 h-4 ml-1" />
                          ) : (
                            <>
                              {currentBalance} {currentCurrency.toUpperCase()}
                            </>
                          )}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-none"
                          type="number"
                          placeholder="amount to be paid"
                          {...field}
                        />
                      </FormControl>

                      {usdValue && amount > 0 ? (
                        isRefetchingTokenPrice ? (
                          <p className="px-1 pb-2">
                            <Loader2 className="ease animate-spin w-4 h-4" />
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            ≈ $
                            {usdValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            USD
                          </p>
                        )
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isNotEth && !hasEnoughAllowance ? (
                  <Button
                    type="button"
                    className="rounded-none"
                    isLoading={isWaiting || isConfirming || isGettingAllowance}
                    onClick={sendApproveTransaction}
                  >
                    Approve {form.getValues().currency.toUpperCase()}
                  </Button>
                ) : (
                  <Button
                    className="rounded-none"
                    isLoading={
                      isSendingDataToDb ||
                      isCreatingBountyOnchainNative ||
                      isCreatingBountyOnchainErc20
                    }
                    type="submit"
                    disabled={hasInsufficientBalance}
                  >
                    Submit
                  </Button>
                )}
              </form>
            </Form>
          </>
        </DialogContent>
        <div
          // @ts-expect-error: ref accepts set state action
          ref={setContainer}
          className="dialog-portal"
        />
      </Dialog>
    </div>
  );
}
