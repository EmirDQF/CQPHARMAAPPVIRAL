import type { AuthClientLike, AuthErrorLike, AuthSessionLike } from "@/lib/auth/types";

type CallName = "signInAnonymously" | "signInWithOtp" | "updateUser" | "verifyOtp";

interface FakeAuthOptions {
  session?: AuthSessionLike | null;
  /** Error que devolverá la próxima llamada a cada método (se consume una vez). */
  failNext?: Partial<Record<CallName, AuthErrorLike>>;
  /** Código que el "correo" entrega; cualquier otro es inválido. */
  validCode?: string;
}

/** Fake en memoria de Supabase Auth para tests. Nunca se importa desde la app. */
export function createFakeAuthClient(options: FakeAuthOptions = {}) {
  let session: AuthSessionLike | null = options.session ?? null;
  const failNext = { ...options.failNext };
  const validCode = options.validCode ?? "123456";
  const calls: { name: CallName; args: unknown }[] = [];
  let anonymousCounter = 0;

  function consumeFailure(name: CallName): AuthErrorLike | null {
    const failure = failNext[name] ?? null;
    delete failNext[name];
    return failure;
  }

  const client: AuthClientLike = {
    async getSession() {
      return { data: { session }, error: null };
    },
    async signInAnonymously(credentials) {
      calls.push({ name: "signInAnonymously", args: credentials });
      const error = consumeFailure("signInAnonymously");
      if (error) return { error };
      anonymousCounter += 1;
      session = { user: { id: `anon-${anonymousCounter}`, is_anonymous: true } };
      return { error: null };
    },
    async signInWithOtp(credentials) {
      calls.push({ name: "signInWithOtp", args: credentials });
      return { error: consumeFailure("signInWithOtp") };
    },
    async updateUser(attributes) {
      calls.push({ name: "updateUser", args: attributes });
      return { error: consumeFailure("updateUser") };
    },
    async verifyOtp(params) {
      calls.push({ name: "verifyOtp", args: params });
      const error = consumeFailure("verifyOtp");
      if (error) return { error };
      if (params.token !== validCode) {
        return { error: { code: "otp_expired", message: "Token has expired or is invalid" } };
      }
      const keptId = session?.user.id ?? "account-1";
      session = { user: { id: keptId, is_anonymous: false, email: params.email } };
      return { error: null };
    },
  };

  return {
    client,
    calls,
    currentSession: () => session,
  };
}
