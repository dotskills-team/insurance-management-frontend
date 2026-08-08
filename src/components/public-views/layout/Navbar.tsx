'use client'

import Link from 'next/link'
import { Menu, User, LayoutDashboard, LogOut, ChevronRight } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'
import ThemeToggle from '@/components/shared/ThemeToggle'
import { useUser } from '@/context/UserContext'
import { toast } from 'sonner'
import { getDashboardPath } from '@/components/shared/DashboardPath'
import { useTheme } from '@/lib/providers/ThemeProvider'
import { useState } from 'react'

const navLinks = [
  { title: 'about us', path: '/about' },
  { title: 'products', path: '/products' },
  { title: 'diagnastic', path: '/diagnastic' },
  { title: 'pharmacy', path: '/pharmacy' },
  { title: 'contact', path: '/contact' },
  { title: 'faq', path: '/faqs' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname()
  const { user, logout } = useUser();
  const router = useRouter();
  const dashboardPath = getDashboardPath(user?.role)

  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      logout();
      toast.success("Logged out successfully");
      router.push("/login");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-auto py-2 max-w-7xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center text-xl font-bold tracking-wide">
          <Image
            className="cursor-pointer transition-transform duration-300 ease-out group-hover:scale-105"
            src={theme === "dark" ? "/assets/logo-light.webp" : "/assets/logo-dark.webp"}
            alt="Logo"
            width={90}
            height={70}
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.path;

            return (
              <Link
                key={link.path}
                href={link.path}
                className={`group relative px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors hover:text-primary ${
                  active ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                {link.title}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100 ${
                    active ? "scale-x-100" : ""
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Desktop Button */}
        <div className="lg:flex items-center gap-3 hidden">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Profile menu"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full btn-bg text-white shadow-sm ring-2 ring-transparent transition-all duration-200 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <User className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={10} className="w-52 rounded-xl p-1.5">
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2">
                    <Link href={dashboardPath} className="flex items-center gap-2.5">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg py-2 text-red-500 focus:bg-red-500/10 focus:text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button className="cursor-pointer btn-bg text-white text-md font-medium py-5 px-6 rounded-full shadow-md transition-transform duration-200 hover:scale-[1.03]">
                <Link href="/login">Login/Claim</Link>
              </Button>
            )}
        </div>

        {/* Mobile Menu */}
        <div className='flex items-center gap-2 lg:hidden '>
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="flex items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <Menu className="h-10 w-10" />
          </SheetTrigger>

          <SheetContent side="right" className="w-80 px-0 pt-5">
            <div className="flex h-full flex-col">
              <nav className="flex flex-1 flex-col gap-1 px-4 pt-8">
                {navLinks.map((link) => {
                  const active = pathname === link.path;

                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors ${
                        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      {link.title}
                      <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t px-4 py-5">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href={dashboardPath}
                      className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      Dashboard
                    </Link>
                    <Button
                      onClick={handleLogout}
                      className="w-full cursor-pointer justify-center gap-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full cursor-pointer btn-bg text-white rounded-full py-5 shadow-md">
                    <Link href="/login">Login/Claim</Link>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  );
}