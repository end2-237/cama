"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid3x3, Search, ChevronDown, Globe, HelpCircle, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Filières",        href: "#filieres" },
  { label: "Modules",         href: "#modules" },
  { label: "Acteurs",         href: "#roles" },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "border-b border-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mr-4">
            <div className="leading-tight">
              <span className="block text-ink text-xs font-normal">Institut</span>
              <span className="block text-ink text-base font-bold leading-none tracking-tight">
                JFN · <span className="text-green">CAMA</span>
              </span>
            </div>
          </Link>

          {/* Explore pill */}
          <button className="hidden md:flex items-center gap-2 border border-ink rounded-full px-4 py-1.5 text-sm font-medium text-ink hover:bg-surface transition-colors">
            <Grid3x3 className="w-4 h-4" />
            Explorer
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-sm items-center gap-2 bg-surface rounded-full px-4 py-2 border border-border">
            <Search className="w-4 h-4 text-subtle flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher cours, ressources..."
              className="bg-transparent text-sm text-ink placeholder-subtle outline-none w-full"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop right nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 ml-4">
            <button className="p-2 text-muted hover:text-ink transition-colors">
              <Globe className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted hover:text-ink transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <Link
              href="/auth/login"
              className="border-2 border-ink text-ink font-bold text-sm px-5 py-2 rounded-full hover:bg-surface transition-colors"
            >
              Connexion
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto p-2 text-ink"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm font-medium text-muted border-b border-border last:border-0"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/auth/login"  className="btn-outline-green text-center">Connexion</Link>
            <Link href="/auth/register" className="btn-green text-center">Commencer</Link>
          </div>
        </div>
      )}
    </header>
  );
}
