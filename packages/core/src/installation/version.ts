declare global {
  const IGRIS_VERSION: string
  const IGRIS_CHANNEL: string
}

export const InstallationVersion = typeof IGRIS_VERSION === "string" ? IGRIS_VERSION : "local"
export const InstallationChannel = typeof IGRIS_CHANNEL === "string" ? IGRIS_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
