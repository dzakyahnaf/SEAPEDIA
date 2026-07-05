import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_INFO } from "../lib/roles";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-sea-50 text-sea-700" : "text-slate-600 hover:text-sea-700"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { isLoggedIn, user, needsRoleSelection, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const activeRole = user?.active_role ? ROLE_INFO[user.active_role] : null;
  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={close}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sea-600 text-lg font-black text-white">
            S
          </span>
          <span className="text-lg font-extrabold tracking-tight text-sea-800">
            SEAPEDIA
          </span>
        </Link>

        {/* Navigasi desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <NavItem to="/">Beranda</NavItem>
          <NavItem to="/products">Produk</NavItem>
          {isLoggedIn && <NavItem to="/dashboard">Dashboard</NavItem>}
          {user?.active_role === "BUYER" && <NavItem to="/cart">🛒 Keranjang</NavItem>}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Masuk
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Daftar
              </Button>
            </>
          ) : (
            <>
              {activeRole ? (
                <Link to="/select-role" title="Klik untuk ganti role aktif">
                  <Badge className={activeRole.badgeClass}>
                    {activeRole.icon} {activeRole.label}
                  </Badge>
                </Link>
              ) : (
                needsRoleSelection && (
                  <Link to="/select-role">
                    <Badge className="bg-orange-100 text-orange-700">
                      ⚠ Pilih role dulu
                    </Badge>
                  </Link>
                )
              )}
              <span className="text-sm font-medium text-slate-700">
                {user.username}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </>
          )}
        </div>

        {/* Tombol menu mobile */}
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Buka menu navigasi"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavItem to="/" onClick={close}>Beranda</NavItem>
            <NavItem to="/products" onClick={close}>Produk</NavItem>
            {isLoggedIn && <NavItem to="/dashboard" onClick={close}>Dashboard</NavItem>}
            {user?.active_role === "BUYER" && (
              <NavItem to="/cart" onClick={close}>🛒 Keranjang</NavItem>
            )}
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {!isLoggedIn ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { close(); navigate("/login"); }}>
                  Masuk
                </Button>
                <Button size="sm" className="flex-1" onClick={() => { close(); navigate("/register"); }}>
                  Daftar
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{user.username}</span>
                  {activeRole && (
                    <Badge className={activeRole.badgeClass}>
                      {activeRole.icon} {activeRole.label}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Keluar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
