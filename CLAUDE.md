# PicFlow - Contexte IA

Ce fichier fournit le contexte nécessaire pour qu'un agent IA puisse comprendre et contribuer au projet.

## Résumé du projet

**PicFlow** est une PWA de validation de photos pour les églises. Elle permet :
1. À l'équipe photo d'uploader des photos d'événements
2. Aux pasteurs/responsables de valider les photos via une interface mobile simple (swipe)
3. À l'équipe média de télécharger les photos validées

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Next.js    │────▶│   MySQL     │
│   (PWA)     │     │  (API)      │     │   (Prisma)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ OVH Object  │
                   │ Storage (S3)│
                   └─────────────┘
```

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 14+ (App Router) |
| BDD | MySQL + Prisma ORM |
| Auth | NextAuth.js v5 (Google OAuth) |
| Stockage | OVH Object Storage (S3-compatible) |
| Validation | Zod + zod-to-openapi |
| Styling | Tailwind CSS |
| Images | Sharp (thumbnails) |

## Structure du projet

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Routes API REST
│   ├── (auth)/            # Pages admin (authentifiées)
│   ├── (public)/          # Pages publiques (token)
│   │   ├── v/[token]/     # Validation mobile
│   │   └── d/[token]/     # Téléchargement
│   └── docs/              # Swagger UI
├── components/            # Composants React
│   ├── ui/               # Composants génériques
│   ├── validation/       # Swipe, Grid, etc.
│   └── ...
└── lib/                   # Utilitaires
    ├── schemas/          # Schémas Zod (source de vérité)
    ├── auth.ts           # Config NextAuth
    ├── prisma.ts         # Client Prisma
    ├── s3.ts             # Client S3
    ├── sharp.ts          # Traitement images
    ├── tokens.ts         # Gestion tokens partage
    └── api-utils.ts      # Helpers API
```

## Modèle de données

Voir `prisma/schema.prisma` pour le schéma complet.

**Entités principales :**
- `User` - Utilisateurs admin (Google OAuth)
- `Event` - Événements (culte, conférence, etc.)
- `Photo` - Photos avec status (PENDING/APPROVED/REJECTED)
- `ShareToken` - Liens de partage (VALIDATOR/MEDIA)

## API

Spec OpenAPI complète : `docs/openapi.yaml`

**Endpoints principaux :**
- `GET/POST /api/events` - CRUD événements
- `POST /api/photos/upload` - Upload multiple
- `GET/PATCH /api/validate/[token]` - Validation
- `GET /api/download/[token]` - Téléchargement

## Principes de développement

1. **IA-first** : Code clair, bien structuré, schémas Zod comme source de vérité
2. **Mobile-first** : L'interface de validation doit être ultra-simple sur mobile
3. **Sécurité** : Validation Zod sur toutes les entrées, tokens sécurisés
4. **Maintenabilité** : Architecture simple, peu de dépendances

## Conventions de code

- TypeScript strict
- Schémas Zod dans `src/lib/schemas/`
- Types inférés depuis Zod (pas de types manuels)
- Composants UI réutilisables dans `src/components/ui/`
- Pas de console.log en production
- Gestion d'erreurs centralisée via `ApiError`

## État actuel

### Implémenté ✅
- Schéma Prisma complet
- Toutes les routes API
- Auth Google (NextAuth)
- Page de login
- Page de validation mobile (swipe + grid)
- Utilitaires S3, Sharp, tokens

### À compléter 🚧
- Page dashboard admin (liste événements)
- Page détail événement (upload + gestion)
- Page de téléchargement pour l'équipe média
- Tests unitaires et e2e
- PWA service worker (offline)
- Notifications email

## Pour démarrer

```bash
# Installation
npm install
cp .env.example .env  # Configurer les variables

# Base de données
npx prisma generate
npx prisma migrate dev

# Développement
npm run dev
```

## Documentation

- [Expression de Besoin](./docs/EXPRESSION_BESOIN.md) - Contexte métier complet
- [Conception Technique](./docs/CONCEPTION_TECHNIQUE.md) - Architecture détaillée
- [OpenAPI Spec](./docs/openapi.yaml) - Spec API complète
