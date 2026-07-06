"use client";

/* Staff session + RBAC context. Mock auth: the session is a staff id in
   localStorage — the UI *demonstrates* the permission model; production must
   enforce it server-side (plan doc §7, SECURITY.md). */

import * as React from "react";
import {
  STAFF,
  type StaffUser,
  type ModuleId,
  type AccessLevel,
  type Power,
  getRole,
  getDepartment,
  access,
} from "@/lib/admin-data";

const SESSION_KEY = "certrace-admin:session";

type AuthCtx = {
  user: StaffUser | null;
  ready: boolean;
  signIn: (staffId: string) => void;
  signOut: () => void;
  can: (module: ModuleId) => AccessLevel;
  hasPower: (power: Power) => boolean;
};

const Ctx = React.createContext<AuthCtx | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<StaffUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const id = window.localStorage.getItem(SESSION_KEY);
    setUser(STAFF.find((s) => s.id === id) ?? null);
    setReady(true);
  }, []);

  const signIn = React.useCallback((staffId: string) => {
    window.localStorage.setItem(SESSION_KEY, staffId);
    setUser(STAFF.find((s) => s.id === staffId) ?? null);
  }, []);

  const signOut = React.useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const can = React.useCallback(
    (module: ModuleId): AccessLevel => {
      if (!user) return "none";
      return access(getRole(user.roleId).dept, module);
    },
    [user],
  );

  const hasPower = React.useCallback(
    (power: Power) => (user ? getRole(user.roleId).powers.includes(power) : false),
    [user],
  );

  return <Ctx.Provider value={{ user, ready, signIn, signOut, can, hasPower }}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth outside AdminAuthProvider");
  return ctx;
}

export function roleOf(user: StaffUser) {
  return getRole(user.roleId);
}

export function deptOf(user: StaffUser) {
  return getDepartment(getRole(user.roleId).dept);
}
