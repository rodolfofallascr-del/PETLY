import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateDemoUser, createSessionToken, SESSION_COOKIE } from "@/src/lib/auth";

async function loginAction(formData: FormData) {
  "use server";

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const session = authenticateDemoUser(username, password);

  if (!session) {
    redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(next.startsWith("/") ? next : "/admin");
}

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params?.next ?? "/admin";
  const error = params?.error;

  return (
    <main className="login-page">
      <section className="login-card">
        <div>
          <p className="login-eyebrow">Acceso seguro</p>
          <h1>Entrar a Petly</h1>
          <p className="login-copy">
            Usa una cuenta demo para probar roles mientras conectamos la base de datos real.
          </p>
        </div>

        {error === "invalid" ? (
          <p className="login-error">Usuario o contraseña incorrectos.</p>
        ) : null}
        {error === "unauthorized" ? (
          <p className="login-error">Tu rol no tiene permiso para entrar al panel admin.</p>
        ) : null}

        <form action={loginAction} className="login-form">
          <input type="hidden" name="next" value={next} />
          <label>
            Usuario
            <input name="username" placeholder="admin" autoComplete="username" required />
          </label>
          <label>
            Contraseña
            <input name="password" type="password" placeholder="admin123" autoComplete="current-password" required />
          </label>
          <button type="submit">Entrar al panel</button>
        </form>

        <div className="demo-users">
          <strong>Cuentas demo</strong>
          <span>Admin: admin / admin123</span>
          <span>Empresa: empresa / empresa123</span>
          <span>Usuario: usuario / usuario123</span>
        </div>
      </section>
    </main>
  );
}
