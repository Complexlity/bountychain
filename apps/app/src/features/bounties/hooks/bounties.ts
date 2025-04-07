"use client";

import { useQuery } from "@tanstack/react-query";
import { getBounties, getBounty } from "@/features/bounties/lib/queries";

export function useBounties() {
  return useQuery<Awaited<ReturnType<typeof getBounties>>>({
    queryKey: ["bounties"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/bounties");
        if (!res.ok) {
          throw new Error("Failed to fetch bounties");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching bounties:", error);
        return [];
      }
    },
  });
}

export function useBounty(id: string) {
  return useQuery<Awaited<ReturnType<typeof getBounty>> | null>({
    queryKey: ["bounty", id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/bounty/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch bounty");
        }
        return res.json();
      } catch (error) {
        console.error(`Error fetching bounty with id ${id}:`, error);
        return null;
      }
    },
    enabled: !!id,
    refetchOnMount: true,
  });
}
