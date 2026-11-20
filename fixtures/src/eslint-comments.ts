export function a(): never {
  // eslint-disable-next-line functional/no-throw-statements
  throw new Error("no description");
}
export function b(): never {
  // eslint-disable-next-line functional/no-throw-statements -- process entry point; crash is intended
  throw new Error("described");
}
