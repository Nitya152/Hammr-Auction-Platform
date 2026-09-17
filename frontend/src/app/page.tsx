"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

type Auction = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  currentHighest: number;
  startingPrice: number;
  startTime: string;
  endTime: string;
  status: "LIVE" | "SCHEDULED" | "CLOSED";
  seller?: { name: string };
};

const money = (value: number) =>
  `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function Countdown({ endAt }: { endAt: string }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () => setRemaining(new Date(endAt).getTime() - Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  if (remaining <= 0) return <span className="text-red-400">Closed</span>;
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return (
    <span>
      {hours > 24
        ? `${Math.floor(hours / 24)}d ${hours % 24}h`
        : `${hours}h ${minutes}m`}{" "}
      left
    </span>
  );
}

export default function Home() {
  const [flashingId, setFlashingId] = useState<string | null>(null);
  const router = useRouter();
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All lots");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<any>(null);

  // Fetch real auctions and user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${api}/auctions`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Auction[]) => {
        if (data.length) setAuctions(data);
      })
      .catch((err) => console.error("Failed to fetch auctions:", err));
  }, []);
  // --- REAL-TIME WEBSOCKET LISTENER ---
  useEffect(() => {
    // Don't connect until the initial fetch has populated the auctions
    if (auctions.length === 0) return;

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    );

    socket.on("connect", () => {
      console.log("🟢 Connected to live auction WebSocket!");

      // Join the "room" for every auction currently loaded
      auctions.forEach((auction) => {
        socket.emit("joinAuction", auction.id);
      });
    });

    // Listen for the 'bidUpdate' event we broadcasted from the backend
    socket.on("bidUpdate", (data) => {
      console.log("⚡ Live bid received:", data);

      // Update the React state instantly
      setAuctions((currentAuctions) =>
        currentAuctions.map((auction) =>
          auction.id === data.auctionId
            ? { ...auction, currentHighest: data.newHighestBid }
            : auction,
        ),
      );
      setFlashingId(data.auctionId);
      setTimeout(() => setFlashingId(null), 1000);
    });

    // Clean up the connection when the user navigates away
    return () => {
      socket.disconnect();
    };
  }, [auctions.length]); // Re-run if the total number of auctions loaded changes
  // ------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.refresh();
  };

  const visible = useMemo(
    () =>
      auctions.filter((auction) => {
        const matchesQuery = `${auction.title} ${auction.description}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "All lots" ||
          (filter === "Live now" && auction.status === "LIVE") ||
          auction.category === filter;
        return matchesQuery && matchesFilter;
      }),
    [auctions, filter, query],
  );

  const placeBid = async (auction: Auction) => {
    if (!user) {
      router.push("/login");
      return;
    }

    // 1. FIXED: Force mathematical addition using Number()
    const currentHigh = Number(auction.currentHighest);

    // Optional safeguard: If currentHigh is 0, add 10 to the starting price instead
    const basePrice =
      currentHigh > 0 ? currentHigh : Number(auction.startingPrice || 0);
    const nextBid = basePrice + 10;

    const token = localStorage.getItem("token");

    try {
      // 2. NOTE: Ensure your endpoint is correct here!
      // If your backend routes are under /api, this should be /api/bids or /api/auctions
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/bids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ auctionId: auction.id, amount: nextBid }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place bid");

      // Update local state smoothly
      setAuctions((current) =>
        current.map((item) =>
          item.id === auction.id ? { ...item, currentHighest: nextBid } : item,
        ),
      );
      setNotice(`Bid placed successfully on ${auction.title}!`);
      setTimeout(() => setNotice(""), 3500);
    } catch (err: any) {
      setNotice(err.message);
    }
  };

  return (
    <div className="bg-black text-neutral-100 min-h-screen selection:bg-white selection:text-black font-sans">
      <div className="max-w-7xl mx-auto px-8 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="flex justify-between items-center py-6 border-b border-neutral-800">
          <a
            className="text-xl font-black text-white tracking-tight flex items-center gap-2 cursor-pointer"
            href="/"
          >
            <span className="bg-white text-black w-7 h-7 inline-flex items-center justify-center rounded font-black text-sm">
              H
            </span>{" "}
            hammr
          </a>

          <nav className="hidden md:flex gap-8">
            <a
              className="text-sm font-medium text-white transition hover:text-neutral-300"
              href="#browse"
            >
              Browse auctions
            </a>
            <a
              className="text-sm font-medium text-neutral-400 transition hover:text-white"
              href="#how"
            >
              How it works
            </a>
            {(user?.role === "SELLER" || user?.role === "ADMIN") && (
              <a
                className="text-sm font-medium text-neutral-400 transition hover:text-white"
                href="/create-auction"
              >
                Host auction
              </a>
            )}
            {user?.role === "ADMIN" && (
              <a
                className="text-sm font-medium text-purple-400 transition hover:text-purple-300"
                href="/admin"
              >
                Admin Panel
              </a>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/profile")}
                  className="text-xs border border-neutral-800 bg-neutral-900 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition"
                >
                  Profile ({user.role})
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs border border-neutral-800 bg-neutral-900 px-3 py-2 rounded-lg text-neutral-400 hover:text-white transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/login")}
                  className="border border-neutral-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-900 transition"
                >
                  Log in
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-200 transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Intro Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end py-16 gap-8">
          <div>
            <p className="text-xs tracking-widest text-neutral-500 font-bold mb-4 uppercase">
              THE GOOD STUFF, IN MOTION
            </p>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Objects with a past.
              <br />
              <span className="font-serif font-normal text-neutral-400 italic">
                Maybe your next one.
              </span>
            </h1>
            <p className="text-neutral-400 max-w-lg text-base leading-relaxed">
              A considered auction house for pieces worth keeping. Bid on
              something with a story, or start one of your own.
            </p>
          </div>
          <div className="border border-neutral-800 p-6 rounded-xl relative bg-neutral-950 flex flex-col min-w-[200px]">
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-4 right-4 shadow-[0_0_8px_#22c55e]" />
            <strong className="text-4xl font-black mb-1">
              {auctions.length}
            </strong>
            <span className="text-xs text-neutral-500 leading-snug">
              live auctions
              <br />
              right now
            </span>
          </div>
        </section>

        {/* Market Toolbar */}
        <section
          className="flex flex-col gap-6 py-8 border-t border-b border-neutral-800 mb-12"
          id="browse"
        >
          <div className="flex bg-neutral-900 p-1 rounded-lg w-fit border border-neutral-800">
            <button
              className={`px-5 py-2 text-xs font-semibold rounded-md transition ${mode === "buyer" ? "bg-neutral-800 text-white" : "text-neutral-400"}`}
              onClick={() => setMode("buyer")}
            >
              I&apos;m buying
            </button>
            <button
              className={`px-5 py-2 text-xs font-semibold rounded-md transition ${mode === "seller" ? "bg-neutral-800 text-white" : "text-neutral-400"}`}
              onClick={() => {
                if (!user || user.role !== "SELLER" || user.role !== "ADMIN") {
                  setNotice(
                    "You must be logged in as a Seller to access Seller Studio.",
                  );
                  return;
                }
                setMode("seller");
              }}
            >
              I&apos;m selling
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-4 text-neutral-500 text-lg">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search objects, makers, categories"
              className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3.5 pl-12 rounded-xl text-sm text-white outline-none focus:border-neutral-600 transition"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {["All lots", "Live now", "Design", "Home", "Collectibles"].map(
              (item) => (
                <button
                  key={item}
                  className={`px-4 py-2 rounded-full text-xs transition border ${filter === item ? "bg-white text-black border-white font-semibold" : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600"}`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </section>

        {/* Notice Banner */}
        {notice && (
          <div className="bg-amber-950/40 border border-amber-800/60 text-amber-200 px-6 py-4 rounded-xl flex justify-between items-center mb-8 text-sm">
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              className="text-amber-200 text-lg font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Dynamic Mode Switch (Buyer vs Seller Studio) */}
        {mode === "seller" ? (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-neutral-950 border border-neutral-800 p-10 rounded-2xl mb-16">
            <div className="md:col-span-2">
              <p className="text-xs tracking-widest text-neutral-500 font-bold mb-3 uppercase">
                SELLER STUDIO
              </p>
              <h2 className="text-3xl font-bold mb-4">
                Your next listing starts here.
              </h2>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                Bring items worth keeping. Set your parameters, host your live
                auction, and let active bidders compete.
              </p>
              <button
                className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-neutral-200 transition"
                onClick={() => router.push("/create-auction")}
              >
                Create a listing <span>→</span>
              </button>
            </div>
            <div className="flex flex-col justify-center gap-6 border-l border-neutral-800 pl-8">
              <div>
                <strong className="text-3xl font-black block mb-1">
                  Active
                </strong>
                <span className="text-xs text-neutral-500">
                  Seller Dashboard Enabled
                </span>
              </div>
              <div>
                <strong className="text-3xl font-black block mb-1">
                  Secure
                </strong>
                <span className="text-xs text-neutral-500">
                  Prisma Atomic Transactions
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {visible.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500">
                No active auctions found matching your criteria.
              </div>
            ) : (
              visible.map((auction) => (
                <article
                  key={auction.id}
                  onClick={(e) => {
                    // Prevent redirect if the user clicked the 'Place bid' button
                    if ((e.target as HTMLElement).closest("button")) return;
                    router.push(`/auction/${auction.id}`);
                  }}
                  className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col transition hover:border-neutral-700"
                >
                  <div className="relative h-64 bg-neutral-900">
                    {auction.imageUrl ? (
                      <img
                        src={auction.imageUrl}
                        alt={auction.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 font-medium">
                        No image preview
                      </div>
                    )}
                    <span
                      className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        auction.status === "CLOSED" ||
                        new Date(auction.endTime).getTime() <= Date.now()
                          ? "bg-black/70 text-red-400 border-red-500/20"
                          : auction.status === "LIVE"
                            ? "bg-black/70 text-emerald-400 border-emerald-500/20"
                            : "bg-black/70 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {auction.status === "CLOSED" ||
                      new Date(auction.endTime).getTime() <= Date.now()
                        ? "Closed"
                        : auction.status === "LIVE"
                          ? "Live now"
                          : "Scheduled"}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider flex gap-2 mb-2">
                      <span>{auction.category}</span>
                      <span>·</span>
                      <span>{auction.seller?.name || "Verified Seller"}</span>
                    </div>

                    <h2 className="text-xl font-bold mb-2 text-white">
                      {auction.title}
                    </h2>
                    <p className="text-neutral-400 text-sm mb-6 line-clamp-2 flex-grow">
                      {auction.description}
                    </p>

                    <div className="flex justify-between items-center py-4 border-t border-neutral-900 mb-4">
                      <div>
                        <span className="text-[11px] text-neutral-500 block mb-1 uppercase tracking-wider">
                          Current bid
                        </span>
                        <strong
                          className={`text-lg font-black px-2 py-0.5 rounded transition-colors duration-700 ${
                            flashingId === auction.id
                              ? "bg-emerald-500/40 text-emerald-100"
                              : "bg-transparent text-white"
                          }`}
                        >
                          {money(
                            auction.currentHighest || auction.startingPrice,
                          )}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-neutral-500 block mb-1 uppercase tracking-wider">
                          Closes in
                        </span>
                        <strong className="text-sm font-medium text-neutral-300">
                          <Countdown endAt={auction.endTime} />
                        </strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-900">
                      <span className="text-xs text-neutral-500">
                        Verified Listing
                      </span>
                      <button
                        className="bg-neutral-900 border border-neutral-800 text-white px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition hover:bg-white hover:text-black hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={auction.status !== "LIVE"}
                        onClick={() => placeBid(auction)}
                      >
                        {auction.status === "LIVE"
                          ? "Place bid ($+10)"
                          : "Not live"}
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {/* Closing Note */}
        <section className="text-center py-16 border-t border-neutral-800">
          <p className="text-xs tracking-widest text-neutral-500 font-bold mb-3 uppercase">
            THE HAMMR PROMISE
          </p>
          <h2 className="text-4xl font-extrabold mb-6">
            Good things find
            <br />
            <span className="font-serif font-normal text-neutral-400 italic">
              the right home.
            </span>
          </h2>
          <a
            href="#browse"
            className="text-sm font-bold text-white inline-flex items-center gap-2 border-b border-white pb-0.5 hover:text-neutral-300"
          >
            Explore all auctions <span>↗</span>
          </a>
        </section>

        {/* Footer */}
        <footer className="flex justify-between items-center py-8 border-t border-neutral-800 text-xs text-neutral-500 mt-auto">
          <span>© 2026 hammr. All rights reserved.</span>
          <span>Built for production deployment.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
