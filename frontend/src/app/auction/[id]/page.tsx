"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";

type Bid = {
  id: string;
  amount: number;
  bidder: { name: string };
};

export default function AuctionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashing, setFlashing] = useState(false);
  const [user, setUser] = useState<any>(null);
  // Fetch users
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);
  // 3. Delete handler
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this auction?"))
      return;

    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${api}/auctions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete auction");

      router.push("/");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting the auction. Please check your permissions.");
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      try {
        // Fetch the individual auction details
        const auctionRes = await fetch(`${api}/auctions/${id}`);
        const auctionData = await auctionRes.json();
        setAuction(auctionData);

        // Fetch the bid history (sorted highest to lowest from your backend)
        const bidsRes = await fetch(`${api}/bids/${id}`);
        const bidsData = await bidsRes.json();
        setBids(bidsData);
      } catch (err) {
        console.error("Failed to fetch auction details", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  // Real-time WebSocket listener for this specific page
  useEffect(() => {
    if (!auction || auction.status === "CLOSED") return;

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    );

    socket.on("connect", () => {
      socket.emit("joinAuction", id);
    });

    socket.on("bidUpdate", (data) => {
      if (data.auctionId === id) {
        // Update the current highest price
        setAuction((prev: any) => ({
          ...prev,
          currentHighest: data.newHighestBid,
        }));

        // Flash effect
        setFlashing(true);
        setTimeout(() => setFlashing(false), 1000);

        // Optional: You could also re-fetch the /bids endpoint here
        // to update the history list instantly, or append a mock bid to the state.
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [auction, id]);

  if (loading)
    return <div className="p-20 text-center text-white">Loading item...</div>;
  if (!auction)
    return <div className="p-20 text-center text-white">Item not found.</div>;

  const isClosed =
    auction.status === "CLOSED" ||
    new Date(auction.endTime).getTime() <= Date.now();

  // Since your backend getAuctionBids sorts by amount descending, index 0 is the winner
  const winner = isClosed && bids.length > 0 ? bids[0].bidder.name : null;

  return (
    <div className="bg-black min-h-screen text-white font-sans pt-12 px-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="text-sm font-bold text-neutral-500 hover:text-white transition flex items-center gap-2"
        >
          ← Back to feed
        </button>

        {/* Conditionally render delete button for Admins or the Seller who created it */}
        {user &&
          (user.role === "ADMIN" ||
            (user.role === "SELLER" &&
              auction.sellerId === (user.id || user.userId))) && (
            <button
              onClick={handleDelete}
              className="border border-red-900/50 bg-red-950/20 text-red-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-900/40 transition"
            >
              Delete Auction
            </button>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left: Image */}
          <div className="bg-neutral-900 rounded-3xl aspect-square flex items-center justify-center overflow-hidden border border-neutral-800">
            {auction.imageUrl ? (
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-neutral-600 font-medium">
                No image provided
              </span>
            )}
          </div>

          {/* Right: Details & Winner */}
          <div className="flex flex-col pt-4">
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-3">
              {auction.category}
            </span>
            <h1 className="text-5xl font-black mb-6 tracking-tight">
              {auction.title}
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed mb-10">
              {auction.description}
            </p>

            {/* Status & Price Banner */}
            <div
              className={`p-8 rounded-2xl mb-10 border ${
                isClosed
                  ? "bg-amber-950/20 border-amber-900/50"
                  : "bg-neutral-950 border-neutral-800"
              }`}
            >
              <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">
                {isClosed ? "Final Price" : "Current Bid"}
              </div>
              <div
                className={`text-6xl font-black mb-6 transition-colors duration-700 ${flashing ? "text-emerald-400" : "text-white"}`}
              >
                $
                {Number(
                  auction.currentHighest || auction.startingPrice,
                ).toLocaleString()}
              </div>

              {isClosed ? (
                <div className="pt-6 border-t border-amber-900/50">
                  <strong className="text-amber-500 text-sm uppercase tracking-widest block mb-2">
                    Auction Closed
                  </strong>
                  {winner ? (
                    <div className="text-xl">
                      Winner: <strong className="text-white">{winner}</strong>
                    </div>
                  ) : (
                    <span className="text-neutral-400">
                      No bids were placed.
                    </span>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Now
                </div>
              )}
            </div>

            {/* Bid History */}
            <div>
              <h3 className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-6">
                Bid History
              </h3>
              {bids.length === 0 ? (
                <p className="text-neutral-500 text-sm bg-neutral-950 p-6 rounded-xl border border-neutral-900">
                  No bids have been placed yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {bids.map((bid, index) => (
                    <li
                      key={bid.id}
                      className="flex justify-between items-center text-sm border-b border-neutral-900 pb-4"
                    >
                      <span className="text-neutral-300 font-medium flex items-center gap-2">
                        {index === 0 && isClosed ? "🏆" : ""} {bid.bidder.name}
                      </span>
                      <strong className="text-white font-bold">
                        ${Number(bid.amount).toLocaleString()}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
