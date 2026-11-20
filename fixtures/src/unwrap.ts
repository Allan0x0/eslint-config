declare const result: { _unsafeUnwrap(): number; _unsafeUnwrapErr(): Error };
export const value = result._unsafeUnwrap();
export const error = result._unsafeUnwrapErr();
