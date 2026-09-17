export interface ServerToClientEvents {
  "auction:status": (payload: {
    auctionId: string;
    status: "SCHEDULED" | "LIVE" | "CLOSED";
    startTime: string;
    endTime: string;
  }) => void;

  "auction:bid": (payload: {
    auctionId: string;
    bidId: string;
    bidderId: string;
    amount: string;
    placedAt: string;
    currentHighest: string;
  }) => void;

  "auction:extended": (payload: {
    auctionId: string;
    previousEndTime: string;
    endTime: string;
    extensionCount: number;
  }) => void;

  "auction:error": (payload: { message: string }) => void;
}
