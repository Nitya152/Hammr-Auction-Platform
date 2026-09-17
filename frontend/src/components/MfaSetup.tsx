"use client";

import { useState } from "react";

export default function MfaSetup() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const startSetup = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mfa/setup`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to start setup");
    }
  };

  const verifySetup = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mfa/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ token, secret }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setQrCode(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Verification failed");
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-900 text-green-100 rounded">
        Microsoft Authenticator enabled securely!
      </div>
    );
  }

  return (
    <div className="p-6 border border-neutral-800 rounded bg-black">
      <h2 className="text-xl font-bold mb-4 text-white">
        Two-Factor Authentication
      </h2>

      {!qrCode ? (
        <button
          onClick={startSetup}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Link Microsoft Authenticator
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-neutral-300">
            1. Scan this QR code with the Microsoft Authenticator app.
          </p>
          <img
            src={qrCode}
            alt="QR Code"
            className="w-48 h-48 border-4 border-white rounded"
          />

          <p className="text-neutral-300">
            2. Enter the 6-digit code to verify:
          </p>
          <input
            type="text"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 text-white"
            placeholder="000000"
          />
          <button
            onClick={verifySetup}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full"
          >
            Verify & Enable
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}
