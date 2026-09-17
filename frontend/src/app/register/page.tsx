"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("SELLER");
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Save token and user data to localStorage automatically
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black text-white">
      <form
        onSubmit={handleRegister}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-96 border border-gray-800"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Join Hammr</h2>

        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-6 bg-indigo-950/30 border border-indigo-500/40 p-4 rounded-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center justify-between">
            <span>Account Role</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
              Required
            </span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 bg-neutral-900 border border-indigo-500/50 rounded-lg text-white text-sm outline-none focus:border-indigo-400 transition cursor-pointer font-medium"
          >
            <option value="SELLER" className="bg-neutral-900 text-white">
              Seller (Host Auctions)
            </option>
            <option value="BUYER" className="bg-neutral-900 text-white">
              Buyer (Place Bids)
            </option>
          </select>
          <p className="text-[11px] text-neutral-400 mt-2">
            {role === "SELLER"
              ? "✨ Default selected: You can host and list items."
              : "🛒 Selected: You can search and place bids on lots."}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-white text-black font-bold py-2 px-4 rounded hover:bg-gray-200 transition mb-4"
        >
          Create Account
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
