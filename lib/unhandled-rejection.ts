// Register a process-level handler to log and avoid noisy unhandledRejection crashes
// This file is imported early in server runtime (e.g. app layout) so the handler is active.
if (typeof process !== "undefined" && typeof process.on === "function") {
  try {
    process.on("unhandledRejection", (reason, promise) => {
      // Keep logging concise and include useful details for debugging.
      // Avoid throwing here; simply report.
      // eslint-disable-next-line no-console
      console.error("Unhandled Rejection (promise):", promise, "reason:", reason)
    })
  } catch (e) {
    // ignore if environment disallows process handlers
  }
}
