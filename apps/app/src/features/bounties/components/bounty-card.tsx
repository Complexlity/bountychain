"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTokenPrice } from "@/hooks/use-token-price";
import { supportedChains,type SupportedChainKey } from "@shared/viem";

type bounty = {
  id: string;
  creator: string;
  title: string;
  description: string;
  amount: number;
  createdAt: Date;
  token: string;
};

export function BountyCard({ bounty }: { bounty: bounty }) {
  const { data: tokenPrice } = useTokenPrice({
    tokenType:
      bounty.token as keyof (typeof supportedChains)[SupportedChainKey]["contracts"],
    chain: process.env.NEXT_PUBLIC_ACTIVE_CHAIN as SupportedChainKey,
  });
  return (
    <Link href={`/bounty/${bounty.id}`}>
      <div className="group relative h-full w-full  max-w-[350px] cursor-pointer">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 to-green-600 opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200 ">
          Hello{" "}
        </div>

        <Card
          key={bounty.id}
          className="flex relative h-full flex-col overflow-hidden rounded-none leading-none ring-1 ring-gray-900/5"
        >
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 text-center font-bold">
            <CardTitle className="text-xl font-bold">{bounty.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-6">
            <p className="mb-4 flex-1 text-gray-700">
              {bounty.description.length > 200
                ? bounty.description.slice(0, 200) + "..."
                : bounty.description}
            </p>

            <div className="bountys-center flex justify-between">
              <span className="flex items-center gap-1">
                <span className="text-3xl font-bold text-green-600">
                  {bounty.amount}
                </span>
                <span>{bounty.token.toUpperCase()}</span>
                {tokenPrice && (
                  <span className="bg-[#191D200f] rounded-sm px-1 py-1 whitespace-nowrap text-[#191D20b3] text-sm font-medium opacity-100">
                    ({(tokenPrice.usdPrice * bounty.amount).toFixed(2)} USD)
                  </span>
                )}
              </span>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-100 p-4">
            <Link
              className={buttonVariants({
                className: "b mx-auto w-full rounded-none transition-colors",
              })}
              href={`/bounty/${bounty.id}`}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
}
