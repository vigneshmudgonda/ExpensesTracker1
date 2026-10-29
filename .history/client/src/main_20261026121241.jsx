/


import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: {
            style: {
              background: "#ecfdf5",
              color: "#065f46",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
