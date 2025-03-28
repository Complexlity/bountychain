import { z } from "zod";
import {
  insertBountiesSchema,
  insertSubmissionsSchema,
} from "@/db2/schema";
import { Address } from "viem";
import { getBounty } from "@/features/bounties/lib/queries";

export type CreateBountySchema = z.infer<typeof insertBountiesSchema>;

export type WithSignature<T> = T & { signature: Address; address: Address };
export type CreateBountySubmissionSchema = z.infer<
  typeof insertSubmissionsSchema
>;

export type Bounty = NonNullable<Awaited<ReturnType<typeof getBounty>>>;

export type Submission = Bounty["submissions"][number];
