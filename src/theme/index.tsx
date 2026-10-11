import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfacePressed: string;
  border: string;
  separator: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  success: string;
  danger: string;
  dangerSoft: string;
  onAccent: string;
  overlay: string;
  track: string;
  hintBg: string;
}

const dark: Palette = {
  bg: "#000000",
  surface: "#1C1C1E",
  surfaceAlt: "#2C2C2E",
  surfacePressed: "#3A3A3C",
  border: "#38383A",
  separator: "#2C2C2E",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  textTertiary: "#636366",
  accent: "#0A84FF",
  accentSoft: "rgba(10, 132, 255, 0.15)",
  success: "#30D158",
  danger: "#FF453A",
  dangerSoft: "rgba(255, 69, 58, 0.15)",
  onAccent: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.94)",
  track: "rgba(255, 255, 255, 0.18)",
  hintBg: "rgba(0, 0, 0, 0.55)",
};

const light: Palette = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  surfaceAlt: "#E9E9EB",
  surfacePressed: "#DCDCDE",
  border: "#D8D8DC",
  separator: "#E5E5EA",
  text: "#111114",
  textSecondary: "#6B6B70",
  textTertiary: "#9A9AA0",
  accent: "#0A84FF",
  accentSoft: "rgba(10, 132, 255, 0.12)",
  success: "#34C759",
  danger: "#FF3B30",
  dangerSoft: "rgba(255, 69, 58, 0.12)",
  onAccent: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.9)",
  track: "rgba(0, 0, 0, 0.15)",
  hintBg: "rgba(0, 0, 0, 0.55)",
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const font = {
  title: 22,
  heading: 17,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

export interface Theme {
  colors: Palette;
  scheme: ColorScheme;
  isDark: boolean;
  radius: typeof radius;
  spacing: typeof spacing;
  font: typeof font;
  toggleScheme: () => void;
  setScheme: (scheme: ColorScheme) => void;
}

const palettes: Record<ColorScheme, Palette> = { dark, light };

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  children,
  initialScheme = "dark",
}: {
  children: ReactNode;
  initialScheme?: ColorScheme;
}) {
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);

  const value = useMemo<Theme>(
    () => ({
      colors: palettes[scheme],
      scheme,
      isDark: scheme === "dark",
      radius,
      spacing,
      font,
      toggleScheme: () => setScheme((s) => (s === "dark" ? "light" : "dark")),
      setScheme,
    }),
    [scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  }
  return theme;
}

/** Crea estilos memoizados a partir del theme global. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T
): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}

export { dark as darkPalette, light as lightPalette };
