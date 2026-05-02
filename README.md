# Petly

Red social para mascotas con landing pública, panel administrativo protegido y capa de datos preparada para escalar.

## Rutas

- `/`: experiencia pública, feed demo, perfiles de mascotas, eventos, adopciones y roadmap MVP.
- `/login`: acceso demo con cookies firmadas.
- `/admin`: panel administrativo protegido para rol `ADMIN`.

## Cuentas Demo

- Admin: `admin` / `admin123`
- Empresa: `empresa` / `empresa123`
- Usuario: `usuario` / `usuario123`

Solo la cuenta `admin` puede entrar a `/admin`.

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Seguridad Actual

La app usa una sesión demo firmada con `AUTH_SECRET` para validar el flujo de roles. Antes de producción debemos cambiar `AUTH_SECRET`, conectar usuarios reales desde PostgreSQL, agregar hash de contraseñas y, preferiblemente, integrar OAuth/email mediante un proveedor de autenticación.

## Base de datos

El proyecto usa Prisma 7 con PostgreSQL.

1. Copiar `.env.example` a `.env`.
2. Ajustar `DATABASE_URL` con la conexión real.
3. Ejecutar `npm run prisma:generate`.
4. Ejecutar `npm run prisma:migrate` cuando exista una base PostgreSQL disponible.

## Modelos iniciales

- `User`: usuarios con roles `USER`, `BUSINESS` y `ADMIN`.
- `Pet`: perfiles de mascotas.
- `Post`, `Comment`, `Reaction`: feed social.
- `Business`: empresas privadas verificables.
- `Campaign`, `Ad`, `AdImpression`, `AdClick`: monetización y medición publicitaria.
- `Adoption`: adopciones responsables.
- `Event`: eventos pet-friendly.
- `Report`: moderación, reportes y confianza.

## Monetización prevista

- Google AdSense o Google Ad Manager para inventario automatizado.
- Campañas privadas vendidas a veterinarias, groomers, tiendas y marcas.
- Directorio premium de servicios pet-friendly.
- Métricas de impresiones, clics, CTR e ingresos por campaña.
