"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { signOut } from "next-auth/react";
import { ActiveLink } from "@/components/ui";
import {
  LayoutDashboard,
  KeyRound,
  Users,
  Settings,
  BarChart4,
  Menu,
  X,
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render layout only if authenticated
  if (status !== "authenticated") {
    return null;
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Licenses", href: "/admin/licenses", icon: KeyRound },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart4 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white border-r border-gray-200 md:block shadow-lg md:shadow-none`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center mb-5 p-2">
            <span className="text-xl font-semibold">VoxMark Admin</span>
          </div>
          <ul className="space-y-2 font-medium">
            {navigation.map((item) => (
              <li key={item.name}>
                <ActiveLink
                  href={item.href}
                  className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
                  activeClassName="bg-gray-100 text-gray-900 font-medium border-l-4 border-blue-500 pl-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 group-[.bg-gray-100]:text-blue-500" />
                  <span className="ml-3">{item.name}</span>
                </ActiveLink>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-4 mt-6 rounded-lg bg-slate-50">
              <div className="flex items-center mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64 p-4 md:p-8">
        {/* Backdrop for mobile menu */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-gray-800 bg-opacity-50 md:hidden"
            onClick={toggleMobileMenu}
          ></div>
        )}
        {children}
      </div>
    </div>
  );
}
