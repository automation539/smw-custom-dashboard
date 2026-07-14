"use client";

import { Menu, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { signOut } from "@/lib/actions/auth";

interface NavbarProps {
  onMenuClick: () => void;
  fullName: string | null;
  email: string;
}

function getInitials(fullName: string | null, email: string): string {
  if (fullName && fullName.trim().length > 0) {
    const parts = fullName.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function Navbar({ onMenuClick, fullName, email }: NavbarProps) {
  const displayName = fullName && fullName.trim().length > 0 ? fullName : email;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-gray-900 lg:hidden">SMW Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
        <Avatar initials={getInitials(fullName, email)} />
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </button>
        </form>
      </div>
    </header>
  );
}
