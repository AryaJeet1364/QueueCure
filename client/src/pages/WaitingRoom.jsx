import React, { useEffect, useState } from "react";
import api from "../config/api";
import socket from "../config/socket";
import toast from "react-hot-toast";

export default function WaitingRoom() {
  const [patients, setPatients] = useState([]);
  const [session, setSession] = useState({ currentToken: 0, avgConsultTime: 5 });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    api.get("/queue/state")
      .then(({ data }) => {
        if (data.success) {
          setSession(data.data.session);
          setPatients(data.data.patients);
        }
      })
      .catch((err) => {
        const msg = err.userMessage || err.message || "Failed to load waiting room";
        toast.error(`📊 ${msg}`);
        console.error("Failed to load state:", err);
      });

    socket.on("queue:state", ({ session, patients }) => {
      setSession(session);
      setPatients(patients);
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    });

    socket.on("connect", () => toast.success("🟢 Connected to server"));
    socket.on("disconnect", () => toast.error("🔴 Disconnected from server"));

    return () => {
      socket.off("queue:state");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const serving = patients.find((p) => p.status === "serving");
  const waiting = patients.filter((p) => p.status === "waiting");

  return (
    <div className="waiting-page">
      <header className="waiting-header">
        <div className="waiting-eyebrow">Patient Waiting Room</div>
        <h1 className="waiting-title">
          Queue<span className="accent">Cure</span>
        </h1>
        <p className="waiting-sub">Real-time queue display</p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
          <span className="live-dot">
            <span className="dot-inner" />
            Live
          </span>
        </div>
      </header>

      <div className={`token-display${pulse ? " token-pulse" : ""}`}>
        <p className="token-label">Now Serving</p>
        {session.currentToken ? (
          <>
            <p className="token-number">#{session.currentToken}</p>
            {serving && <p className="token-name">{serving.name}</p>}
          </>
        ) : (
          <p className="token-empty">—</p>
        )}
      </div>

      <div className="queue-list-wrap">
        <div className="queue-list-header">
          <span className="queue-list-title">Waiting</span>
          <span className="queue-count-pill">{waiting.length}</span>
          <div className="queue-list-line" />
        </div>

        {waiting.length === 0 ? (
          <div className="queue-empty">
            <p className="queue-empty-text">🎉 Queue is clear</p>
          </div>
        ) : (
          <div className="queue-list">
            {waiting.map((p, i) => {
              const estWait = (i + 1) * session.avgConsultTime;
              return (
                <div key={p._id} className="queue-row">
                  <div className="queue-row-left">
                    <span className="queue-token">#{p.token}</span>
                    <div>
                      <p className="queue-name">{p.name}</p>
                      <p className="queue-pos">Position {i + 1}</p>
                    </div>
                  </div>
                  <div className="queue-wait">
                    <p className="wait-time">~{estWait} min</p>
                    <p className="wait-label">est. wait</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="footer-note">
        Avg. consultation time: <strong>{session.avgConsultTime} min</strong>
      </p>
    </div>
  );
}