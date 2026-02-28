import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { initSentry } from "./lib/sentry";
import { initPostHog } from "./lib/posthog";
import App from "./App.tsx";
import "./index.css";

initSentry();
initPostHog();
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
