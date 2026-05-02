import Link from "next/link";
import type { CSSProperties } from "react";

export default function HomePage() {
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

        <Link className="primary-action" href="/admin">Panel admin</Link>
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
            <div className="pet-photo">🐶</div>
            <div>
              <p className="tiny-label">Mascota destacada</p>
              <h2>Luna</h2>
              <p>Golden Retriever · 2 años · San José</p>
            </div>
            <div className="pet-stats">
              <span><strong>1.2k</strong> amigos</span>
              <span><strong>48</strong> rutas</span>
              <span><strong>12</strong> eventos</span>
            </div>
          </aside>
        </section>

        <section className="app-shell" id="feed">
          <aside className="sidebar panel">
            <h2>Mi manada</h2>
            <div className="profile-mini active">
              <span>🐕</span>
              <div>
                <strong>Max</strong>
                <small>Listo para pasear</small>
              </div>
            </div>
            <div className="profile-mini">
              <span>🐈</span>
              <div>
                <strong>Misha</strong>
                <small>Busca amigos tranquilos</small>
              </div>
            </div>
            <div className="profile-mini">
              <span>🐇</span>
              <div>
                <strong>Nube</strong>
                <small>Exploradora indoor</small>
              </div>
            </div>

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

            <article className="post-card">
              <div className="post-header">
                <div className="avatar warm">🐕</div>
                <div>
                  <strong>Max</strong>
                  <small>Parque La Sabana · hace 18 min</small>
                </div>
              </div>
              <p>
                Probamos una ruta nueva con mucha sombra. Ideal para perros nerviosos
                porque hay espacios abiertos y pocos ruidos fuertes.
              </p>
              <div className="post-media park-scene">
                <span>Ruta segura</span>
              </div>
              <div className="post-actions">
                <button>❤️ 128</button>
                <button>💬 24</button>
                <button>📍 Guardar ruta</button>
              </div>
            </article>

            <article className="post-card compact-post">
              <div className="post-header">
                <div className="avatar cool">🐈</div>
                <div>
                  <strong>Misha</strong>
                  <small>Casa · hace 1 h</small>
                </div>
              </div>
              <p>Busco recomendaciones de rascadores resistentes. Misha declaró guerra al sofá.</p>
              <div className="poll">
                <span style={{ "--value": "72%" } as CSSProperties}>Cartón reforzado <strong>72%</strong></span>
                <span style={{ "--value": "28%" } as CSSProperties}>Madera + sisal <strong>28%</strong></span>
              </div>
            </article>
          </section>

          <aside className="right-rail">
            <section className="panel" id="explorar">
              <h2>Cerca de ti</h2>
              <div className="nearby-grid">
                <div><span>🐩</span><strong>Nala</strong><small>800 m</small></div>
                <div><span>🐕‍🦺</span><strong>Rocky</strong><small>1.4 km</small></div>
                <div><span>🐈‍⬛</span><strong>Simba</strong><small>2.1 km</small></div>
              </div>
            </section>

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
