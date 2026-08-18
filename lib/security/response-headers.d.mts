export type ResponseHeader = Readonly<{
  key: string;
  value: string;
}>;

export function buildContentSecurityPolicy(options?: Readonly<{
  firebaseAuthEmulatorHost?: string;
}>): string;

export const publicResponseHeaders: readonly ResponseHeader[];
export const adminResponseHeaders: readonly ResponseHeader[];
