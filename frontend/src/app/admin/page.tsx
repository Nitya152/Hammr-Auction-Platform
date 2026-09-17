"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuctions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auctions`);
      const data = await res.json();
      setAuctions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "ADMIN") {
      alert("Access denied. Administrator privileges required.");
      router.push("/");
      return;
    }
    fetchAuctions();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this auction?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auctions/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setAuctions(auctions.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete auction");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-white text-center bg-black min-h-screen">
        Loading Admin Panel...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Control Center</h1>
            <p className="text-gray-400 text-sm">
              Manage, audit, and moderate all platform marketplace listings.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="border border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
          >
            &larr; Back to Marketplace
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/40 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Starting Bid</th>
                <th className="p-4">Current Top Bid</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/20 transition"
                >
                  <td className="p-4 font-medium">{a.title}</td>
                  <td className="p-4 text-gray-400 text-sm">{a.category}</td>
                  <td className="p-4 text-gray-300">${a.startingPrice}</td>
                  <td className="p-4 text-green-400 font-semibold">
                    ${a.currentHighest}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded font-bold ${
                        a.status === "LIVE"
                          ? "bg-red-900/40 text-red-400 border border-red-800"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="bg-red-600/20 border border-red-700 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
