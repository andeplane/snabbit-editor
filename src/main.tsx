import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { preloadSprites } from "./canvas/sprites";

preloadSprites(); // fire-and-forget; canvas falls back to diamonds until loaded

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
