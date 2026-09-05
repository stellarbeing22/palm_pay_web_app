"use client";

import { useEffect, useState } from "react";
import "./styles.css";

const DEFAULT_RPI_API = "https://fishtank.taile121fd.ts.net";

function normalizeMobile(raw) {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export default function Home() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [shots, setShots] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [rpiApi, setRpiApi] = useState(DEFAULT_RPI_API);

  // Read dynamic backend API URL from query parameter (?api=https://...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const apiParam = params.get("api");
      if (apiParam) {
        setRpiApi(apiParam);
      }
    }
  }, []);

  const mobileDigits = normalizeMobile(mobile);
  const mobileValid = mobileDigits.length === 10;

  async function handleContinue(e) {
    e.preventDefault();

    if (!mobileValid) return;

    setError("");
    setChecking(true);
    setStatus("Checking your number...");

    try {
      const response = await fetch(`${rpiApi}/api/account/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobileDigits,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not continue");
      }

      if (data.enrolled) {
        // Already have a palm template on file -- straight to top-up,
        // no need to involve the PalmPay device at all.
        const params = new URLSearchParams({
          mobile: mobileDigits,
          api: rpiApi,
        });
        window.location.href = `/topup?${params.toString()}`;
        return;
      }

      // New number -- the device is now waiting for a palm capture.
      setStarted(true);
      setStatus("Place your palm in front of the scanner");
    } catch (err) {
      setError(err.message);
      setStatus("Could not connect to PalmPay");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${rpiApi}/api/account/status`);

        if (!response.ok) {
          throw new Error("Status request failed");
        }

        const data = await response.json();

        setShots(data.shots || 0);

        if (data.screen === "enroll_capture") {
          setStatus(
            data.shots > 0
              ? `Capturing palm... ${data.shots} photos`
              : "Place your palm in front of the scanner"
          );
        }

        if (data.screen === "result") {
          if (data.result_ok) {
            setResult("success");
            setStatus("Enrollment complete");
          } else {
            setResult("error");
            setStatus(data.result_detail || "Enrollment failed");
          }
        }
      } catch (err) {
        console.error("Status error:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [started, rpiApi]);

  return (
    <main className="page">
      <section className="card">

        <div className="brand">
          <div className="logo">P</div>
          <div>
            <h1>PalmPay</h1>
            <p>Palm-vein biometric payments</p>
          </div>
        </div>

        {!started && !result ? (
          <>
            <div className="heading">
              <h2>My account</h2>
              <p>
                Enter your mobile number. New numbers start enrollment,
                existing numbers go straight to top-up.
              </p>
            </div>

            <form onSubmit={handleContinue}>
              <label>
                Mobile number
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={16}
                  disabled={checking}
                />
              </label>

              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Only needed for new numbers"
                  autoComplete="name"
                  disabled={checking}
                />
              </label>

              <button type="submit" disabled={!mobileValid || checking}>
                {checking ? status || "Checking..." : "Continue"}
              </button>
            </form>

            {error && <p className="error">{error}</p>}

            <p className="note">
              Keep this page open while the PalmPay device captures your palm.
            </p>
          </>
        ) : result === "success" ? (
          <div className="waiting">
            <h2>Enrollment complete</h2>

            <p>
              <strong>{name}</strong> has been enrolled successfully.
            </p>

            <p>Mobile: {mobileDigits}</p>

            <button onClick={() => window.location.reload()}>
              Enroll another user
            </button>
          </div>
        ) : result === "error" ? (
          <div className="waiting">
            <h2>Enrollment failed</h2>

            <p>{status}</p>

            <button onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : (
          <div className="waiting">
            <div className="spinner" />

            <h2>Waiting for PalmPay</h2>

            <p>
              Enrollment started for <strong>{name}</strong>.
              <br />
              Mobile: <strong>{mobileDigits}</strong>
            </p>

            <div className="status">
              <span />
              {status}
            </div>

            {shots > 0 && (
              <p>
                Photos captured: <strong>{shots}</strong>
              </p>
            )}
          </div>
        )}

      </section>
    </main>
  );
}
