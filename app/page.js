"use client";

import { useEffect, useState } from "react";
import "./styles.css";

const DEFAULT_RPI_API = "https://fishtank.taile121fd.ts.net";

export default function Home() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [shots, setShots] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
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

  async function startEnrollment(e) {
    e.preventDefault();

    if (!name.trim() || !userId.trim()) return;

    setError("");
    setStatus("Connecting to PalmPay...");

    try {
      const response = await fetch(`${rpiApi}/api/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          user_id: userId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Enrollment could not be started");
      }

      setStarted(true);
      setStatus("Place your palm in front of the scanner");
    } catch (err) {
      setError(err.message);
      setStatus("Could not connect to PalmPay");
    }
  }

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${rpiApi}/api/enroll/status`);

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
            <p>Palm-vein biometric enrollment</p>
          </div>
        </div>

        {!started && !result ? (
          <>
            <div className="heading">
              <h2>Enroll new user</h2>
              <p>Enter your details to begin enrollment.</p>
            </div>

            <form onSubmit={startEnrollment}>
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  autoComplete="name"
                />
              </label>

              <label>
                User ID
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  autoComplete="off"
                />
              </label>

              <button
                type="submit"
                disabled={!name.trim() || !userId.trim()}
              >
                Start enrollment
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

            <p>User ID: {userId}</p>

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
              User ID: <strong>{userId}</strong>
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
"use client";

import { useEffect, useState } from "react";
import "./styles.css";

const RPI_API = "https://fishtank.taile121fd.ts.net";

export default function Home() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [shots, setShots] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function startEnrollment(e) {
    e.preventDefault();

    if (!name.trim() || !userId.trim()) return;

    setError("");
    setStatus("Connecting to PalmPay...");

    try {
      const response = await fetch(`${RPI_API}/api/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          user_id: userId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Enrollment could not be started");
      }

      setStarted(true);
      setStatus("Place your palm in front of the scanner");
    } catch (err) {
      setError(err.message);
      setStatus("Could not connect to PalmPay");
    }
  }

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${RPI_API}/api/enroll/status`);

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
  }, [started]);

  return (
    <main className="page">
      <section className="card">

        <div className="brand">
          <div className="logo">P</div>
          <div>
            <h1>PalmPay</h1>
            <p>Palm-vein biometric enrollment</p>
          </div>
        </div>

        {!started && !result ? (
          <>
            <div className="heading">
              <h2>Enroll new user</h2>
              <p>Enter your details to begin enrollment.</p>
            </div>

            <form onSubmit={startEnrollment}>
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  autoComplete="name"
                />
              </label>

              <label>
                User ID
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  autoComplete="off"
                />
              </label>

              <button
                type="submit"
                disabled={!name.trim() || !userId.trim()}
              >
                Start enrollment
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

            <p>User ID: {userId}</p>

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
              User ID: <strong>{userId}</strong>
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
