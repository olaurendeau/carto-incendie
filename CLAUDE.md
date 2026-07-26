# CLAUDE.md

## Projet

**Carto Incendie** — outil cartographique simple de gestion d'incendie. Un
administrateur crée une « Zone d'incendie » (nom + centre GPS + niveau de
zoom) et reçoit **une seule fois** un lien secret d'administration pour la
modifier. Les utilisateurs qui ouvrent la page d'une zone voient la carte
centrée sur ce point à ce zoom, et peuvent signaler des « Points d'incendie »
(criticité, note, photos, statut), tous éditables par n'importe qui, et
confirmables avec un « + » (une confirmation par navigateur).

> `poc-nivo/` est un projet de **référence** local, git-ignoré : il ne fait
> pas partie de l'application. Les patterns de cette app en sont largement
> inspirés (carte Leaflet, identité localStorage, upload Cloudinary…).

## Commandes

```bash
npm run dev          # Serveur de dev (Turbopack)
npm run build        # Build de production
npm run lint         # ESLint
npm test             # Tests unitaires (Vitest)
npm run test:e2e     # Tests e2e (Playwright, port 3030)
npx drizzle-kit generate   # Génère une migration SQL depuis le schéma
npx drizzle-kit migrate    # Applique les migrations (lit .env.local)
```

## Architecture

- **Next.js 16 App Router** + React 19 + TypeScript strict + Tailwind CSS 4.
- **Drizzle ORM + Neon PostgreSQL** : client dans `src/lib/db/index.ts`,
  schéma dans `src/lib/db/schema.ts`, migrations commitées dans `drizzle/`.
- **Server actions** dans `src/lib/db/actions.ts` (pattern
  `{ ok: true, ... } | { ok: false, error }` + `revalidatePath`). Lectures
  dans `src/lib/queries.ts`.
- **Cloudinary** pour les photos : server action `uploadFirePhotoAction`
  dans `src/lib/cloudinary.ts` (dossier `fire-points`, stocke
  `{ url, publicId }`).
- **Leaflet / react-leaflet** : toujours importé via `next/dynamic` avec
  `ssr: false` (`ZoneMapView`, formulaires avec `MapPicker`).

### Routes

| Route | Rôle |
|---|---|
| `/` | Liste publique des zones + création |
| `/zone/new` | Formulaire de création de zone (affiche le lien admin une seule fois) |
| `/zone/[id]` | Carte de la zone, centrée sur son centre/zoom |
| `/zone/[id]/edit?token=xxx` | Édition de la zone (token validé côté serveur) |
| `/zone/[id]/point/new?lat=&lng=` | Signalement d'un point d'incendie |
| `/zone/[id]/point/[pointId]/edit` | Édition d'un point (ouverte à tous) |
| `/api/zones/[id]/points` | GET JSON des points (bouton rafraîchir) |

### Schéma DB

- `zones` : id, name, centerLat/centerLng, zoom, **adminToken** (uuid),
  createdAt/updatedAt.
- `fire_points` : id, zoneId (FK cascade), latitude/longitude, criticite
  (`fumerolle | grosse_fumee | flamme`), statut (`en_cours | traite`), note,
  photos (jsonb), confirmations (int), creatorName, creatorQualite
  (`pompier | elu | habitant | autre`), createdAt/updatedAt.

Les enums sont des colonnes `text` + unions TypeScript dans
`src/types/fire.ts` (labels et couleurs inclus) — pas de `pgEnum`.

## Conventions

- **UI en français uniquement**, mobile-first : cibles tactiles
  `min-h-[48px]`, carte plein écran `h-dvh`, contrôles flottants `z-[500+]`.
- **Pas de login** : l'identité (nom + qualité) vit en localStorage et est
  jointe à chaque point créé. Voir `src/lib/storage.ts`.
- **Sécurité du token admin** : `adminToken` ne doit **jamais** apparaître
  dans une lecture publique — toujours sélectionner les colonnes
  explicitement (voir `publicZoneColumns` dans `src/lib/queries.ts`).
  `updateZoneAction` revalide le token dans son `WHERE`, jamais confiance au
  rendu de la page.
- Composants en arrow functions + exports nommés ; pages App Router en
  `export default function`.
- `params` / `searchParams` des pages sont des **Promises** (Next 16) :
  toujours `await`.
- Marqueurs : couleur = criticité (jaune/orange/rouge), gris + bordure verte
  + ✓ quand traité, `+N` = confirmations. Logique pure testable dans
  `src/lib/fire-marker.ts`.

## Clés localStorage

| Clé | Valeur |
|---|---|
| `carto-incendie-identity` | `{ name, qualite }` |
| `carto-incendie-confirmed-points` | `string[]` (ids des points confirmés) |
| `carto-incendie-tile-layer` | `"topo" \| "satellite"` |
| `carto-incendie-my-zones` | `[{ zoneId, adminToken }]` (secours liens admin) |

## Variables d'environnement

`.env.local` (git-ignoré, voir `.env.example`) :

- `DATABASE_URL` — PostgreSQL Neon (`?sslmode=require`)
- `CLOUDINARY_URL` — `cloudinary://<api_key>:<api_secret>@<cloud_name>`
