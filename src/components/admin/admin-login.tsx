"use client";

import { useState } from "react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.reload();
        return;
      }

      // The server distinguishes a wrong password from "not configured" and
      // "too many attempts"; the old form flattened all three to "Invalid
      // password", which sent someone to reset a password that was correct.
      const data = await res.json().catch(() => ({}));
      setError(
        res.status === 401
          ? "That is not the password."
          : (data.error ?? `Sign-in failed (${res.status}).`)
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ad-login">
      <div className="ad-login-box">
        <span className="ad-wordmark">
          <b>Maaz</b>
          <span className="sg-micro">/ desk</span>
        </span>
        <form onSubmit={handleSubmit} noValidate>
          <label className="ad-label" htmlFor="ad-password">
            Password
          </label>
          <input
            id="ad-password"
            className="ad-field ad-mono"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            autoComplete="current-password"
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "ad-password-err" : undefined}
            data-invalid={error ? "true" : undefined}
          />
          {error && (
            <span className="sg-error sg-mono" id="ad-password-err" role="alert">
              {error}
            </span>
          )}
          <button
            type="submit"
            className="sg-cta"
            data-fill="true"
            disabled={loading || !password}
          >
            {loading ? "…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
