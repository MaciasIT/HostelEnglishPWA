
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import ThemeProvider from "./components/ThemeProvider";
import AppInitializer from "./components/AppInitializer";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppInitializer>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AppInitializer>
  </React.StrictMode>
);
