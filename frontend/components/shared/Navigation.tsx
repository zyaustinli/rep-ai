"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/setup", label: "New Practice" },
  { href: "/history", label: "History" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/rep-logo.png"
                alt="Rep Logo"
                width={90}
                height={36}
                className="h-9 w-auto"
                priority
              />
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium"
            >
              Profile
            </Link>
            <button className="text-gray-700 hover:text-red-600 text-sm font-medium">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
