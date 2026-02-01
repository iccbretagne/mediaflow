# État des lieux & Backlog

> Dernière mise à jour : janvier 2026

Ce document synthétise l'état actuel du projet et le reste à faire.

**Documents liés :**
- [CLAUDE.md](../CLAUDE.md) - Contexte IA complet
- [WORKFLOWS.md](./WORKFLOWS.md) - Schémas des flux de validation
- [PLAN_MEDIA_EXTENSION.md](./PLAN_MEDIA_EXTENSION.md) - Plan d'évolution

---

## 1) Comparatif “Claude” vs “code observé”

### Résumé rapide
- **MVP globalement fonctionnel** : auth, events, upload, partage, validation, download, API.
- **Écarts clés** : Swagger UI absente, nombre de routes API sous‑estimé, formats upload pas alignés.
- **UI** : charte ICC appliquée aux pages auth + nouveaux composants Input/Select/Textarea/Badge.

### Tableau comparatif

| Module | Claude | Code observé | Écart / note |
|---|---|---|---|
| Auth | Login Google, routes protégées | ✅ OK (`src/lib/auth.ts`, `src/app/(auth)/*`) | — |
| Dashboard | Liste événements + stats | ✅ OK (`src/app/(auth)/dashboard/page.tsx`) | — |
| Événements | Création, détail, upload, suppression | ✅ OK (UI + API) | Édition d’événement dispo en API mais pas d’UI (`src/app/api/events/[id]/route.ts`) |
| Partage | Tokens validation/téléchargement | ✅ OK (UI + API) | — |
| Validation | “Swipe + grid récap” | ✅ Swipe tactile + recap filtrable + skip | Badge statut visible, raccourcis clavier, auto-récap en fin de liste (`src/app/(public)/v/[token]/page.tsx`) |
| Téléchargement | Page média + ZIP | ✅ OK (page + ZIP) | ZIP sync côté API (peut être lourd) |
| API | — | ✅ 18 routes API | Format standardisé `{ data }` |

---

## 2) Ce qui est bien en place (MVP)

- **Flow complet** : upload → validation → téléchargement validé (ZIP).
- **Tokens de partage** : génération, listing, suppression.
- **Validation** : décisions + recap filtrable + swipe + skip + statut event (passe à REVIEWED si plus de pending).
- **Stockage S3** : upload original + thumbnail, URLs signées.
- **Liens publics projets** : tokens VALIDATOR/MEDIA utilisables sur `/v/:token` et `/d/:token`.

---

## 3) Points d'attention

- **Swagger UI** : `/api/docs` expose l'OpenAPI JSON, mais pas de page `/docs` avec interface Swagger UI.
- **Upload formats** : backend accepte HEIC/HEIF, input UI limite à jpeg/png/webp (à aligner).

---

## 4) Reste à faire (proposé)

### Priorité basse (améliorations)
- **Tests** : Vitest unitaires + Playwright e2e (aucun test actuellement).
- **PWA complète** : service worker + offline (manifest déjà présent dans `public/manifest.json`).
- **Emails** : notifications aux validateurs et à l’équipe média (pas d’intégration).
- **ZIP async** : job queue ou génération différée pour gros volumes.

### À considérer (qualité/UX)
- **Page `/docs`** : intégrer Swagger UI côté front ou page dédiée.

### ⚠️ HEIC/HEIF (iPhone) — Non supporté

Le support HEIC/HEIF a été investigué et abandonné en raison de la complexité d'implémentation :

- **Sharp** (via libvips) inclut `libheif` mais uniquement avec le codec AV1 (AVIF). Le codec H.265 utilisé par HEIC n'est pas compilé, probablement pour des raisons de licence (brevets H.265).
- **Problèmes identifiés** : les navigateurs envoient `application/octet-stream` comme MIME type pour les fichiers HEIC (pas `image/heic`), ce qui nécessite une résolution par extension.
- **Solutions possibles** (non implémentées) :
  - `heic-convert` (npm) : décodeur JavaScript pur, mais synchrone et lent sur de gros fichiers
  - Compilation custom de libvips/libheif avec libde265
  - Pré-conversion côté client avec `heic2any`
- **Recommandation** : demander aux utilisateurs iPhone de convertir en JPEG avant upload (réglage iOS : Réglages > Appareil photo > Formats > Le plus compatible).

---

## 5) Roadmap : Extension Média

Voir [PLAN_MEDIA_EXTENSION.md](./PLAN_MEDIA_EXTENSION.md) pour le plan complet.

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1. Fondation | Schema Prisma, Zod schemas, migration Photo→Media | 🔜 À faire |
| 2. Projets | CRUD projets, pages admin | 🔜 À faire |
| 3. Upload presigned | Sign/confirm routes, MediaUploader | 🔜 À faire |
| 4. Workflow révision | Commentaires, transitions, ReviewModal | 🔜 À faire |
| 5. Versioning | Upload versions, VersionTimeline | 🔜 À faire |
| 6. Rétention | Cron cleanup, settings UI | 🔜 À faire |

---

## 6) Références utiles

- Validation UI : `src/app/(public)/v/[token]/page.tsx`
- Téléchargement media : `src/app/(public)/d/[token]/page.tsx`
- Partage : `src/app/(auth)/events/[id]/share/page.tsx`
- API docs : `src/app/api/docs/route.ts`
- Routes API : `src/app/api/**/route.ts`
