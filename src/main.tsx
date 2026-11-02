
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import ThemeProvider from "./components/ThemeProvider";
import AppInitializer from "./components/AppInitializer";
import AppErrorBoundary from "./components/AppErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppInitializer>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AppInitializer>
    </AppErrorBoundary>
  </React.StrictMode>
);
