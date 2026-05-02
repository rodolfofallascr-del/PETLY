import Link from "next/link";
import { logoutAction } from "./actions";
import { getAdminDashboardData } from "@/src/lib/admin-dashboard";
import { requireRole } from "@/src/lib/auth";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CR").format(value);
}

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("es-CR", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value / 100);
}

export default async function AdminPage() {
  const session = await requireRole("ADMIN");
  const dashboard = await getAdminDashboardData();
  const estimatedRevenueCents = dashboard.metrics.clicks * 25;
  const engagement =
    dashboard.metrics.users > 0
      ? Math.round((dashboard.metrics.posts / dashboard.metrics.users) * 100)
      : 0;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          <span>P</span> Petly
        </Link>
        <nav className="admin-nav">
          <a className="active" href="#resumen">Resumen</a>
          <a href="#usuarios">Usuarios</a>
          <a href="#contenido">Contenido</a>
          <a href="#anuncios">Anuncios</a>
          <a href="#partners">Partners</a>
          <a href="#moderacion">Moderacion</a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p>Panel administrativo</p>
            <h1>Centro de crecimiento y monetizacion</h1>
            <div className="admin-header-badges">
              <span className="role-pill">Rol: {session.role}</span>
              <span className={`role-pill ${dashboard.source === "database" ? "success" : "warning"}`}>
                {dashboard.source === "database" ? "Base conectada" : "Modo fallback"}
              </span>
            </div>
          </div>
          <div className="admin-session">
            <span>{session.name}</span>
            <form action={logoutAction}>
              <button type="submit">Salir</button>
            </form>
          </div>
        </header>

        <section className="metrics" id="resumen">
          <article>
            <span>Usuarios registrados</span>
            <strong>{formatNumber(dashboard.metrics.users)}</strong>
            <small>{formatNumber(dashboard.metrics.businesses)} empresas registradas</small>
          </article>
          <article>
            <span>Mascotas registradas</span>
            <strong>{formatNumber(dashboard.metrics.pets)}</strong>
            <small>{formatNumber(dashboard.metrics.posts)} publicaciones totales</small>
          </article>
          <article>
            <span>Ingresos estimados</span>
            <strong>{formatCurrencyFromCents(estimatedRevenueCents)}</strong>
            <small>{formatNumber(dashboard.metrics.clicks)} clics publicitarios</small>
          </article>
          <article>
            <span>Engagement</span>
            <strong>{engagement}%</strong>
            <small>{formatNumber(dashboard.metrics.impressions)} impresiones registradas</small>
          </article>
        </section>

        <section className="grid-two">
          <article className="admin-panel" id="anuncios">
            <div className="panel-head">
              <div>
                <p>Anuncios</p>
                <h2>Inventario publicitario</h2>
              </div>
              <button className="ghost">Configurar</button>
            </div>
            <div className="ad-list">
              {dashboard.adInventory.map((ad) => (
                <div key={ad.id}>
                  <strong>{ad.title}</strong>
                  <span>{ad.channel}</span>
                  <em>{ad.status}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel" id="partners">
            <div className="panel-head">
              <div>
                <p>Partners privados</p>
                <h2>Campanas comerciales</h2>
              </div>
              <button className="ghost">Nuevo partner</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>CTR</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.partners.map((partner) => (
                  <tr key={partner.id}>
                    <td>{partner.name}</td>
                    <td>{partner.category}</td>
                    <td>{partner.status}</td>
                    <td>{partner.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>

        <section className="grid-two">
          <article className="admin-panel" id="contenido">
            <div className="panel-head">
              <div>
                <p>Contenido</p>
                <h2>Publicaciones recientes</h2>
              </div>
              <button className="ghost">Ver cola</button>
            </div>
            <div className="moderation-list">
              {dashboard.recentPosts.map((post) => (
                <div key={post.id}>
                  <span>{post.icon}</span>
                  <strong>{post.label}</strong>
                  <small>{post.status}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel" id="moderacion">
            <div className="panel-head">
              <div>
                <p>Seguridad</p>
                <h2>Moderacion y confianza</h2>
              </div>
              <button className="ghost">Reglas</button>
            </div>
            <div className="trust-box">
              <strong>{formatNumber(dashboard.metrics.pendingReports)} reportes pendientes</strong>
              <p>
                Prioridades del MVP: reportes, bloqueo de usuarios, aprobacion de adopciones,
                verificacion de empresas y revision de anuncios antes de publicarlos.
              </p>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
