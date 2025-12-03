
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import AppInitializer from "./components/AppInitializer";

import "./pushNotifications";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppInitializer />
    <App />
  </React.StrictMode>
);
