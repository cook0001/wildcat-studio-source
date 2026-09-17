import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Production Security Lockdown: Prevent inspecting, viewing source, and DevTools
if (import.meta.env.PROD) {
  // Disable right-click context menu (blocks "Inspect Element")
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Block DevTools keyboard shortcuts (F12, Cmd+Option+I/J/C, Ctrl+Shift+I/J/C, Cmd/Ctrl+U)
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) ||
      ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U"))
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
