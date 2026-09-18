"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send mfaCode only if the user is in the MFA step
        body: JSON.stringify({
          email,
          password,
          mfaCode: needsMfa ? mfaCode : undefined,
        }),
      });

      const data = await res.json();

      // 👇 ADD THIS: If response is not ok, display the backend error message (Wrong password, invalid code, etc.)
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.mfaRequired) {
        // Step 1 Passed, but 2FA is required
        setNeedsMfa(true);
        return;
      }

      if (data.token) {
        // Step 2 Passed (or 2FA wasn't enabled) - Complete Login
        // 1. Save the token
        localStorage.setItem("token", data.token);

        // 2. Save the user object
        localStorage.setItem("user", JSON.stringify(data.user));

        // 3. Redirect to the homepage
        window.location.href = "/";
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-black p-8 rounded-lg border border-neutral-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Log in to Hammr</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-100 rounded">
            {error}
          </div>
        )}

        {!needsMfa ? (
          <>
            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded bg-neutral-900 border border-neutral-700 text-white"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm text-neutral-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 rounded bg-neutral-900 border border-neutral-700 text-white"
              />
            </div>
          </>
        ) : (
          <div className="mb-6">
            <label className="block text-sm text-neutral-400 mb-2">
              Authenticator Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              placeholder="000000"
              className="w-full p-3 rounded bg-neutral-900 border border-neutral-700 text-white tracking-widest text-center text-lg"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Open Microsoft Authenticator to get your code.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-bold"
        >
          {needsMfa ? "Verify Code" : "Log In"}
        </button>
      </form>
    </div>
  );
}
