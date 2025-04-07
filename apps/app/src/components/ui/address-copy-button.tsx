"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ensNameConfig } from "@/lib/wagmi-config";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useEnsName } from 'wagmi';


export function AddressCopyButton({ 
  text, 
  className 
}: { 
  text: string, 
  className?: string 
}) {
  const [copied, setCopied] = useState(false);
  const { data: ensName } = useEnsName({
    address: text as `0x${string}`,
    query: {
      enabled: !!text
    },
    config: ensNameConfig
  }); 

  const copyToClipboard = async (textToCopy: string) => {
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If no ENS name, use the original simple button
  if (!ensName) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 ${className}`}
        onClick={() => copyToClipboard(text)}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // If ENS name exists, show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
              <Button
                  
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${className}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <div className="flex items-center">
              <Copy className="h-4 w-4 mr-1" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard(text);
          }}
        >
          Address
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard(ensName);
          }}
        >
          ENS
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}