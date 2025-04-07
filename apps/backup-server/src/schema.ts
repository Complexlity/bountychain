import {
    integer
} from "drizzle-orm/sqlite-core";
import { Address } from "viem";
import { z } from "zod";

const sqliteBoolean = integer({ mode: "boolean" });

export * from '@repo/db/schema';

export const completeBountySchema = z.object({
  hash: z
    .string()
    .startsWith("0x")
    .transform((val): Address => val as Address),
  bountyId: z
    .string()
    .startsWith("0x")
    .transform((val): Address => val as Address),
  submissionId: z.coerce.number(),
  tokenType: z.string(),
});
