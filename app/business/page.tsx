import Link from "next/link";
import { saveBusinessProfileAction, submitAdForReviewAction } from "./actions";
import { getBusinessDashboardData } from "@/src/lib/business-dashboard";
import { requireRole } from "@/src/lib/auth";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CR").format(value);
}

type BusinessPageProps = {
  searchParams?: Promise<{
    ad?: string;
    profile?: string;
  }>;
};

export default async function BusinessPage({ searchParams }: BusinessPageProps) {
  const session = await requireRole("BUSINESS", "/business");
  const params = await searchParams;
  const dashboard = await getBusinessDashboardData(session);

  return (
    <main className="role-page business-page">
      <section className="role-hero">
        <div>
          <p>Panel de empresa</p>
          <h1>Hola, {session.name}</h1>
          <span>Gestiona tu perfil comercial, anuncios privados y revisiones dentro de Petly.</span>
          <div className="admin-header-badges">
            <span className={`role-pill ${dashboard.source === "database" ? "success" : "warning"}`}>
              {dashboard.source === "database" ? "Base conectada" : "Modo demo"}
            </span>
            <span className={`role-pill ${dashboard.business?.verified ? "success" : "warning"}`}>
              {dashboard.business?.verified ? "Empresa verificada" : "Pendiente de verificacion"}
            </span>
          </div>
        </div>
        <Link href="/login" className="role-link">Cambiar cuenta</Link>
      </section>

      {params?.profile === "saved" ? (
        <div className="business-alert success">Perfil comercial guardado. El admin ya puede revisarlo.</div>
      ) : null}
      {params?.profile === "missing" ? (
        <div className="business-alert warning">Nombre y categoria son obligatorios.</div>
      ) : null}
      {params?.profile === "error" ? (
        <div className="business-alert warning">No se pudo guardar el perfil comercial.</div>
      ) : null}
      {params?.ad === "submitted" ? (
        <div className="business-alert success">Anuncio enviado a revision del administrador.</div>
      ) : null}
      {params?.ad === "profile-required" ? (
        <div className="business-alert warning">Primero completa el perfil comercial antes de enviar anuncios.</div>
      ) : null}
      {params?.ad === "missing" ? (
        <div className="business-alert warning">Titulo, texto y URL del anuncio son obligatorios.</div>
      ) : null}
      {params?.ad === "error" ? (
        <div className="business-alert warning">No se pudo enviar el anuncio a revision.</div>
      ) : null}

      <section className="role-grid">
        <article>
          <p>Campanas</p>
          <strong>{formatNumber(dashboard.metrics.campaigns)}</strong>
          <span>Crea campanas privadas para feed, historias o directorio.</span>
        </article>
        <article>
          <p>Anuncios</p>
          <strong>{formatNumber(dashboard.metrics.ads)}</strong>
          <span>Revisa estado, creatividad, ubicaciones y aprobaciones.</span>
        </article>
        <article>
          <p>Rendimiento</p>
          <strong>{formatNumber(dashboard.metrics.clicks)}</strong>
          <span>{formatNumber(dashboard.metrics.impressions)} impresiones registradas.</span>
        </article>
      </section>

      <section className="business-workspace">
        <article className="business-card">
          <div>
            <p>Perfil comercial</p>
            <h2>Datos para verificacion</h2>
          </div>
          <form action={saveBusinessProfileAction} className="business-form">
            <label>
              Nombre de empresa
              <input name="name" defaultValue={dashboard.business?.name ?? session.name} required />
            </label>
            <label>
              Categoria
              <input name="category" defaultValue={dashboard.business?.category ?? "Veterinaria"} required />
            </label>
            <label>
              Ciudad
              <input name="city" defaultValue={dashboard.business?.city ?? ""} placeholder="San Jose" />
            </label>
            <label>
              Telefono
              <input name="phone" defaultValue={dashboard.business?.phone ?? ""} placeholder="+506 0000 0000" />
            </label>
            <label>
              Sitio web
              <input name="website" defaultValue={dashboard.business?.website ?? ""} placeholder="https://..." />
            </label>
            <label className="wide">
              Descripcion
              <textarea
                name="description"
                defaultValue={dashboard.business?.description ?? ""}
                placeholder="Describe servicios, cobertura, horarios o especialidades."
              />
            </label>
            <button type="submit">Guardar perfil</button>
          </form>
        </article>

        <article className="business-card">
          <div>
            <p>Anuncios privados</p>
            <h2>Enviar a revision</h2>
          </div>
          <form action={submitAdForReviewAction} className="business-form">
            <label className="wide">
              Titulo del anuncio
              <input name="title" placeholder="Chequeo preventivo para mascotas" required />
            </label>
            <label className="wide">
              Texto del anuncio
              <textarea name="body" placeholder="Agenda una cita esta semana y recibe..." required />
            </label>
            <label className="wide">
              URL destino
              <input name="targetUrl" placeholder="https://tusitio.com/promocion" required />
            </label>
            <button type="submit">Enviar anuncio</button>
          </form>
        </article>
      </section>

      <section className="role-panel">
        <div>
          <p>Anuncios recientes</p>
          <h2>Estado de revision</h2>
        </div>
        {dashboard.ads.length ? (
          <div className="business-ad-list">
            {dashboard.ads.map((ad) => (
              <article key={ad.id}>
                <strong>{ad.title}</strong>
                <span>{ad.body}</span>
                <em>{ad.status}</em>
                <small>{ad.placement} - {formatNumber(ad.impressions)} impresiones - {formatNumber(ad.clicks)} clics</small>
              </article>
            ))}
          </div>
        ) : (
          <p>Aun no hay anuncios enviados. Cuando envies uno, quedara pendiente para revision del administrador.</p>
        )}
      </section>
    </main>
  );
}
