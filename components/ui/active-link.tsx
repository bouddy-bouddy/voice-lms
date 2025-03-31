"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ActiveLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}

export function ActiveLink({
  href,
  children,
  exact = false,
  className = "",
  activeClassName = "bg-gray-100 text-gray-900 font-medium border-l-4 border-blue-500 pl-1",
  onClick,
}: ActiveLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(className, isActive && activeClassName)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
