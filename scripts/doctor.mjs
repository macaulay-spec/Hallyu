#!/usr/bin/env node
// Config doctor (Spec §54): reports which external dependencies are configured
// and which features will run in "unconfigured — documented" mode as a result.
// Never reads secret values — only presence.

const checks = [
  { key: "EXPO_PUBLIC_CONVEX_URL", feature: "Backend connection (app ↔ Convex)", required: "M1", where: "app env (expo)" },
  { key: "TMDB_API_KEY", feature: "TMDB metadata sync", required: "optional (owner said later)", where: "Convex env" },
  { key: "RESEND_API_KEY", feature: "Verification / recovery email", required: "optional", where: "Convex env" },
  { key: "EXPO_PUBLIC_PUSH_CONFIGURED", feature: "Push notifications (FCM/APNs)", required: "optional (M5)", where: "app env (expo)" },
  { key: "EXPO_TOKEN", feature: "EAS builds from GitHub Actions", required: "M0 (repo secret)", where: "GitHub secrets" },
  { key: "CONVEX_DEPLOY_KEY", feature: "CI-managed Convex deploys", required: "optional", where: "GitHub secrets" },
];

console.log("Hallyu doctor — configuration honesty check\n");
let missing = 0;
for (const c of checks) {
  const set = process.env[c.key] ? "✓ set" : "— not set";
  if (!process.env[c.key]) missing++;
  console.log(`  ${set.padEnd(10)} ${c.key}\n             feature: ${c.feature}\n             needed:  ${c.required} (${c.where})\n`);
}
console.log(
  missing === 0
    ? "All external dependencies configured. ✓"
    : `${missing} item(s) not configured — the app runs and reports these honestly (Spec §54). See docs/plans/OWNER_REQUIREMENTS_CHECKLIST.md.`
);
