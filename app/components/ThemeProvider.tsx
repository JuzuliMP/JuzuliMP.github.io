import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Dark-only mode — no theme switching needed
  return <>{children}</>;
}
