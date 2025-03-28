import { ImageResponse } from "next/og";
import { getBounty } from "@/features/bounties/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(
  request: Request,
  { params }: { params: { bountyId: string } }
) {
  try {
    const bounty = await getBounty(params.bountyId);
    if (!bounty) {
      return new Response("Bounty not found", { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#030712",
            padding: "10px 30px",
          }}
        >
          {/* Gradient Background */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              background:
                "radial-gradient(circle at 25% 25%, rgba(124, 58, 237, 0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)",
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%",
              padding: "60px",
              backgroundColor: "rgba(17, 24, 39, 0.8)",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 60,
                fontFamily: "Inter Bold",
                color: "white",
                marginBottom: "20px",
                lineHeight: 1.2,
              }}
            >
              {bounty.title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 32,
                fontFamily: "Inter Regular",
                color: "#9CA3AF",
                marginBottom: "40px",
                lineHeight: 1.4,
              }}
            >
              {bounty.description.length > 140
                ? bounty.description.substring(0, 140) + "..."
                : bounty.description}
              {/* Hello from this side */}
            </div>

            {/* Amount and Token */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "rgba(124, 58, 237, 0.1)",
                padding: "16px 24px",
                borderRadius: "12px",
                border: "1px solid rgba(124, 58, 237, 0.2)",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontFamily: "Inter Bold",
                  color: "#C4B5FD",
                  display: "flex",
                  gap: "4px",
                }}
              >
                <span>{bounty.amount.toString()}</span>
                <span>{bounty.token.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
