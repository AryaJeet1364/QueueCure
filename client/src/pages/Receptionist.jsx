import React, { useEffect, useState, useRef } from "react";
import api from "../config/api";
import socket from "../config/socket";
import toast from "react-hot-toast";

export default function Receptionist() {
  const [patients, setPatients] = useState([]);
  const [session, setSession] = useState({ currentToken: 0, avgConsultTime: 5 });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avgTime, setAvgTime] = useState(5);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    api
      .get("/queue/state")
      .then(({ data }) => {
        if (data.success) {
          setSession(data.data.session);
          setPatients(data.data.patients);
          setAvgTime(data.data.session.avgConsultTime);
        }
      })
      .catch((err) => {
        // Show detailed error
        const msg = err.userMessage || err.message || "Failed to load initial data";
        toast.error(`📊 ${msg}`);
      });

    socket.on("queue:state", ({ session, patients }) => {
      setSession(session);
      setPatients(patients);
    });

    socket.on("connect", () => toast.success("🟢 Connected to server"));
    socket.on("disconnect", () => toast.error("🔴 Disconnected from server"));

    return () => {
      socket.off("queue:state");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const addPatient = async (e) => {
    e.preventDefault();
    
    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("📝 Please enter a patient name");
      nameRef.current?.focus();
      return;
    }

    // Validate phone if provided
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^[0-9]{10}$/.test(trimmedPhone)) {
      toast.error("📱 Phone must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/patients", { 
        name: trimmedName, 
        phone: trimmedPhone 
      });
      
      toast.success(`✅ Token #${data.data.token} assigned to ${data.data.name}`);
      setName("");
      setPhone("");
      nameRef.current?.focus();
    } catch (err) {
      // Get the detailed error message from interceptor
      const errorMsg = err.userMessage || err.response?.data?.message || "Failed to add patient";
      
      // Show different icons based on error type
      if (errorMsg.includes("already in queue") || errorMsg.includes("duplicate")) {
        toast.error(`👤 ${errorMsg}`);
      } else if (errorMsg.includes("Phone")) {
        toast.error(`📱 ${errorMsg}`);
      } else if (errorMsg.includes("required") || errorMsg.includes("Name")) {
        toast.error(`📝 ${errorMsg}`);
      } else if (errorMsg.includes("Server")) {
        toast.error(`⚠️ ${errorMsg}`);
      } else {
        toast.error(`❌ ${errorMsg}`);
      }
    }
    setLoading(false);
  };

  const callNext = async () => {
    try {
      const { data } = await api.post("/queue/next");
      if (data.data?.currentToken) {
        toast.success(`🔔 Calling Token #${data.data.currentToken}`);
      } else {
        toast("Queue is empty", { icon: "ℹ️" });
      }
    } catch (err) {
      const errorMsg = err.userMessage || err.response?.data?.message || "Failed to call next";
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const updateAvgTime = async () => {
    if (avgTime < 1) {
      toast.error("⏱️ Minimum time is 1 minute");
      return;
    }
    if (avgTime > 120) {
      toast.error("⏱️ Maximum time is 120 minutes");
      return;
    }
    
    try {
      await api.put("/sessions", { avgConsultTime: avgTime });
      toast.success(`✅ Average time updated to ${avgTime} minutes`);
    } catch (err) {
      const errorMsg = err.userMessage || err.response?.data?.message || "Failed to update time";
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const resetQueue = async () => {
    if (!confirm("⚠️ Reset entire queue? This cannot be undone.")) return;
    try {
      await api.delete("/queue/reset");
      toast.success("✅ Queue reset successfully");
    } catch (err) {
      const errorMsg = err.userMessage || err.response?.data?.message || "Failed to reset queue";
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const waiting = patients.filter((p) => p.status === "waiting");
  const serving = patients.find((p) => p.status === "serving");

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Clinic Management</div>
          <h1 className="page-title">
            Queue<span>Cure</span>
          </h1>
        </div>
        <div className="header-badges" style={{ alignSelf: "flex-end" }}>
          <span className="badge badge-blue">
            Serving&nbsp;
            <strong style={{ fontWeight: 600 }}>
              #{session.currentToken || "—"}
            </strong>
          </span>
          <span className="badge badge-green">
            {waiting.length} waiting
          </span>
        </div>
      </header>

      <div className="grid-two">
        <section className="card">
          <div className="section-label">Add Patient</div>
          <form onSubmit={addPatient} className="form">
            <div className="field">
              <label>Full Name *</label>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                autoFocus
              />
            </div>
            <div className="field">
              <label>Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98XXXXXXXX"
                maxLength={10}
                inputMode="numeric"
              />
              {phone && phone.length > 0 && phone.length !== 10 && (
                <small style={{ color: 'var(--red)' }}>
                  ⚠️ Phone must be exactly 10 digits
                </small>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary full-width"
              disabled={loading}
              style={{ marginTop: "4px" }}
            >
              {loading ? "⏳ Adding…" : "Assign Token"}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="section-label">Queue Controls</div>

          <div className="currently-serving">
            {serving ? (
              <>
                <span className="serving-label">Currently Serving</span>
                <span className="serving-token">#{serving.token}</span>
                <span className="serving-name">{serving.name}</span>
              </>
            ) : (
              <span className="serving-label" style={{ color: "var(--muted)" }}>
                No patient in consultation
              </span>
            )}
          </div>

          <button
            onClick={callNext}
            className="btn btn-accent full-width mt-1"
          >
            Call Next
          </button>

          <div className="divider" />

          <div className="field">
            <label>Avg. Consultation Time (min)</label>
            <div className="inline-row">
              <input
                type="number"
                min={1}
                max={60}
                value={avgTime}
                onChange={(e) => setAvgTime(Number(e.target.value))}
              />
              <button onClick={updateAvgTime} className="btn btn-outline sm">
                💾 Save
              </button>
            </div>
          </div>

          <button
            onClick={resetQueue}
            className="btn btn-danger full-width mt-2"
          >
            Reset Queue (End of Day)
          </button>
        </section>
      </div>

      <section className="card mt-2">
        <div className="section-label">
          Waiting Queue
          <span
            className="badge badge-blue"
            style={{ marginLeft: "auto", marginRight: 0 }}
          >
            {waiting.length} patients
          </span>
        </div>

        {waiting.length === 0 ? (
          <p className="empty-state">No patients waiting — add one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Position</th>
                  <th style={{ textAlign: "right" }}>Est. Wait</th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((p, i) => (
                  <tr key={p._id}>
                    <td>
                      <span className="token-badge">#{p.token}</span>
                    </td>
                    <td style={{ color: "var(--text)", fontWeight: 500 }}>
                      {p.name}
                    </td>
                    <td>{p.phone || "—"}</td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.1em",
                          color: "var(--muted)",
                        }}
                      >
                        #{i + 1}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "14px",
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          color: "var(--amber)",
                        }}
                      >
                        ~{(i + 1) * session.avgConsultTime} min
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}