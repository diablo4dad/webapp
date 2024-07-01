import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Application from "./Application";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SettingsProvider } from "./settings/context";
import { getCollection, getSettings } from "./store/local";
import { CollectionProvider } from "./collection/context";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Application />,
  },
]);

// Loads settings and collection from localStorage
// If application has not been used before, these will be default
const settings = getSettings();
const collection = getCollection();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <SettingsProvider settings={settings}>
      <CollectionProvider collection={collection}>
        <RouterProvider router={router} />
      </CollectionProvider>
    </SettingsProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Disables console logging in production
if (process.env.NODE_ENV !== "development") {
  console.log = function () {
    return;
  };
}
