import React, { createContext, useContext, useMemo, useState } from "react";
import { PALETTES, Palette, ThemeName } from "./tokens";

interface ThemeCtx {
  name: ThemeName;
  p: Palette;
  setTheme: (t: ThemeName) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ name: "dark", p: PALETTES.dark, setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({
  initial = "dark",
  children,
}: {
  initial?: ThemeName;
  children: React.ReactNode;
}) {
  const [name, setName] = useState<ThemeName>(initial);
  const value = useMemo<ThemeCtx>(
    () => ({
      name,
      p: PALETTES[name],
      setTheme: setName,
      toggle: () => setName((n) => (n === "dark" ? "light" : "dark")),
    }),
    [name]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}

/** Non-hook access for the static renderer (no provider needed). */
export function palette(name: ThemeName): Palette {
  return PALETTES[name];
}
