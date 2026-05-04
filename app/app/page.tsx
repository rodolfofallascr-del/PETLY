import Link from "next/link";
import { createPetAction, createPostAction } from "./actions";
import { requireRole } from "@/src/lib/auth";
import { getUserDashboardData } from "@/src/lib/user-dashboard";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CR").format(value);
}

type UserAppPageProps = {
  searchParams?: Promise<{
    pet?: string;
    post?: string;
  }>;
};

export default async function UserAppPage({ searchParams }: UserAppPageProps) {
  const session = await requireRole("USER", "/app");
  const params = await searchParams;
  const dashboard = await getUserDashboardData(session);

  return (
    <main className="role-page user-app-page">
      <section className="role-hero">
        <div>
          <p>Mi Petly</p>
          <h1>Bienvenido, {session.name}</h1>
          <span>Tu espacio para mascotas, publicaciones, amigos y adopciones.</span>
          <div className="admin-header-badges">
            <span className={`role-pill ${dashboard.source === "database" ? "success" : "warning"}`}>
              {dashboard.source === "database" ? "Base conectada" : "Modo demo"}
            </span>
          </div>
        </div>
        <Link href="/login" className="role-link">Cambiar cuenta</Link>
      </section>

      {params?.pet === "created" ? (
        <div className="business-alert success">Mascota registrada correctamente.</div>
      ) : null}
      {params?.pet === "missing" ? (
        <div className="business-alert warning">Nombre y especie son obligatorios.</div>
      ) : null}
      {params?.pet === "error" ? (
        <div className="business-alert warning">No se pudo registrar la mascota.</div>
      ) : null}
      {params?.post === "created" ? (
        <div className="business-alert success">Publicacion creada. Si requiere revision, aparecera en el admin.</div>
      ) : null}
      {params?.post === "missing" ? (
        <div className="business-alert warning">El texto de la publicacion es obligatorio.</div>
      ) : null}
      {params?.post === "error" ? (
        <div className="business-alert warning">No se pudo crear la publicacion.</div>
      ) : null}

      <section className="role-grid">
        <article>
          <p>Mascotas</p>
          <strong>{formatNumber(dashboard.metrics.pets)}</strong>
          <span>Crea perfiles para tus mascotas y comparte su personalidad.</span>
        </article>
        <article>
          <p>Publicaciones</p>
          <strong>{formatNumber(dashboard.metrics.posts)}</strong>
          <span>Comparte rutas, fotos, recomendaciones y momentos.</span>
        </article>
        <article>
          <p>En revision</p>
          <strong>{formatNumber(dashboard.metrics.pendingReviews)}</strong>
          <span>Contenido marcado por el algoritmo o pendiente de confianza.</span>
        </article>
      </section>

      <section className="business-workspace">
        <article className="business-card">
          <div>
            <p>Mascotas</p>
            <h2>Registrar perfil</h2>
          </div>
          <form action={createPetAction} className="business-form">
            <label>
              Nombre
              <input name="name" placeholder="Luna" required />
            </label>
            <label>
              Especie
              <select name="species" defaultValue="DOG" required>
                <option value="DOG">Perro</option>
                <option value="CAT">Gato</option>
                <option value="RABBIT">Conejo</option>
                <option value="BIRD">Ave</option>
                <option value="REPTILE">Reptil</option>
                <option value="OTHER">Otra</option>
              </select>
            </label>
            <label>
              Raza
              <input name="breed" placeholder="Golden Retriever" />
            </label>
            <label>
              Ciudad
              <input name="city" placeholder="San Jose" />
            </label>
            <label className="wide">
              Personalidad
              <input name="personality" placeholder="Juguetona, tranquila, sociable..." />
            </label>
            <label className="wide">
              Bio
              <textarea name="bio" placeholder="Cuéntanos algo especial de tu mascota." />
            </label>
            <button type="submit">Guardar mascota</button>
          </form>
        </article>

        <article className="business-card">
          <div>
            <p>Publicar</p>
            <h2>Compartir momento</h2>
          </div>
          <form action={createPostAction} className="business-form">
            <label className="wide">
              Mascota
              <select name="petId" defaultValue="">
                <option value="">Publicacion general</option>
                {dashboard.pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>{pet.name}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              Texto
              <textarea
                name="body"
                placeholder="Comparte una ruta, consejo, historia o momento de tu mascota."
                required
              />
            </label>
            <button type="submit">Publicar</button>
          </form>
        </article>
      </section>

      <section className="role-panel">
        <div>
          <p>Actividad reciente</p>
          <h2>Mascotas y publicaciones</h2>
        </div>
        <div className="user-activity-grid">
          <div className="business-ad-list">
            {dashboard.pets.length ? (
              dashboard.pets.map((pet) => (
                <article key={pet.id}>
                  <strong>{pet.name}</strong>
                  <span>{pet.species} - {pet.breed}</span>
                  <small>{pet.city}</small>
                </article>
              ))
            ) : (
              <p>Aun no tienes mascotas registradas.</p>
            )}
          </div>
          <div className="business-ad-list">
            {dashboard.posts.length ? (
              dashboard.posts.map((post) => (
                <article key={post.id}>
                  <strong>{post.pet}</strong>
                  <span>{post.body}</span>
                  <em>{post.status}</em>
                  <small>{post.createdAt}</small>
                </article>
              ))
            ) : (
              <p>Aun no tienes publicaciones.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
