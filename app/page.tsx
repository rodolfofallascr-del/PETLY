import Link from "next/link";
import type { CSSProperties } from "react";
import { getPublicFeedData } from "@/src/lib/public-feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const feed = await getPublicFeedData();

  return (
    <div className="landing-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <Link className="brand" href="/" aria-label="Inicio de Petly">
          <span className="brand-mark">P</span>
          <span>Petly</span>
        </Link>

        <nav className="nav" aria-label="Secciones principales">
          <a href="#feed">Inicio</a>
          <a href="#explorar">Explorar</a>
          <a href="#eventos">Eventos</a>
          <a href="#adopciones">Adopciones</a>
        </nav>

        <Link className="primary-action" href="/login">Entrar</Link>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">La comunidad donde las mascotas tienen voz</p>
            <h1>Una red social pensada para mascotas, sus familias y su mundo.</h1>
            <p className="hero-text">
              Comparte momentos, encuentra amigos peludos cerca, agenda paseos,
              descubre eventos pet-friendly y conecta con adopciones responsables.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#feed">Ver demo</a>
              <a className="button button-light" href="#roadmap">Plan MVP</a>
            </div>
          </div>

          <aside className="pet-card hero-card" aria-label="Perfil destacado de mascota">
            <div className="pet-photo">{feed.featuredPet.icon}</div>
            <div>
              <p className="tiny-label">Mascota destacada</p>
              <h2>{feed.featuredPet.name}</h2>
              <p>{feed.featuredPet.meta}</p>
            </div>
            <div className="pet-stats">
              <span><strong>{feed.source === "database" ? "Live" : "Demo"}</strong> estado</span>
              <span><strong>{feed.posts.length}</strong> posts</span>
              <span><strong>{feed.nearbyPets.length}</strong> mascotas</span>
            </div>
          </aside>
        </section>

        <section className="app-shell" id="feed">
          <aside className="sidebar panel">
            <h2>Mi manada</h2>
            {feed.nearbyPets.slice(0, 3).map((pet, index) => (
              <div className={`profile-mini ${index === 0 ? "active" : ""}`} key={pet.id}>
                <span>{pet.icon}</span>
                <div>
                  <strong>{pet.name}</strong>
                  <small>{index === 0 ? "Perfil destacado" : "Cerca de la comunidad"}</small>
                </div>
              </div>
            ))}

            <div className="health-box">
              <p className="tiny-label">Recordatorio</p>
              <strong>Vacuna de Max en 6 días</strong>
              <span>Activa alertas para cuidados, comida y citas veterinarias.</span>
            </div>
          </aside>

          <section className="feed panel" aria-label="Feed social de mascotas">
            <div className="composer">
              <div className="avatar">🐾</div>
              <button>¿Qué aventura tuvo tu mascota hoy?</button>
            </div>

            {feed.posts.map((post, index) => (
              <article className={`post-card ${index > 0 ? "compact-post" : ""}`} key={post.id}>
                <div className="post-header">
                  <div className={`avatar ${index % 2 === 0 ? "warm" : "cool"}`}>{post.icon}</div>
                  <div>
                    <strong>{post.author}</strong>
                    <small>{post.meta}</small>
                  </div>
                </div>
                <p>{post.body}</p>
                {index === 0 ? (
                  <div className="post-media park-scene">
                    <span>Comunidad Petly</span>
                  </div>
                ) : (
                  <div className="poll">
                    <span style={{ "--value": "72%" } as CSSProperties}>Contenido aprobado <strong>72%</strong></span>
                    <span style={{ "--value": "28%" } as CSSProperties}>Interacciones <strong>28%</strong></span>
                  </div>
                )}
                <div className="post-actions">
                  <button>Me gusta</button>
                  <button>Comentar</button>
                  <button>Guardar</button>
                </div>
              </article>
            ))}
          </section>

          <aside className="right-rail">
            <section className="panel" id="explorar">
              <h2>Cerca de ti</h2>
              <div className="nearby-grid">
                {feed.nearbyPets.slice(0, 3).map((pet) => (
                  <div key={pet.id}><span>{pet.icon}</span><strong>{pet.name}</strong><small>{pet.distance}</small></div>
                ))}
              </div>
            </section>

            {feed.ad ? (
              <section className="panel sponsor-card">
                <p className="tiny-label">Anuncio aprobado</p>
                <h2>{feed.ad.title}</h2>
                <p>{feed.ad.body}</p>
                <a href={feed.ad.targetUrl}>Ver promocion</a>
              </section>
            ) : null}

            <section className="panel event-card" id="eventos">
              <p className="tiny-label">Próximo evento</p>
              <h2>Caminata Petly</h2>
              <p>Domingo · 8:00 a. m. · Parque del Este</p>
              <button>Unirme</button>
            </section>

            <section className="panel adoption-card" id="adopciones">
              <p className="tiny-label">Adopción responsable</p>
              <h2>Toby busca hogar</h2>
              <p>Cachorro mixto, vacunado y muy sociable con niños.</p>
              <a href="#">Ver historia</a>
            </section>
          </aside>
        </section>

        <section className="roadmap" id="roadmap">
          <p className="eyebrow">MVP sugerido</p>
          <h2>Construyamos primero lo que valida la comunidad.</h2>
          <div className="roadmap-grid">
            <article>
              <span>01</span>
              <h3>Perfiles de mascotas</h3>
              <p>Nombre, especie, edad, fotos, ubicación aproximada, personalidad y cuidados.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Feed social</h3>
              <p>Publicaciones, fotos, likes, comentarios y guardado de rutas o tips.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Conexiones locales</h3>
              <p>Amigos cercanos, eventos pet-friendly, paseos y filtros por compatibilidad.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Bienestar y adopción</h3>
              <p>Recordatorios, veterinarias, adopciones verificadas y alertas comunitarias.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
