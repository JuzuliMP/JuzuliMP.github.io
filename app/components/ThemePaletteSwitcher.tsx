import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, X, Sparkles } from 'lucide-react';

export interface ThemeOption {
  id: string;
  name: string;
  category: string;
  colors: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
    glow: string;
  };
}

export const THEME_PALETTES: ThemeOption[] = [
  {
    id: 'theme-cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'Default',
    colors: {
      bg: '#06060e',
      card: '#0d0d1a',
      primary: '#8b5cf6',
      accent: '#06b6d4',
      glow: 'rgba(139, 92, 246, 0.5)',
    },
  },
  {
    id: 'theme-emerald',
    name: 'Cyber Emerald',
    category: 'Bio-Tech',
    colors: {
      bg: '#040d0c',
      card: '#0a1715',
      primary: '#10b981',
      accent: '#06b6d4',
      glow: 'rgba(16, 185, 129, 0.5)',
    },
  },
  {
    id: 'theme-violet',
    name: 'Hyper Violet',
    category: 'Web3 Luxury',
    colors: {
      bg: '#080612',
      card: '#110d24',
      primary: '#a855f7',
      accent: '#f43f5e',
      glow: 'rgba(168, 85, 247, 0.5)',
    },
  },
  {
    id: 'theme-arctic',
    name: 'Arctic Sapphire',
    category: 'IDE / Tooling',
    colors: {
      bg: '#080f1e',
      card: '#0f1a2e',
      primary: '#38bdf8',
      accent: '#818cf8',
      glow: 'rgba(56, 189, 248, 0.5)',
    },
  },
  {
    id: 'theme-solar',
    name: 'Solar Flare',
    category: 'Gamer High-Energy',
    colors: {
      bg: '#0a0706',
      card: '#18100d',
      primary: '#f97316',
      accent: '#eab308',
      glow: 'rgba(249, 115, 22, 0.5)',
    },
  },
  {
    id: 'theme-synthwave',
    name: 'Tokyo Synthwave',
    category: 'Retro 80s',
    colors: {
      bg: '#090714',
      card: '#140f29',
      primary: '#ff2a85',
      accent: '#00f0ff',
      glow: 'rgba(255, 42, 133, 0.5)',
    },
  },
  {
    id: 'theme-titanium',
    name: 'Titanium Platinum',
    category: 'Minimal Luxury',
    colors: {
      bg: '#090a0f',
      card: '#13151f',
      primary: '#f8fafc',
      accent: '#38bdf8',
      glow: 'rgba(248, 250, 252, 0.4)',
    },
  },
];

const STORAGE_KEY = 'juzuli-portfolio-theme-palette';

export function ThemePaletteSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>('theme-cyberpunk');

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && THEME_PALETTES.some((t) => t.id === savedTheme)) {
      applyTheme(savedTheme);
    } else {
      applyTheme('theme-cyberpunk');
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const root = document.documentElement;
    const body = document.body;
    THEME_PALETTES.forEach((t) => {
      root.classList.remove(t.id);
      body.classList.remove(t.id);
    });
    root.classList.add(themeId);
    body.classList.add(themeId);

    // Also update any element with class 'dark'
    document.querySelectorAll('.dark').forEach((el) => {
      THEME_PALETTES.forEach((t) => el.classList.remove(t.id));
      el.classList.add(themeId);
    });

    setActiveTheme(themeId);
    localStorage.setItem(STORAGE_KEY, themeId);

    // Dispatch custom event for canvas re-rendering
    window.dispatchEvent(new CustomEvent('themechange', { detail: themeId }));
  };

  const currentThemeObj = THEME_PALETTES.find((t) => t.id === activeTheme) || THEME_PALETTES[0];

  return (
    <div className="relative">
      {/* Palette Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 shadow-lg cursor-pointer"
        aria-label="Switch Color Palette"
        title="Live Color Palette Switcher"
      >
        {/* Color Dots Preview */}
        <div className="flex items-center -space-x-1.5">
          <div
            className="w-3.5 h-3.5 rounded-full border border-background shadow-sm"
            style={{ backgroundColor: currentThemeObj.colors.primary }}
          />
          <div
            className="w-3.5 h-3.5 rounded-full border border-background shadow-sm"
            style={{ backgroundColor: currentThemeObj.colors.accent }}
          />
        </div>

        <Palette className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-xs font-medium hidden sm:inline-block text-foreground">
          Theme
        </span>
      </button>

      {/* Floating Modal / Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 mt-3 w-80 sm:w-96 p-4 rounded-2xl glass border border-primary/20 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <h4 className="text-sm font-semibold text-foreground font-[family-name:var(--font-heading)]">
                    Real-time Color Palettes
                  </h4>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Grid Options */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {THEME_PALETTES.map((theme) => {
                  const isSelected = activeTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border/40 hover:border-primary/40 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Swatch Pill */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center p-1 border border-white/10 shadow-md relative overflow-hidden"
                          style={{ backgroundColor: theme.colors.bg }}
                        >
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              background: `radial-gradient(circle at 30% 30%, ${theme.colors.primary}, transparent 70%)`,
                            }}
                          />
                          <div className="flex gap-1 z-10">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: theme.colors.primary }}
                            />
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: theme.colors.accent }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                              {theme.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">
                            {theme.category}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer indicator */}
              <div className="mt-3 pt-2 text-[10px] text-center text-muted-foreground border-t border-border/30">
                Click any palette to update theme colors instantly
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
