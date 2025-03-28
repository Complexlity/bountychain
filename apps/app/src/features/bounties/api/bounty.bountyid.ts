import invariant from "tiny-invariant";
import { getBounty } from "../lib/queries";

export async function get({ params }: { params: { bountyId: string } }) {
  // Handle GET request
  invariant(params.bountyId, "Missing bountyId param");
  const bounty = await getBounty(params.bountyId); // Fetch bounties from the database
  if (!bounty) {
    return {
      message: `Bounty with id ${params.bountyId} not found`,
    };
  }
  return bounty;
}
