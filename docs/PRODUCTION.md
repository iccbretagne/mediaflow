# Mise en production

Ce guide est pratique et centré sur l'existant du repo (Next.js + Prisma + S3). Il ne suppose aucun outil particulier (Docker, PM2, etc.).

## 1) Prerequis

- Node.js 20+
- MySQL/MariaDB accessible en production
- Bucket OVH Object Storage (S3 compatible)
- Google OAuth configure avec l'URL publique

## 2) Variables d'environnement

Les variables sont dans `.env.example`. Points importants en production :

- `APP_URL` : URL publique (utilisee pour generer les liens de partage)
- `NEXTAUTH_URL` : URL publique (NextAuth)
- `NEXTAUTH_SECRET` : secret fort (obligatoire)
- `AUTH_TRUST_HOST` : `true` si vous etes derriere un proxy/ingress
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `SUPER_ADMIN_EMAILS` : emails auto-approves, separes par des virgules
- `S3_*` : credentials OVH

Base de donnees :

- **Migrations (Prisma)** : utilise `DATABASE_URL`
- **Runtime** : utilise `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`src/lib/prisma.ts`)

### Liste exhaustive des variables

Database :
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Auth :
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_TRUST_HOST`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SUPER_ADMIN_EMAILS`

Stockage :
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

App :
- `APP_URL`

## 3) Migrations

Appliquer les migrations en production :

```bash
npx prisma migrate deploy
```

Assure-toi que `DATABASE_URL` pointe vers la base de production.

## 4) Build et demarrage

```bash
npm install
npm run build  # Génère automatiquement le client Prisma puis build Next.js
npm run start
```

**Note :** Le script `build` dans `package.json` exécute automatiquement `prisma generate` avant `next build`. Si vous buildez manuellement avec `next build`, pensez à exécuter `npx prisma generate` d'abord.

Lancement avec `NODE_ENV=production` (Next.js le gere automatiquement au build).

## 4.1) Service systemd (optionnel mais recommande)

Exemple de service simple pour lancer l'app au boot. Adapter `User`, `WorkingDirectory`, et les chemins.

```ini
# /etc/systemd/system/picflow.service
[Unit]
Description=PicFlow (Next.js)
After=network.target

[Service]
Type=simple
User=picflow
WorkingDirectory=/srv/picflow
EnvironmentFile=/srv/picflow/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

Commandes systemd :

```bash
sudo systemctl daemon-reload
sudo systemctl enable picflow
sudo systemctl start picflow
sudo systemctl status picflow
```

Logs :

```bash
journalctl -u picflow -f
```

## 5) OAuth Google

Configurer les redirect URIs dans Google Cloud Console :

- `{APP_URL}/api/auth/callback/google`

## 6) S3 (OVH)

L'app utilise des URLs signees. Le bucket **n'a pas besoin d'etre public**.

Verifier :
- Endpoint, region, bucket
- Credentials en lecture/ecriture

## 7) Checklist de mise en prod

- [ ] Variables d'environnement configurees
- [ ] Migrations appliquees (`npx prisma migrate deploy`)
- [ ] Client Prisma genere (`npx prisma generate`)
- [ ] OAuth Google configure
- [ ] Bucket S3 fonctionnel
- [ ] Build reussi (`npm run build`)
- [ ] Login Google OK
- [ ] Upload OK
- [ ] Validation OK
- [ ] Download (ZIP) OK

## 8) Points d'attention

- L'API ZIP genere les archives a la vollee (peut etre lourd si tres gros volumes).
- Pas de service worker (PWA offline) pour l'instant.
