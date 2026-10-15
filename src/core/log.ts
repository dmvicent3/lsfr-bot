function line(scope: string, msg: string): string {
  return `[${new Date().toISOString()}] [${scope}] ${msg}`;
}

export const log = {
  info(scope: string, msg: string): void {
    console.log(line(scope, msg));
  },
  error(scope: string, msg: string, err?: unknown): void {
    console.error(line(scope, msg), err ?? "");
  },
};
