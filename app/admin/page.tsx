import Link from "next/link";
import { AdminNav } from "./AdminNav";
import {
  approveAdAction,
  approveModerationReportAction,
  logoutAction,
  rejectAdAction,
  rejectModerationReportAction,
  resolveModerationReportAction,
  scanContentModerationAction,
  seedDemoDataAction,
  unverifyBusinessAction,
  verifyBusinessAction,
} from "./actions";
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

type AdminPageProps = {
  searchParams?: Promise<{
    ads?: string;
    flagged?: string;
    moderation?: string;
    partners?: string;
    pending?: string;
    scan?: string;
    seed?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await requireRole("ADMIN");
  const params = await searchParams;
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
        <AdminNav />
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
            <form action={seedDemoDataAction}>
              <button type="submit">Cargar demo</button>
            </form>
            <form action={logoutAction}>
              <button type="submit">Salir</button>
            </form>
          </div>
        </header>

        {params?.seed === "success" ? (
          <div className="admin-alert success">Datos demo cargados correctamente.</div>
        ) : null}

        {params?.seed === "fallback" ? (
          <div className="admin-alert warning">
            Supabase aun no esta conectado con una URL valida. El panel queda en modo demo para continuar el desarrollo.
          </div>
        ) : null}

        {params?.scan === "success" ? (
          <div className="admin-alert success">
            Escaneo completado: {params.flagged ?? "0"} publicaciones marcadas y {params.pending ?? "0"} en revision.
          </div>
        ) : null}

        {params?.scan === "error" ? (
          <div className="admin-alert warning">
            No se pudo ejecutar el escaneo automatico. Revisa la conexion con Supabase.
          </div>
        ) : null}

        {params?.moderation === "approved" ? (
          <div className="admin-alert success">Publicacion aprobada y reporte actualizado.</div>
        ) : null}

        {params?.moderation === "rejected" ? (
          <div className="admin-alert success">Publicacion rechazada y reporte cerrado.</div>
        ) : null}

        {params?.moderation === "resolved" ? (
          <div className="admin-alert success">Reporte resuelto correctamente.</div>
        ) : null}

        {params?.moderation === "error" ? (
          <div className="admin-alert warning">No se pudo procesar la accion de moderacion.</div>
        ) : null}

        {params?.ads === "approved" ? (
          <div className="admin-alert success">Anuncio aprobado para publicacion.</div>
        ) : null}

        {params?.ads === "rejected" ? (
          <div className="admin-alert success">Anuncio rechazado correctamente.</div>
        ) : null}

        {params?.ads === "error" ? (
          <div className="admin-alert warning">No se pudo procesar la accion del anuncio.</div>
        ) : null}

        {params?.partners === "verified" ? (
          <div className="admin-alert success">Empresa verificada correctamente.</div>
        ) : null}

        {params?.partners === "unverified" ? (
          <div className="admin-alert success">Verificacion de empresa retirada.</div>
        ) : null}

        {params?.partners === "error" ? (
          <div className="admin-alert warning">No se pudo procesar la accion del partner.</div>
        ) : null}

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

        <section className="admin-section" id="usuarios">
          <div className="section-head">
            <div>
              <p>Usuarios</p>
              <h2>Comunidad y perfiles</h2>
            </div>
            <button className="ghost">Exportar</button>
          </div>
          <div className="admin-feature-grid">
            <article>
              <span>{formatNumber(dashboard.metrics.users)}</span>
              <strong>Usuarios</strong>
              <small>Cuentas registradas en Petly</small>
            </article>
            <article>
              <span>{formatNumber(dashboard.metrics.pets)}</span>
              <strong>Mascotas</strong>
              <small>Perfiles creados por la comunidad</small>
            </article>
            <article>
              <span>{formatNumber(dashboard.metrics.businesses)}</span>
              <strong>Empresas</strong>
              <small>Partners, servicios y anunciantes</small>
            </article>
          </div>
          <div className="admin-list">
            {dashboard.recentUsers.map((user) => (
              <div key={user.id}>
                <span>{user.name.slice(0, 1).toUpperCase()}</span>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
                <em>{user.role}</em>
                <small>{formatNumber(user.pets)} mascotas</small>
                <small>{formatNumber(user.posts)} posts</small>
                <small>Ingreso: {user.joinedAt}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section" id="contenido">
          <div className="section-head">
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
                <em>{post.risk}</em>
              </div>
            ))}
          </div>
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
                  <small>{formatNumber(ad.impressions)} impresiones</small>
                  <small>{formatNumber(ad.clicks)} clics</small>
                  <small>CTR {ad.ctr}</small>
                  <div className="monetization-actions">
                    <form action={approveAdAction}>
                      <input type="hidden" name="adId" value={ad.id} />
                      <button className="mini-action approve" disabled={!ad.canApprove} type="submit">
                        Aprobar
                      </button>
                    </form>
                    <form action={rejectAdAction}>
                      <input type="hidden" name="adId" value={ad.id} />
                      <button className="mini-action reject" disabled={!ad.canReject} type="submit">
                        Rechazar
                      </button>
                    </form>
                  </div>
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
                  <th>Campanas</th>
                  <th>Anuncios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.partners.map((partner) => (
                  <tr key={partner.id}>
                    <td>{partner.name}</td>
                    <td>{partner.category}</td>
                    <td>{partner.status}</td>
                    <td>{partner.ctr}</td>
                    <td>{formatNumber(partner.campaigns)}</td>
                    <td>{formatNumber(partner.ads)}</td>
                    <td>
                      <div className="monetization-actions">
                        <form action={verifyBusinessAction}>
                          <input type="hidden" name="businessId" value={partner.id} />
                          <button className="mini-action approve" disabled={partner.verified} type="submit">
                            Verificar
                          </button>
                        </form>
                        <form action={unverifyBusinessAction}>
                          <input type="hidden" name="businessId" value={partner.id} />
                          <button className="mini-action reject" disabled={!partner.verified} type="submit">
                            Retirar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>

        <section className="admin-section" id="moderacion">
          <div className="section-head">
            <div>
              <p>Seguridad</p>
              <h2>Moderacion y confianza</h2>
            </div>
            <form action={scanContentModerationAction}>
              <button className="ghost" type="submit">Escanear publicaciones</button>
            </form>
          </div>
          <div className="trust-box">
            <strong>{formatNumber(dashboard.metrics.pendingReports)} reportes pendientes</strong>
            <p>
              El algoritmo inicial detecta senales de venta de mascotas, drogas, estafas y contenido
              fuera del tema. Las publicaciones sospechosas quedan marcadas para revision humana.
            </p>
          </div>
          <div className="moderation-rules">
            <article>
              <strong>Venta de mascotas</strong>
              <span>Detecta frases como venta de cachorros, precio por mascota o compra directa.</span>
            </article>
            <article>
              <strong>Drogas y sustancias</strong>
              <span>Marca terminos de venta o promocion de drogas y sustancias no permitidas.</span>
            </article>
            <article>
              <strong>Estafas y fuera de tema</strong>
              <span>Prioriza apuestas, armas, contenido adulto y captacion economica sospechosa.</span>
            </article>
          </div>
          <div className="admin-list compact">
            {dashboard.moderationQueue.length ? (
              dashboard.moderationQueue.map((report) => (
                <div key={report.id}>
                  <span>!</span>
                  <strong>{report.reason}</strong>
                  <small>{report.target}</small>
                  <small>{report.details}</small>
                  <em>{report.status}</em>
                  <div className="moderation-actions">
                    <form action={approveModerationReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button className="mini-action approve" type="submit">Aprobar</button>
                    </form>
                    <form action={rejectModerationReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button className="mini-action reject" type="submit">Rechazar</button>
                    </form>
                    <form action={resolveModerationReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button className="mini-action" type="submit">Resolver</button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <span>OK</span>
                <strong>No hay reportes pendientes</strong>
                <small>Cuando el algoritmo o los usuarios reporten contenido, aparecera aqui para revision.</small>
              </div>
            )}
          </div>
          <div className="moderation-history">
            <div className="section-head">
              <div>
                <p>Auditoria</p>
                <h2>Historial reciente</h2>
              </div>
            </div>
            <div className="timeline-list">
              {dashboard.moderationHistory.map((log) => (
                <article key={log.id}>
                  <span>{log.action}</span>
                  <strong>{log.details}</strong>
                  <small>{log.actor} - {log.createdAt}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
