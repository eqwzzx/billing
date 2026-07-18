"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { Server, Plus, Settings, LogOut, Home, Wallet, Shield, Menu, X } from "lucide-react"
import { User } from "./types"
import { useState } from "react"

interface ClientHeaderProps {
  user: User
  onLogout: () => void
}

const navItems = [
  { href: "/client", icon: Home, label: "Главная", exact: true },
  { href: "/client/servers", icon: Server, label: "Серверы" },
  { href: "/client/create", icon: Plus, label: "Создать" },
  { href: "/client/billing", icon: Wallet, label: "Баланс" },
  { href: "/client/settings", icon: Settings, label: "Настройки" },
]

export function ClientHeader({ user, onLogout }: ClientHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogoutClick = () => {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      onLogout()
    }
  }

  return (
    <>
      <nav className="fixed top-2 sm:top-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-auto max-w-[calc(100%-1rem)] animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between gap-3 sm:gap-8 rounded-xl sm:rounded-2xl border border-border bg-background/80 py-1.5 sm:py-2 px-3 sm:px-6 shadow-lg backdrop-blur-md">
        <Link href="/" className="flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform duration-200">
          <Image src="/logo.svg" alt="Fluxor" width={28} height={28} className="size-5 sm:size-7 brightness-0 dark:brightness-100" />
          <span className="font-heading text-sm sm:text-lg font-bold tracking-tight text-foreground">Fluxor</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:scale-[1.02] ${
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Desktop Dividers and Actions */}
        <div className="h-6 w-px bg-border/60 hidden lg:block" />

        <div className="hidden lg:block">
          <ThemeToggle />
        </div>

        <div className="h-6 w-px bg-border/60 hidden lg:block" />

        <Link
          href="/client/billing"
          className="hidden sm:flex items-center gap-1.5 rounded-lg bg-foreground px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-background transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Wallet className="size-3.5 sm:size-4" />
          <span className="font-heading font-bold whitespace-nowrap">{user.balance.toFixed(0)} ₽</span>
        </Link>

        {(user.role === "ADMIN" || user.role === "PR_MANAGER") && (
          <>
            <div className="h-6 w-px bg-border/60 hidden lg:block" />
            <Link
              href={user.role === "PR_MANAGER" ? "/admin/marketing" : "/admin"}
              className="hidden lg:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all duration-200 hover:from-amber-500/20 hover:to-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
              title={user.role === "PR_MANAGER" ? "Маркетинг" : "Админ панель"}
            >
              <Shield className="size-4" />
              <span className="font-medium">{user.role === "PR_MANAGER" ? "Маркетинг" : "Админ"}</span>
            </Link>
          </>
        )}

        <div className="h-6 w-px bg-border/60 hidden lg:block" />

        <button
          onClick={handleLogoutClick}
          className="hidden lg:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium bg-red-500/10 text-red-500 transition-all duration-200 hover:bg-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
          title="Выйти"
        >
          <LogOut className="size-4" />
        </button>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="block lg:hidden">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center size-8 rounded-lg text-foreground transition-colors hover:bg-accent"
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
    </nav>

    {/* Mobile Menu */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 z-40 lg:hidden">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="absolute top-16 sm:top-20 left-2 right-2 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-xl animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
            
            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <Link
                href="/client/billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="size-4" />
                  <span className="text-sm font-medium">Баланс</span>
                </div>
                <span className="font-heading font-bold text-sm">{user.balance.toFixed(0)} ₽</span>
              </Link>

              {(user.role === "ADMIN" || user.role === "PR_MANAGER") && (
                <Link
                  href={user.role === "PR_MANAGER" ? "/admin/marketing" : "/admin"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Shield className="size-4" />
                  <span className="text-sm font-medium">{user.role === "PR_MANAGER" ? "Маркетинг" : "Админ панель"}</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogoutClick()
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="size-4" />
                <span className="text-sm font-medium">Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
