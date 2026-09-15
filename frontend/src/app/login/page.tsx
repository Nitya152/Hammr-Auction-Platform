"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempData, setTempData] = useState<any>(null);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // Step 1: Verify Credentials
  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Save temporary data and move to 2FA verification step
      setTempData(data);
      setStep("2fa");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Step 2: Verify 2FA Code
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // For demo purposes, we accept '123456' as the correct 2FA code
    if (otp !== "123456") {
      setError('Invalid 2FA verification code. Try "123456".');
      return;
    }

    // Finalize authentication
    localStorage.setItem("token", tempData.token);
    localStorage.setItem("user", JSON.stringify(tempData.user));
    router.push("/");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-96 border border-gray-800">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Sign in to Hammr
        </h2>
        <p className="text-gray-400 text-xs text-center mb-6">
          {step === "credentials"
            ? "Enter your account credentials"
            : "Two-Factor Authentication (2FA)"}
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-lg mb-4 text-xs">
            {error}
          </div>
        )}

        {step === "credentials" ? (
          <form onSubmit={handleInitialLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-white text-black font-bold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Continue to 2FA
            </button>

            <p className="text-center text-xs text-gray-400 mt-2">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:underline">
                Register
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="flex flex-col gap-4">
            <div className="bg-blue-950/40 border border-blue-900 p-3 rounded-lg text-xs text-blue-300">
              Simulated security code sent to your authenticator app. <br />
              <strong className="text-white">Hint: Use code 123456</strong>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-gray-300">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center tracking-widest text-lg font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg transition text-sm"
            >
              Verify & Sign In
            </button>

            <button
              type="button"
              onClick={() => setStep("credentials")}
              className="text-xs text-gray-400 hover:text-white text-center mt-1"
            >
              &larr; Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
