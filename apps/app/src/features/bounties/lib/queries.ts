"server-only";

/* eslint-disable import/no-unresolved */
import db from "@/db2";
import {
  bounties,
  insertBountiesSchema,
  insertSubmissionsSchema,
  submissions,
} from "@/db2/schema";
import * as z from "zod";
import { eq, and } from "drizzle-orm";

type CreateBountySchema = z.infer<typeof insertBountiesSchema>;
type CreateSubmissionSchema = z.infer<typeof insertSubmissionsSchema>;

export async function getBounties() {
  const bounties = await db.query.bounties.findMany({});
  return bounties;
}

export async function createBounty(newBounty: CreateBountySchema) {
  const [insertted] = await db.insert(bounties).values(newBounty).returning();
  return insertted;
}

export async function getBounty(id: string) {
  const bounty = await db.query.bounties.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
    with: {
      submissions: true,
    },
  });
  return bounty;
}

export async function completeBounty(bountyId: string, submissionId: number) {
  const bounty = await db
    .update(bounties)
    .set({ status: "complete" })
    .where(eq(bounties.id, bountyId))
    .returning();
  //Where bountyId = submissions.bountyId and submissionId = submissions.id
  const submission = await db
    .update(submissions)
    .set({ isComplete: true })
    .where(
      and(eq(submissions.bountyId, bountyId), eq(submissions.id, submissionId))
    )
    .returning();
  return { bounty, submission };
}

export async function getBountySubmissions(id: string) {
  const submissions = await db.query.submissions.findMany({
    where(fields, operators) {
      return operators.eq(fields.bountyId, id);
    },
  });
  return submissions;
}

export async function createBountySubmission(
  newSubmission: CreateSubmissionSchema
) {
  //Insert only if bounty status is ongoing
  const bounty = await db.query.bounties.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, newSubmission.bountyId);
    },
  });

  if (!bounty || bounty.status !== "ongoing") {
    return null;
  }
  const [insertted] = await db
    .insert(submissions)
    .values(newSubmission)
    .returning();
  return insertted;
}
