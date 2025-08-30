"use client";
import "./globals.css";
import { Poppins } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} flex min-h-screen`}>

        {/* Main content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300`}
        >
          {/* Page content */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
