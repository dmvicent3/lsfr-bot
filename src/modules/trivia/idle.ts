/** Unanswered rounds in a row that end a session. */
export const IDLE_LIMIT = 3;

export const nextIdle = (idle: number, answered: boolean): number => (answered ? 0 : idle + 1);
