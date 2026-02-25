"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeShortcut() {
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd+D/K (Mac) or Ctrl+D/K (Windows)
            if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "d")) {
                e.preventDefault();
                setTheme(theme === "dark" ? "light" : "dark");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [theme, setTheme]);

    return null;
}
