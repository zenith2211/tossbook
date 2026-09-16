export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

export const OK = (message?: string): ActionResult => ({ ok: true, message });
export const FAIL = (error: string): ActionResult => ({ ok: false, error });
