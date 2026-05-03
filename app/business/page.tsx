import Link from "next/link";
import { requireRole } from "@/src/lib/auth";

export default async function BusinessPage() {
  const session = await requireRole("BUSINESS", "/business");

  return (
    <main className="role-page business-page">
      <section className="role-hero">
        <div>
          <p>Panel de empresa</p>
          <h1>Hola, {session.name}</h1>
          <span>Gestiona tu presencia comercial dentro de Petly.</span>
        </div>
        <Link href="/login" className="role-link">Cambiar cuenta</Link>
      </section>

      <section className="role-grid">
        <article>
          <p>Campañas</p>
          <strong>0</strong>
          <span>Crea campañas privadas para el feed, historias o directorio.</span>
        </article>
        <article>
          <p>Anuncios</p>
          <strong>0</strong>
          <span>Revisa estado, creatividad, ubicaciones y aprobaciones.</span>
        </article>
        <article>
          <p>Leads</p>
          <strong>0</strong>
          <span>Futuros contactos desde veterinarias, tiendas y servicios.</span>
        </article>
      </section>

      <section className="role-panel">
        <div>
          <p>Siguiente paso</p>
          <h2>Perfil comercial y verificacion</h2>
        </div>
        <p>
          Aqui construiremos el flujo para que una empresa complete datos, solicite verificacion,
          compre visibilidad y vea metricas de campanas.
        </p>
      </section>
    </main>
  );
}
