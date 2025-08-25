import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeApp, initializeDevelopmentMode } from "./utils/app-initializer";

// Initialize safety systems BEFORE React renders
initializeApp();
initializeDevelopmentMode();

createRoot(document.getElementById("root")!).render(<App />);
