/** Resolve runtime resources under Vite's base, including GitHub project Pages. */
export function appURL(
  resource: string,
  base = import.meta.env.BASE_URL,
): string {
  return `${base}${resource.replace(/^\//, "")}`;
}
