"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("plary-theme") as Theme | null;
    setTheme(stored === "dark" ? "dark" : "light");
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("plary-theme", theme);
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const Icon = theme === "light" ? Sun : Moon;

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      onClick={toggle}
      aria-label={`Theme: ${theme}`}
      className="rounded-full"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
