"use client";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { logout } from "@/features/auth/actions";
import {
  Calculator,
  ChevronDown,
  ExternalLink,
  Home,
  LogOut,
  Menu,
  Package,
  PackageSearch,
  Plus,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type AdminLayoutFrameProps = {
  children: React.ReactNode;
  todayIso: string;
  todayLabel: string;
  userEmail: string;
};

type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  inactiveWhen?: string[];
  label: string;
  match?: "exact" | "startsWith";
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Principal",
    items: [
      {
        href: "/retro-campus-admin",
        icon: Home,
        label: "Dashboard",
        match: "exact",
      },
      {
        href: "/retro-campus-admin/productos",
        icon: Package,
        inactiveWhen: ["/retro-campus-admin/productos/nuevo"],
        label: "Productos",
        match: "startsWith",
      },
      {
        href: "/retro-campus-admin/stock",
        icon: PackageSearch,
        inactiveWhen: [
          "/retro-campus-admin/stock/canales",
          "/retro-campus-admin/stock/nuevo",
        ],
        label: "Stock",
        match: "startsWith",
      },
    ],
  },
  {
    label: "Operación",
    items: [
      {
        href: "/retro-campus-admin/productos/nuevo",
        icon: Plus,
        label: "Nuevo producto",
        match: "exact",
      },
      {
        href: "/retro-campus-admin/stock/nuevo",
        icon: Plus,
        label: "Nuevo ingreso",
        match: "exact",
      },
      {
        href: "/retro-campus-admin/calculadora-precios",
        icon: Calculator,
        label: "Calculadora",
        match: "startsWith",
      },
    ],
  },
  {
    label: "Gestión",
    items: [
      {
        href: "/retro-campus-admin/stock/canales",
        icon: Settings,
        label: "Canales de venta",
        match: "startsWith",
      },
      {
        href: "/retro-campus-admin/catalogo",
        icon: SlidersHorizontal,
        label: "Configuración general",
        match: "startsWith",
      },
    ],
  },
];

export function AdminLayoutFrame({
  children,
  todayIso,
  todayLabel,
  userEmail,
}: AdminLayoutFrameProps) {
  const pathname = usePathname();
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeSection = getActiveSection(pathname);
  const ActiveSectionIcon = activeSection.icon;
  const userDisplayName = getUserDisplayName(userEmail);

  useEffect(() => {
    if (!isSidebarOpen && !isAccountMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        setIsAccountMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen, isSidebarOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isAccountMenuOpen]);

  return (
    <div className="admin-page">
      <aside
        className="admin-sidebar"
        data-open={isSidebarOpen}
        id="admin-sidebar"
      >
        <div className="admin-sidebar__brand-row">
          <Link
            aria-label="Ir al dashboard de Retro Campus"
            className="admin-sidebar__brand"
            href="/retro-campus-admin"
            onClick={() => setIsSidebarOpen(false)}
          >
            <BrandLogo className="admin-sidebar__logo" sizes="92px" />
            <span>
              <strong>Retro Campus</strong>
              <small>Panel admin</small>
            </span>
          </Link>
          <button
            aria-label="Cerrar navegación"
            className="admin-sidebar__close"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <nav aria-label="Navegación del panel" className="admin-sidebar__nav">
          {adminNavGroups.map((group) => (
            <div className="admin-sidebar__group" key={group.label}>
              <p className="admin-sidebar__group-label">{group.label}</p>
              <div className="admin-sidebar__items">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(pathname, item);

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className="admin-sidebar__link"
                      data-active={isActive}
                      href={item.href}
                      key={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Icon aria-hidden="true" size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <Link
            className="admin-sidebar__link"
            href="/"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ExternalLink aria-hidden="true" size={18} />
            <span>Ver catálogo</span>
          </Link>
        </div>
      </aside>

      {isSidebarOpen ? (
        <button
          aria-label="Cerrar navegación"
          className="admin-sidebar__backdrop"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__inner">
            <div className="admin-topbar__left">
              <button
                aria-controls="admin-sidebar"
                aria-expanded={isSidebarOpen}
                aria-label="Abrir navegación del panel"
                className="admin-mobile-menu"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu aria-hidden="true" size={20} />
              </button>

              <span className="admin-topbar__section-icon" aria-hidden="true">
                <ActiveSectionIcon aria-hidden="true" size={19} />
              </span>

              <div className="admin-topbar__copy">
                <p>Bienvenido, {userDisplayName}</p>
                <time dateTime={todayIso}>{todayLabel}</time>
              </div>
            </div>

            <div className="admin-topbar__right">
              <details
                className="admin-account-menu"
                onToggle={(event) =>
                  setIsAccountMenuOpen(event.currentTarget.open)
                }
                open={isAccountMenuOpen}
                ref={accountMenuRef}
              >
                <summary aria-label={`Cuenta activa: ${userEmail}`}>
                  <span className="admin-account-menu__avatar">
                    {getUserInitials(userEmail)}
                  </span>
                  <span className="admin-account-menu__copy">
                    <strong>{userDisplayName}</strong>
                    <small>Administrador</small>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="admin-account-menu__chevron"
                    size={16}
                  />
                </summary>
                <div className="admin-account-menu__panel">
                  <div className="admin-account-menu__identity">
                    <span>{getUserInitials(userEmail)}</span>
                    <div>
                      <strong>{userDisplayName}</strong>
                      <small>{userEmail}</small>
                    </div>
                  </div>
                  <form action={logout}>
                    <button className="admin-account-menu__item" type="submit">
                      <LogOut aria-hidden="true" size={16} />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}

function getActiveSection(pathname: string) {
  for (const group of adminNavGroups) {
    const activeItem = group.items.find((item) => isNavItemActive(pathname, item));

    if (activeItem) {
      return {
        ...activeItem,
        groupLabel: group.label,
      };
    }
  }

  return {
    groupLabel: "Principal",
    href: "/retro-campus-admin",
    icon: Home,
    label: "Dashboard",
    match: "exact",
  } satisfies AdminNavItem & { groupLabel: string };
}

function isNavItemActive(pathname: string, item: AdminNavItem) {
  if (
    item.inactiveWhen?.some(
      (href) => pathname === href || pathname.startsWith(`${href}/`),
    )
  ) {
    return false;
  }

  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getUserInitials(userEmail: string) {
  const initials = getUserNameParts(userEmail)
    .split(/[.\-_ ]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "A";
}

function getUserDisplayName(userEmail: string) {
  const nameParts = getUserNameParts(userEmail)
    .split(/[.\-_ ]+/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return "Administrador";
  }

  return nameParts
    .slice(0, 2)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function getUserNameParts(userEmail: string) {
  return userEmail.split("@")[0] ?? userEmail;
}
