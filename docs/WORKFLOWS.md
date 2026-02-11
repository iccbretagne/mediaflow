# MediaFlow — Workflows de validation

## 1. Workflow actuel : Photos

Flux simple de validation par swipe, sans versioning ni commentaires.

```
Équipe Photo                    Pasteur/Responsable              Équipe Média
    │                                  │                              │
    │  Upload photos (FormData)        │                              │
    │──────────► [PENDING] ───────────►│                              │
    │                                  │  Swipe (approve/reject)      │
    │                                  │──────► [APPROVED]  ─────────►│
    │                                  │──────► [REJECTED]            │  Télécharge ZIP
    │                                  │                              │◄──── /d/[token]
```

### Machine à états

```
PENDING ──► APPROVED ◄──► REJECTED
        └─► REJECTED
```

- Transitions réversibles : une photo approuvée peut être rejetée et vice-versa via swipe mobile (`/v/[token]`)
- Conteneur : **Event** uniquement
- Upload : FormData (< 50 Mo)
- Pas de versioning, pas de commentaires

---

## 2. Workflow cible : Visuels & Vidéos

Flux de révision itératif avec commentaires, versioning et rétention configurable.

```
Créateur                          Reviewer (pasteur/responsable)
    │                                  │
    │  Upload visuel/vidéo             │
    │──────► [DRAFT]                   │
    │                                  │
    │  Soumettre pour review           │
    │──────► [IN_REVIEW] ────────────►│
    │                                  │
    │                          ┌───────┤
    │                          │       │  Approuver
    │                          │       │──────► [FINAL_APPROVED] ✓
    │                          │       │
    │                          │       │  Rejeter
    │                          │       │──────► [REJECTED]
    │                          │       │           │  Resoumettre
    │                          │       │           └──► [IN_REVIEW]
    │                          │       │
    │                          │       │  Demander révision + commentaire
    │  ◄───── [REVISION_REQUESTED] ◄──┘
    │                                  │
    │  Upload nouvelle version (v2)    │
    │──────► [IN_REVIEW] ────────────►│
    │           ...boucle...           │
```

### Machine à états

```
DRAFT ──► IN_REVIEW ──► FINAL_APPROVED
                    ├─► REJECTED ──► IN_REVIEW (réversible)
                    └─► REVISION_REQUESTED ──► IN_REVIEW (boucle)
```

- Conteneur : **Event** ou **Project**
- Upload : Presigned URL (jusqu'à 500 Mo pour les vidéos)
- Versioning : chaque révision crée un `MediaVersion`
- Commentaires : généraux ou avec timecode (vidéos)
- Rétention : suppression automatique des originaux vidéo après N jours

---

## 3. Workflow optionnel : Prévalidation

Étape de filtrage optionnelle avant la validation définitive. Permet à une personne de confiance de faire un premier tri des médias avant que le pasteur/responsable ne valide. Disponible pour les **événements** (photos) et les **projets** (médias).

### Activation

La prévalidation est **activée automatiquement** lors de la création d'un lien de partage de type `PREVALIDATOR`. Tant que la prévalidation n'est pas terminée (médias PENDING restants), la création de liens VALIDATOR ou MEDIA est bloquée (événements uniquement).

### Flux avec prévalidation

```
Équipe Média              Prévalidateur                Pasteur/Responsable         Équipe Média
    │                          │                              │                         │
    │  Upload médias           │                              │                         │
    │──────► [PENDING]         │                              │                         │
    │                          │                              │                         │
    │  Créer lien PREVALIDATOR │                              │                         │
    │─────────────────────────►│                              │                         │
    │                          │  Swipe (prevalidate/prereject)                         │
    │                          │──────► [PREVALIDATED]        │                         │
    │                          │──────► [PREREJECTED]         │                         │
    │                          │        (masquée)             │                         │
    │                          │                              │                         │
    │  ◄── Prévalidation terminée (0 PENDING)                 │                         │
    │                          │                              │                         │
    │  Créer lien VALIDATOR ───────────────────────────────►│                         │
    │                          │                              │  Swipe (approve/reject) │
    │                          │                              │──────► [APPROVED] ─────►│
    │                          │                              │──────► [REJECTED]       │ Télécharge
    │                          │                              │                         │◄── /d/[token]
```

### Machine à états (avec prévalidation)

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
PENDING ──► PREVALIDATED ──► APPROVED ◄──► REJECTED       │
    │                    └─► REJECTED                      │
    │                                                      │
    └──► PREREJECTED (terminal, masquée) ──────────────────┘
                    │
                    └──► PENDING (annulation possible)
```

### Règles métier

| Règle | Description |
|-------|-------------|
| **Activation** | Création d'un token PREVALIDATOR active le mode |
| **Conteneur** | Disponible pour les événements et les projets |
| **Blocage** | Impossible de créer VALIDATOR/MEDIA tant que médias PENDING existent (événements) |
| **Visibilité prévalidateur** | Voit uniquement les médias `PENDING` |
| **Visibilité validateur** | Voit uniquement les médias `PREVALIDATED` (PREREJECTED masqués), affichés comme `PENDING` |
| **Annulation** | Le prévalidateur peut re-switcher ses décisions |
| **Suppression token** | Les médias gardent leur statut (pas de rollback) |
| **Unicité** | Un seul token PREVALIDATOR par événement ou projet |
| **Transparence** | Le validateur final ne sait pas qu'il y a eu prévalidation |

### Statuts de prévalidation

| Statut | Description |
|--------|-------------|
| `PREVALIDATED` | Média gardé après prévalidation, en attente de validation finale |
| `PREREJECTED` | Média écarté lors de la prévalidation (terminal, masqué) |

### Type de token

| Type | Description |
|------|-------------|
| `PREVALIDATOR` | Accès prévalidation (lecture médias PENDING + modification statut vers PREVALIDATED/PREREJECTED) |

---

## 4. Réinitialisation des statuts

Les admins peuvent réinitialiser les statuts des médias via l'interface d'administration. Deux portées sont disponibles :

| Portée | Description | Statuts concernés |
|--------|-------------|-------------------|
| **Tout réinitialiser** | Remet tous les médias en attente | APPROVED, REJECTED, PREVALIDATED, PREREJECTED → PENDING |
| **Prévalidation seule** | Remet uniquement les médias prévalidés/écartés en attente | PREVALIDATED, PREREJECTED → PENDING |

### Particularités

- **Événements** : la réinitialisation complète remet aussi le statut de l'événement à `DRAFT`
- **Projets** : seuls les statuts des médias sont réinitialisés
- **API** : `POST /api/events/[id]/reset` et `POST /api/projects/[id]/reset` avec body `{ scope: "all" | "prevalidation" }`

---

## 5. Comparaison

| Aspect | Photos (sans prévalidation) | Photos (avec prévalidation) | Visuels & Vidéos |
|--------|----------------------------|----------------------------|------------------|
| Conteneur | Event | Event ou Project | Event ou Project |
| Upload | FormData < 50 Mo | FormData < 50 Mo | Presigned URL (jusqu'à 500 Mo) |
| Statuts | PENDING → APPROVED ↔ REJECTED | PENDING → PREVALIDATED/PREREJECTED → APPROVED ↔ REJECTED | DRAFT → IN_REVIEW → FINAL_APPROVED / REJECTED / REVISION_REQUESTED |
| Étapes validation | 1 (validateur) | 2 (prévalidateur + validateur) | 1+ (révisions possibles) |
| Versioning | Non | Non | Oui (MediaVersion) |
| Commentaires | Non | Non | Oui (général + timecode vidéo) |
| Validation UX | Swipe mobile | Swipe mobile (2 étapes) | ReviewModal |
| Rétention | Illimitée | Illimitée | Configurable (défaut 30 jours) |
| Réinitialisation | Oui (all) | Oui (all / prevalidation) | Oui (all / prevalidation) |

---

## 6. Coexistence des flux

Les différents workflows coexistent :

### Photos (table `Media`, type `PHOTO`)

- **Sans prévalidation** : workflow swipe simple (PENDING → APPROVED/REJECTED)
- **Avec prévalidation** : workflow en 2 étapes (PENDING → PREVALIDATED/PREREJECTED → APPROVED/REJECTED)

La prévalidation est activée par la présence d'un token `PREVALIDATOR` sur l'événement ou le projet.

### Visuels & Vidéos (table `Media`)

Via le champ `Media.type` :

- `PHOTO` → workflow swipe (PENDING / APPROVED / REJECTED), avec prévalidation optionnelle
- `VISUAL` / `VIDEO` → workflow révision (DRAFT / IN_REVIEW / REVISION_REQUESTED / REJECTED / FINAL_APPROVED)

La transition de statut est contrôlée par la route `PATCH /api/media/[id]/status` qui applique la machine à états correspondante selon le type de média.
