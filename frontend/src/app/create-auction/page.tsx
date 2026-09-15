"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateAuctionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "SELLER") {
      alert("Access denied. Only sellers can host auctions.");
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auctions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          category,
          startingPrice: Number(startingPrice),
          reservePrice: Number(reservePrice),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create auction");

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Host a New Auction</h1>
      {error && (
        <div className="bg-red-900 text-red-200 p-3 rounded mb-4">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-gray-900 p-6 rounded-lg border border-gray-800"
      >
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-gray-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-gray-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-gray-700"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Starting Price ($)</label>
            <input
              type="number"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Reserve Price ($)</label>
            <input
              type="number"
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-white text-black font-bold py-2 rounded hover:bg-gray-200 transition"
        >
          Publish Auction
        </button>
      </form>
    </div>
  );
}
