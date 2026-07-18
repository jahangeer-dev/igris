/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://igris.ai",

  // GitHub
  github: {
    repoUrl: "https://github.com/anomalyco/igris",
    starsFormatted: {
      compact: "160K",
      full: "160,000",
    },
  },

  // Social links
  social: {
    twitter: "https://x.com/igris",
    discord: "https://discord.gg/igris",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "900",
    commits: "13,000",
    monthlyUsers: "7.5M",
  },
} as const
