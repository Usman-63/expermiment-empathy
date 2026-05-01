import React from "react";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "./routes.jsx";
import { SessionProvider } from "./providers/SessionProvider.jsx";
import { ConditionProvider } from "./providers/ConditionProvider.jsx";
import { MediaProvider } from "./providers/MediaProvider.jsx";

const router = createAppRouter();

export default function App() {
  return (
    <SessionProvider>
      <ConditionProvider>
        <MediaProvider>
          <RouterProvider router={router} />
        </MediaProvider>
      </ConditionProvider>
    </SessionProvider>
  );
}
