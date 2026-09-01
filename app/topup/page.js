"use client";

import { useEffect, useState } from "react";
import "../styles.css";

const RPI_API = "https://fishtank.taile121fd.ts.net";
const PRESET_AMOUNTS = [100, 200, 500, 1000];

export default function TopUp() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState(null); // null | "success" | "error"
  const [newBalance, setNewBalance] = useState(null);

  // Load Razorpay Checkout script once on mount.
  useEffect(() => {
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError("Could not load payment gateway. Check your connection.");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function startTopUp(e) {
    e.preventDefault();

    const amountNum = Number(amount);
    if (!userId.trim() || !amountNum || amountNum <= 0) return;

    setError("");
    setResult(null);
    setPaying(true);
    setStatus("Creating order...");

    try {
      const createRes = await fetch(`${RPI_API}/api/wallet/topup/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId.trim(),
          amount_rupees: amountNum,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error || "Could not start top-up");
      }

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Payment gateway still loading — try again in a moment");
      }

      setStatus("Opening payment...");

      const rzp = new window.Razorpay({
        key: createData.key_id,
        order_id: createData.order_id,
        amount: createData.amount_paise,
        currency: createData.currency,
        name: "PalmPay",
        description: `Wallet top-up for ${userId.trim()}`,
        handler: async function (response) {
          setStatus("Verifying payment...");
          try {
            const verifyRes = await fetch(`${RPI_API}/api/wallet/topup/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment could not be verified");
            }

            setNewBalance(verifyData.balance_rupees);
            setResult("success");
            setStatus("Top-up complete");
          } catch (err) {
            setError(err.message);
            setResult("error");
            setStatus("Payment could not be confirmed");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            setStatus("");
          },
        },
        theme: { color: "#00cdff" },
      });

      rzp.on("payment.failed", function (resp) {
        setError(resp.error?.description || "Payment failed");
        setResult("error");
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      setPaying(false);
      setStatus("");
    }
  }

  return (
    <main className="page">
      <section className="card">
        <div className="brand">
          <div className="logo">P</div>
          <div>
            <h1>PalmPay</h1>
            <p>Top up your wallet</p>
          </div>
        </div>

        {result === "success" ? (
          <div className="waiting">
            <h2>Top-up complete</h2>
            <p>
              Wallet for <strong>{userId}</strong> credited successfully.
            </p>
            {newBalance !== null && (
              <p>
                New balance: <strong>&#8377; {newBalance.toFixed(2)}</strong>
              </p>
            )}
            <button
              onClick={() => {
                setResult(null);
                setAmount("");
                setStatus("");
              }}
            >
              Top up again
            </button>
          </div>
        ) : result === "error" ? (
          <div className="waiting">
            <h2>Top-up failed</h2>
            <p>{error || status}</p>
            <button
              onClick={() => {
                setResult(null);
                setError("");
                setStatus("");
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="heading">
              <h2>Add funds</h2>
              <p>Enter your User ID and the amount to add.</p>
            </div>

            <form onSubmit={startTopUp}>
              <label>
                User ID
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Same ID used during enrollment"
                  autoComplete="off"
                  disabled={paying}
                />
              </label>

              <label>
                Amount (&#8377;)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={paying}
                />
              </label>

              <div className="preset-row" style={{ display: "flex", gap: "8px", margin: "8px 0 16px" }}>
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setAmount(String(val))}
                    disabled={paying}
                    style={{ flex: 1 }}
                  >
                    &#8377;{val}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!userId.trim() || !Number(amount) || paying || !scriptLoaded}
              >
                {paying ? status || "Processing..." : "Pay now"}
              </button>
            </form>

            {!scriptLoaded && !error && (
              <p className="note">Loading payment gateway...</p>
            )}
            {error && <p className="error">{error}</p>}
            <p className="note">
              Payments are processed securely by Razorpay. Your wallet updates
              automatically once payment is confirmed.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
