"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Box,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

export const Sidebar = ({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: (x: boolean) => void;
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigationItems = [
    {
      label: "Regions",
      href: `/dashboard/${user?.nodeId}`,
      icon: LayoutDashboard,
    },
    ...(user?.nodeType === "Branch"
      ? [
          { label: "Members", href: `/members`, icon: Users },
          { label: "Payments", href: `/payments`, icon: CreditCard },
        ]
      : []),
    {
      label: "Collection",
      href: `/collection/68aebd7307e0278726b8104b`,
      icon: Box,
    },
  ];

  return (
    <>
      {/* Floating Toggle (always visible when sidebar is closed) */}
      
      <button
        onClick={() => toggleSidebar(!isOpen)}
        className="fixed top-4 left-4 p-2 rounded-lg bg-gray-100 text-gray-500 border z-[9999]"
      >
        {isOpen ? <PanelLeftClose className="h-6 w-6" /> : <PanelLeftOpen className="h-6 w-6" />}
      </button>
      

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 lg:pt-16 h-screen w-56 bg-gradient-to-b from-white to-orange-50 border-r border-gray-200 shadow-xl flex flex-col transition-transform duration-300 z-50",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header with Logo + Close Toggle */}
        <div className="flex items-center justify-center px-6 py-5 border-b border-gray-200 bg-white/70 backdrop-blur">
          <Image
            src="https://cdn.siasat.com/wp-content/uploads/2022/06/RSS.jpg"
            alt="RSS Logo"
            width={150}
            height={100}
            className="rounded float-left p-0"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className="group block">
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-orange-100 text-orange-700 font-semibold"
                      : "text-gray-600 hover:text-orange-700 hover:bg-orange-50"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600 rounded-r"></span>
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive
                        ? "text-orange-700"
                        : "text-gray-400 group-hover:text-orange-700"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer with Node Info + User */}
        <div className="border-t border-gray-200 p-4 space-y-4 bg-white/60 backdrop-blur">
          {user && (
            <div className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur rounded-xl shadow-md border border-orange-100">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 text-orange-700 font-semibold">
                {user.name?.charAt(0) || "N"}
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-gray-900">{user.name}</span>
                <span className="text-gray-500 text-xs">ID: {user.nodeId}</span>
                <span className="mt-1 inline-block w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {user.nodeType}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg 
               text-orange-600 border border-orange-600
               hover:bg-orange-600 hover:text-white transition-colors shadow-sm"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
