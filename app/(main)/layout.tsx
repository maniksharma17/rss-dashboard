"use client";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = (open: boolean) => setSidebarOpen(open);

  return (
    <main>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-56" : "ml-0"
        }`}
      >
        <main>{children}</main>
      </div>
    </main>
  );
}
