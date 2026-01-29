# Expression de Besoin - Plateforme de Validation Photos Églises

## 1. Contexte

### 1.1 Organisation
Réseau d'églises disposant d'équipes bénévoles pour la communication :
- **Équipe Photo** : capture et traitement des photos lors des cultes et événements
- **Validateurs** : pasteurs, bergers ou responsables communication de chaque église
- **Équipe Production Média** : création de visuels à partir des photos validées

### 1.2 Problème actuel
Le workflow de validation passe actuellement par **WhatsApp** :
- Les photos sont envoyées dans un groupe WhatsApp
- Les validateurs téléchargent, examinent, puis republient les photos validées dans le même groupe
- L'équipe média doit ensuite récupérer les photos validées

**Limitations identifiées :**
- Compression des images par WhatsApp (perte de qualité)
- Pas de traçabilité claire des validations
- Difficile de retrouver les photos validées ultérieurement
- Processus fastidieux et source d'erreurs
- Pas de stockage organisé et pérenne

---

## 2. Objectifs

### 2.1 Objectif principal
Mettre en place une plateforme de validation de médias **simple, intuitive et mobile-first** permettant :
1. L'upload en masse de médias haute résolution (photos, visuels, vidéos)
2. La validation rapide et ergonomique par les responsables
3. Le stockage organisé et l'accès facile pour l'équipe média

### 2.2 Objectifs secondaires
- Réduire le temps de validation
- Conserver la qualité originale des médias
- Assurer la traçabilité des validations
- Faciliter le travail de l'équipe média

---

## 3. Principes Directeurs

### 3.1 Simplicité de maintenance
> Les mainteneurs sont principalement des **bénévoles** avec un temps limité.

- Architecture simple et bien documentée
- Peu de dépendances externes
- Déploiement automatisé
- Monitoring et alertes basiques
- Documentation claire pour les opérations courantes

### 3.2 Développement IA-Compatible / IA-First
> Le code doit être facilement compréhensible et modifiable par des assistants IA.

- Code clair, bien structuré et commenté quand nécessaire
- Conventions de nommage explicites
- Tests automatisés pour valider les modifications
- Structure de projet standard et prévisible
- README et documentation technique à jour

### 3.3 Qualité et Sécurité
> Respect des best practices au moment de l'implémentation.

- OWASP Top 10 : protection contre les vulnérabilités courantes
- Authentification sécurisée
- Validation des entrées utilisateur
- Gestion sécurisée des uploads de fichiers
- HTTPS obligatoire
- Principe du moindre privilège pour les accès

---

## 4. Utilisateurs et Rôles

### 4.1 Administrateur (Équipe Photo)
**Authentification :** Google OAuth

**Permissions :**
- Créer des événements/albums
- Uploader des photos en masse
- Générer des liens de validation
- Voir le statut des validations
- Accéder à toutes les photos (validées ou non)
- Gérer les paramètres

### 4.2 Validateur (Pasteur / Berger / Responsable Com)
**Authentification :** Lien partageable sécurisé (token unique)

**Permissions :**
- Accéder uniquement aux albums partagés avec lui
- Valider ou rejeter des photos
- Modifier ses choix avant confirmation finale
- Aucun accès aux fonctions d'administration

### 4.3 Équipe Média (Consommateur)
**Authentification :** Lien partageable ou Google OAuth (à définir)

**Permissions :**
- Voir uniquement les photos validées
- Télécharger les photos (individuellement ou en lot)
- Aucun droit de modification

---

## 5. Workflow Cible

```
┌─────────────────┐
│   ÉQUIPE PHOTO  │
│                 │
│  1. Traitement  │
│     des photos  │
│                 │
│  2. Upload sur  │
│     la plateforme│
│                 │
│  3. Génération  │
│     lien valid. │
└────────┬────────┘
         │
         │ Notification (email/SMS/WhatsApp)
         │ avec lien de validation
         ▼
┌─────────────────┐
│   VALIDATEUR    │
│                 │
│  4. Ouvre le    │
│     lien (mobile│
│     ou desktop) │
│                 │
│  5. Valide/     │
│     rejette     │
│     (swipe/tap) │
│                 │
│  6. Confirme    │
│     sélection   │
└────────┬────────┘
         │
         │ Notification à l'équipe média
         │
         ▼
┌─────────────────┐
│  ÉQUIPE MÉDIA   │
│                 │
│  7. Accède aux  │
│     photos      │
│     validées    │
│                 │
│  8. Télécharge  │
│     (ZIP ou     │
│     individuel) │
└─────────────────┘
```

---

## 6. Spécifications Fonctionnelles

### 6.1 Module Upload (Admin)

| Fonction | Description |
|----------|-------------|
| Créer un événement | Nom, date, église, description optionnelle |
| Upload multiple | Drag & drop ou sélection, photos HD (JPEG, PNG, HEIC) |
| Progression | Barre de progression, reprise en cas d'échec |
| Génération miniatures | Automatique côté serveur |
| Lien de validation | Génération d'URL unique avec token sécurisé |
| Partage | Copier le lien, envoi par email (optionnel) |

### 6.2 Module Validation (Validateur)

#### 6.2.1 Mode Swipe (Mobile - Principal)
```
┌─────────────────────────┐
│  Culte 19/01    3/12    │
├─────────────────────────┤
│                         │
│                         │
│    [Photo plein écran]  │
│                         │
│                         │
│                         │
├─────────────────────────┤
│                         │
│   [ ✗ ]       [ ✓ ]     │
│                         │
│   ou swipe ← / →        │
│                         │
└─────────────────────────┘

Après action :
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │ ✓ Validée [ANNULER]│  │  ← Toast 3 secondes
│  └───────────────────┘  │
└─────────────────────────┘
```

#### 6.2.2 Mode Récapitulatif (Mobile)
```
┌─────────────────────────────┐
│  ← Récap           8/12 ✓   │
├─────────────────────────────┤
│  [Toutes] [✓ Valid.] [✗ Rej.]│
├─────────────────────────────┤
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐    │
│  │ ✓   │ │ ✓   │ │ ✗   │    │
│  │ min │ │ min │ │ min │    │  Miniatures
│  └─────┘ └─────┘ └─────┘    │
│                             │  Tap = bascule ✓/✗
│  ┌─────┐ ┌─────┐ ┌─────┐    │  Long press = zoom
│  │ ✓   │ │ ✗   │ │ ✓   │    │
│  │ min │ │ min │ │ min │    │
│  └─────┘ └─────┘ └─────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  Confirmer (8/12)   │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

#### 6.2.3 Mode Zoom (depuis récap)
```
┌─────────────────────────────┐
│  ✕ Fermer              3/12 │
├─────────────────────────────┤
│                             │
│                             │
│      [Photo agrandie]       │
│        pinch to zoom        │
│                             │
│                             │
├─────────────────────────────┤
│   ◀ Préc   [ ✗ ][ ✓ ]  Suiv ▶   │
└─────────────────────────────┘
```

#### 6.2.4 Mode Desktop (Validateur)
```
┌──────────────────────────────────────────────────────────────┐
│  Culte du 19 janvier 2025                    8/12 validées   │
├──────────────────────────────────────────────────────────────┤
│  [Toutes] [✓ Validées] [✗ Rejetées]                          │
├──────────────────────────────────────────────────────────────┤
│                                    │                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│                         │
│  │  ✓   │ │  ✓   │ │      │ │  ✗   ││    ┌───────────────┐   │
│  │      │ │      │ │      │ │      ││    │               │   │
│  │ min1 │ │ min2 │ │ min3 │ │ min4 ││    │   Aperçu      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘│    │   grande      │   │
│                                    │    │   taille      │   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│    │               │   │
│  │  ✓   │ │      │ │  ✓   │ │      ││    │               │   │
│  │      │ │      │ │      │ │      ││    └───────────────┘   │
│  │ min5 │ │ min6 │ │ min7 │ │ min8 ││                         │
│  └──────┘ └──────┘ └──────┘ └──────┘│    [  ✗  ]    [  ✓  ]   │
│                                    │                         │
├──────────────────────────────────────────────────────────────┤
│  Raccourcis: ← → naviguer | V valider | X rejeter | Entrée confirmer │
├──────────────────────────────────────────────────────────────┤
│              [     Confirmer la sélection (8/12)     ]       │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Module Téléchargement (Équipe Média)

| Fonction | Description |
|----------|-------------|
| Liste événements | Événements avec photos validées disponibles |
| Galerie | Affichage grille des photos validées uniquement |
| Aperçu | Zoom sur photo individuelle |
| Téléchargement unitaire | Télécharger une photo en HD |
| Téléchargement groupé | Sélection multiple → ZIP téléchargeable |
| Filtres | Par date, église, événement |

### 6.4 Notifications

| Événement | Destinataire | Canal |
|-----------|--------------|-------|
| Nouvelles photos à valider | Validateur | Email + lien |
| Validation terminée | Équipe Photo + Média | Email |
| Rappel (si non validé sous X jours) | Validateur | Email |

---

## 7. Exigences Non-Fonctionnelles

### 7.1 Performance
- Upload : support fichiers jusqu'à 50 Mo par photo
- Génération miniatures : < 5 secondes par photo
- Chargement galerie : < 2 secondes (miniatures lazy-loaded)
- Téléchargement ZIP : génération asynchrone si > 20 photos

### 7.2 Compatibilité
- **Mobile** : iOS Safari 15+, Chrome Android 90+
- **Desktop** : Chrome, Firefox, Safari, Edge (versions récentes)
- **PWA** : installable sur mobile, fonctionne hors-ligne (consultation)

### 7.3 Stockage
- Photos originales HD conservées
- Miniatures générées en plusieurs tailles (thumb, medium, large)
- Rétention : à définir (1 an ? illimité ?)

### 7.4 Sécurité
- HTTPS obligatoire
- Liens de validation avec token unique et expirable
- Rate limiting sur les endpoints sensibles
- Validation des types de fichiers uploadés
- Pas de stockage de données sensibles inutiles

### 7.5 Scalabilité
- Estimation initiale : ~5 églises, ~50 événements/an, ~500 photos/événement
- Architecture permettant une croissance progressive

---

## 8. Stack Technique Proposée

### 8.1 Frontend
| Composant | Choix | Justification |
|-----------|-------|---------------|
| Framework | **Next.js 14+** (App Router) | PWA ready, SSR, excellent DX |
| UI | **Tailwind CSS** + composants headless | Simple, maintenable |
| Gestes mobile | **Hammer.js** ou natif | Swipe fluide |
| State | **React Context** ou Zustand | Léger, suffisant |

### 8.2 Backend
| Composant | Choix | Justification |
|-----------|-------|---------------|
| API | **Next.js API Routes** | Même stack, déploiement unifié |
| Auth | **NextAuth.js** | Google OAuth intégré |
| BDD | **MySQL** ou **PostgreSQL** | Hébergement existant |
| ORM | **Prisma** | Type-safe, migrations simples, supporte MySQL et PostgreSQL |

### 8.3 Stockage fichiers
| Composant | Choix | Justification |
|-----------|-------|---------------|
| Stockage | **OVH Object Storage (S3-compatible)** | Scalable, coût maîtrisé, données en France |
| SDK | **AWS SDK v3** | Compatible S3, bien documenté |
| Traitement images | **Sharp** (serveur) | Génération miniatures avant upload |

### 8.4 Domaine et DNS
| Composant | Choix | Justification |
|-----------|-------|---------------|
| Registrar | **OVH** | Centralisation avec le stockage |
| DNS | **OVH DNS** | Intégré, simple à gérer |

### 8.5 Hébergement (Infrastructure existante)

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                           │
└───────────┬─────────────────────────────┬───────────────┘
            │                             │
            ▼                             ▼
┌───────────────────────┐       ┌───────────────────────┐
│   OVH Object Storage  │       │       TRAEFIK         │
│   (S3-compatible)     │       │   (Reverse Proxy)     │
│                       │       │   - Terminaison SSL   │
│   /photos/            │       │   - Routing domaine   │
│   - originaux/        │       └───────────┬───────────┘
│   - thumbnails/       │                   │
│                       │                   ▼
│   URL directes ou     │       ┌───────────────────────┐
│   signed URLs         │       │     NEXT.JS APP       │
└───────────────────────┘       │     (Node.js)         │
            ▲                   │                       │
            │                   │   - API Routes        │
            │ upload/           │   - Auth (Google)     │
            │ génération thumb  │   - SSR               │
            │                   └───────────┬───────────┘
            │                               │
            └───────────────────────────────┤
                                            ▼
                                ┌───────────────────────┐
                                │   MySQL/PostgreSQL    │
                                │                       │
                                │   - Événements        │
                                │   - Photos (metadata) │
                                │   - Validations       │
                                │   - Tokens            │
                                └───────────────────────┘
```

| Composant | Configuration |
|-----------|---------------|
| OS | **Debian 12** |
| Conteneurisation | **Incus** (LXC/VM) |
| Reverse Proxy | **Traefik** (SSL, routing) |
| Runtime | **Node.js 20 LTS** |
| BDD | **MySQL 8** ou **PostgreSQL 15+** |
| Process Manager | **PM2** ou **systemd** |
| Stockage photos | **OVH Object Storage** (externe) |
| Domaine | **OVH** |

### 8.6 Outils Dev/Ops
| Composant | Choix | Justification |
|-----------|-------|---------------|
| Versioning | **Git** + GitHub/Gitea | Standard, IA-friendly |
| CI/CD | **GitHub Actions** ou script de déploiement | Tests + déploiement sur serveur |
| Monitoring | **PM2 monitoring** + Sentry (erreurs) | Simple, adapté self-hosted |
| Backup | **Script cron** (BDD) + réplication OVH | BDD locale, photos redondantes chez OVH |

---

## 9. Limites et Points Ouverts

| Point | Question | Décision nécessaire |
|-------|----------|---------------------|
| Rétention photos | Combien de temps conserver les photos ? | À définir |
| Multi-église | Chaque église a son espace isolé ? | À confirmer |
| Équipe média auth | Lien partagé ou compte Google aussi ? | À définir |
| Notifications | Email seul ou aussi WhatsApp/SMS ? | À définir |
| Quota stockage | Limite par église/événement ? | À définir |
| Langues | Français seul ou multilingue ? | À confirmer |

---

## 10. Critères de Succès

1. **Adoption** : Les validateurs utilisent la plateforme au lieu de WhatsApp
2. **Temps de validation** : Réduction du temps moyen de validation
3. **Qualité** : Photos HD préservées jusqu'à l'équipe média
4. **Fiabilité** : Aucune perte de photo, traçabilité complète
5. **Satisfaction** : Retours positifs des 3 types d'utilisateurs

---

## 11. Prochaines Étapes

1. **Validation de l'expression de besoin** ← Nous sommes ici
2. Conception technique détaillée (architecture, modèle de données)
3. Maquettes interactives (optionnel)
4. Développement MVP
5. Tests utilisateurs
6. Déploiement et formation
7. Itérations selon retours

---

*Document généré le 21 janvier 2025*
*Version : 1.0 - Expression de besoin initiale*
