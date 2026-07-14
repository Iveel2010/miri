// ============================================================================
// Minimal structured logger. Swap for pino/winston in production if needed.
// Levels are gated by LOG_LEVEL so noisy logs stay out of production.
// ============================================================================

type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const CURRENT = ORDER[(process.env.LOG_LEVEL as Level) ?? "info"] ?? 20;

function emit(level: Level, args: unknown[]) {
  if (ORDER[level] < CURRENT) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] ${level.toUpperCase()}`;
  if (level === "error") {
    
    console.error(prefix, ...args);
  } else if (level === "warn") {
    
    console.warn(prefix, ...args);
  } else {
    
    console.log(prefix, ...args);
  }
}

export const logger = {
  debug: (...a: unknown[]) => emit("debug", a),
  info: (...a: unknown[]) => emit("info", a),
  warn: (...a: unknown[]) => emit("warn", a),
  error: (...a: unknown[]) => emit("error", a),
};
