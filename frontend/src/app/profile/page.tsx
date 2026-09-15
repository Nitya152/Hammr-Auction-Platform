"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  if (!user)
    return (
      <div className="p-10 text-center text-white bg-black min-h-screen">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-400 hover:text-white mb-6 flex items-center gap-2"
        >
          &larr; Back to Marketplace
        </button>

        <h1 className="text-3xl font-bold mb-6">Account Profile</h1>

        <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider block">
                Assigned System Role
              </span>
              <span className="text-lg font-bold text-blue-400">
                {user.role}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs uppercase tracking-wider block">
                Account Status
              </span>
              <span className="text-green-400 text-sm font-semibold">
                Active & Verified
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                localStorage.clear();
                router.push("/login");
              }}
              className="w-full bg-red-900/30 border border-red-800 text-red-300 font-bold py-2.5 rounded-lg hover:bg-red-900/50 transition"
            >
              Sign Out of All Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
