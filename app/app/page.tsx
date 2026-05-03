import Link from "next/link";
import { requireRole } from "@/src/lib/auth";

export default async function UserAppPage() {
  const session = await requireRole("USER", "/app");

  return (
    <main className="role-page user-app-page">
      <section className="role-hero">
        <div>
          <p>Mi Petly</p>
          <h1>Bienvenido, {session.name}</h1>
          <span>Tu espacio para mascotas, publicaciones, amigos y adopciones.</span>
        </div>
        <Link href="/login" className="role-link">Cambiar cuenta</Link>
      </section>

      <section className="role-grid">
        <article>
          <p>Mascotas</p>
          <strong>0</strong>
          <span>Crea perfiles para tus mascotas y comparte su personalidad.</span>
        </article>
        <article>
          <p>Publicaciones</p>
          <strong>0</strong>
          <span>Comparte rutas, fotos, recomendaciones y momentos.</span>
        </article>
        <article>
          <p>Adopciones</p>
          <strong>0</strong>
          <span>Guarda historias y conecta con procesos responsables.</span>
        </article>
      </section>

      <section className="role-panel">
        <div>
          <p>Siguiente paso</p>
          <h2>Primer perfil de mascota</h2>
        </div>
        <p>
          Aqui construiremos el flujo para registrar mascotas, subir foto, especie, edad,
          ubicacion aproximada y preferencias sociales.
        </p>
      </section>
    </main>
  );
}
