export function loader({ request }: { request: Request }) {
  if (!request) throw new Error("x");
  return null;
}
