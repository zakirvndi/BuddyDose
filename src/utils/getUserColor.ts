/**
 * Maps a user_id to a consistent color scheme.
 * Uses a deterministic hash so the same user always gets the same color
 * across sessions and re-renders.
 */

export type UserColorScheme = {
  /** Pill / event background (low opacity) */
  bg: string;
  /** Text color on the pill */
  text: string;
  /** Solid dot / avatar background */
  dot: string;
  /** Avatar bg + text for initials display */
  avatarBg: string;
  avatarText: string;
};

const COLOR_SCHEMES: UserColorScheme[] = [
  {
    bg: "bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    avatarBg: "bg-emerald-500/20",
    avatarText: "text-emerald-700 dark:text-emerald-400",
  },
  {
    bg: "bg-violet-500/15",
    text: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
    avatarBg: "bg-violet-500/20",
    avatarText: "text-violet-700 dark:text-violet-400",
  },
  {
    bg: "bg-sky-500/15",
    text: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
    avatarBg: "bg-sky-500/20",
    avatarText: "text-sky-700 dark:text-sky-400",
  },
  {
    bg: "bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    avatarBg: "bg-amber-500/20",
    avatarText: "text-amber-700 dark:text-amber-400",
  },
  {
    bg: "bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
    avatarBg: "bg-rose-500/20",
    avatarText: "text-rose-700 dark:text-rose-400",
  },
  {
    bg: "bg-cyan-500/15",
    text: "text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-500",
    avatarBg: "bg-cyan-500/20",
    avatarText: "text-cyan-700 dark:text-cyan-400",
  },
  {
    bg: "bg-orange-500/15",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
    avatarBg: "bg-orange-500/20",
    avatarText: "text-orange-700 dark:text-orange-400",
  },
  {
    bg: "bg-pink-500/15",
    text: "text-pink-700 dark:text-pink-400",
    dot: "bg-pink-500",
    avatarBg: "bg-pink-500/20",
    avatarText: "text-pink-700 dark:text-pink-400",
  },
];

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Returns the consistent color scheme for a given user ID.
 * The same user ID always maps to the same color.
 */
export function getUserColor(userId: string): UserColorScheme {
  const index = hashUserId(userId) % COLOR_SCHEMES.length;
  return COLOR_SCHEMES[index];
}
