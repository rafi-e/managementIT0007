"use client";

import * as React from "react";
import { Toaster as HotToaster } from "react-hot-toast";

const Toaster = () => {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        success: {
          iconTheme: {
            primary: "hsl(var(--foreground))",
            secondary: "hsl(var(--background))",
          },
        },
        error: {
          iconTheme: {
            primary: "hsl(var(--foreground))",
            secondary: "hsl(var(--background))",
          },
        },
      }}
    />
  );
};

export { Toaster };
export { toast } from "react-hot-toast";
