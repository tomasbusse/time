export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL ?? "https://helping-buffalo-10.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
