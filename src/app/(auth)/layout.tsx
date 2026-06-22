"use client";

import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">{children}</div>
      <Toaster position="top-right" />
    </div>
  );
}
