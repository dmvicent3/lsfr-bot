import { log } from "./log.ts";

interface ProcessLike {
  on(event: "unhandledRejection" | "uncaughtException", listener: (err: unknown) => void): unknown;
  exit(code: number): void;
}

/**
 * Last-resort handlers: a stray rejected promise is logged and the bot carries on; an
 * uncaught exception leaves the process in an unknown state, so it exits and Docker
 * (restart: always) brings it back.
 */
export function guardProcess(proc: ProcessLike = process): void {
  proc.on("unhandledRejection", (reason) => {
    log.error("process", "unhandled promise rejection", reason);
  });
  proc.on("uncaughtException", (err) => {
    log.error("process", "uncaught exception, exiting", err);
    proc.exit(1);
  });
}
