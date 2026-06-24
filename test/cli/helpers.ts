/** Strip ANSI color escape codes so output can be matched as plain text. */
export function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}
