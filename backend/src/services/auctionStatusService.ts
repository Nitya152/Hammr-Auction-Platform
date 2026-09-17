import { AuctionStatus } from "@prisma/client";

export function getAuctionStatus(
  startTime: Date,
  endTime: Date,
  now = new Date(),
): AuctionStatus {
  const nowMs = now.getTime();
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();

  if (nowMs < startMs) {
    return "SCHEDULED";
  }

  if (nowMs >= endMs) {
    return "CLOSED";
  }

  return "LIVE";
}
