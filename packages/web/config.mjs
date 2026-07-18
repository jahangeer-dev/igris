const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://igris.ai" : `https://${stage}.igris.ai`,
  console: stage === "production" ? "https://igris.ai/auth" : `https://${stage}.igris.ai/auth`,
  email: "help@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/anomalyco/igris",
  discord: "https://igris.ai/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/docs/" },
  ],
}
