# MediaFlow — Guide Utilisateur

Ce guide explique comment utiliser MediaFlow selon votre rôle.

## Sommaire

- [1. Validateur (Pasteur / Responsable)](#1-validateur-pasteur--responsable)
  - [Accéder aux médias](#accéder-aux-médias)
  - [Valider les photos (Mode Swipe)](#valider-les-photos-mode-swipe)
  - [Valider les visuels et vidéos](#valider-les-visuels-et-vidéos)
  - [Récapitulatif](#récapitulatif)
  - [Modifier vos choix](#modifier-vos-choix)
- [2. Équipe Média (Téléchargement)](#2-équipe-média-téléchargement)
  - [Accéder aux médias validés](#accéder-aux-médias-validés)
  - [Télécharger les médias](#télécharger-les-médias)
- [3. Administrateur](#3-administrateur)
  - [Connexion](#connexion)
  - [Dashboard](#dashboard)
  - [Événements (Photos)](#événements-photos)
  - [Projets (Visuels & Vidéos)](#projets-visuels--vidéos)
  - [Générer un lien de partage](#générer-un-lien-de-partage)
  - [Gérer les églises](#gérer-les-églises)
  - [Gérer les utilisateurs](#gérer-les-utilisateurs)
  - [Personnalisation](#personnalisation)
- [Questions fréquentes](#questions-fréquentes)

---

## 1. Validateur (Pasteur / Responsable)

Vous recevez un lien de validation par email ou message. Ce lien vous donne accès à la page de validation des médias.

### Accéder aux médias

1. Cliquez sur le lien reçu (format : `https://mediaflow.exemple.com/v/xxxxx`)
2. La page s'ouvre avec les médias à valider

### Valider les photos (Mode Swipe)

Les photos se présentent une par une :

- Glissez vers la **droite** (ou bouton **✓**) pour **approuver**
- Glissez vers la **gauche** (ou bouton **✗**) pour **rejeter**
- Bouton **Passer** pour passer au média suivant sans décision
- Utilisez les flèches **‹ ›** en haut pour naviguer librement entre les médias

**Raccourcis clavier (desktop) :**
- `V` ou `→` : Approuver
- `X` ou `←` : Rejeter
- `Espace` : Passer

### Valider les visuels et vidéos

Les visuels (PNG, JPEG, SVG, PDF) et vidéos (MP4, MOV, WebM) suivent un workflow enrichi :

- **Approuver** ou **Rejeter** comme pour les photos
- **Demander une révision** : appuyez sur le bouton jaune **Rev** et saisissez un commentaire décrivant les modifications souhaitées (le commentaire est obligatoire)

Les vidéos sont lues directement dans l'interface avec les contrôles de lecture.

### Récapitulatif

Après avoir parcouru tous les médias, un récap s'affiche :

- Vue en grille de tous les médias avec leur statut (✓ vert, ✗ rouge, ! jaune)
- Filtrez par statut : Toutes / Validées / Rejetées / Révision demandée
- Touchez une miniature pour modifier votre choix
- **Bouton Confirmer** (photos uniquement) : valide définitivement vos décisions sur les photos
- Bouton **Retour** : revenez au premier média non traité pour refaire un tour

> **Note :** Les visuels et vidéos sont validés individuellement au moment du swipe. Le bouton Confirmer ne concerne que les photos.

### Modifier vos choix

Vous pouvez changer d'avis à tout moment :
- Utilisez les flèches ‹ › pour revenir sur un média
- Depuis le récap, touchez une miniature pour basculer son statut

---

## 2. Équipe Média (Téléchargement)

Vous recevez un lien de téléchargement par email ou message.

### Accéder aux médias validés

1. Cliquez sur le lien reçu (format : `https://mediaflow.exemple.com/d/xxxxx`)
2. Seuls les médias **validés** sont affichés

### Télécharger les médias

**Média individuel :**
- Cliquez sur une miniature pour l'agrandir
- Cliquez sur le bouton de téléchargement

**Tous les médias (ZIP) :**
- Cliquez sur le bouton "Télécharger tout (ZIP)"
- Un fichier ZIP contenant tous les médias HD sera téléchargé

---

## 3. Administrateur

Vous avez un compte Google autorisé pour accéder à l'interface d'administration.

### Connexion

1. Accédez à `https://mediaflow.exemple.com`
2. Cliquez sur "Se connecter avec Google"
3. Si c'est votre première connexion, votre compte sera en attente d'approbation

### Dashboard

Le tableau de bord affiche tous les événements avec :
- Nom et date
- Église associée
- Nombre de médias (en attente / validés / rejetés)
- Statut de l'événement

**Filtres disponibles :**
- Par statut (Brouillon, En attente, Validé, Archivé)
- Par église

### Événements (Photos)

Les événements sont dédiés à la gestion de photos (cultes, conférences, etc.).

**Créer un événement :**
1. Cliquez sur "Nouvel événement"
2. Renseignez le nom, la date, l'église et une description (optionnel)
3. Cliquez sur "Créer"

**Uploader des photos :**
1. Ouvrez un événement
2. Glissez-déposez vos photos ou cliquez sur "Parcourir"
3. Formats : JPEG, PNG, WebP

### Projets (Visuels & Vidéos)

Les projets sont dédiés aux visuels et vidéos avec un workflow de révision.

**Créer un projet :**
1. Cliquez sur "Nouveau projet"
2. Renseignez le nom, l'église et une description (optionnel)
3. Cliquez sur "Créer"

**Uploader des médias :**
1. Ouvrez un projet
2. Glissez-déposez vos fichiers ou cliquez sur "Parcourir"
3. Formats visuels : PNG, JPEG, SVG, PDF
4. Formats vidéos : MP4, MOV, WebM (max 1 Go par fichier)

**Workflow de révision :**

Les visuels et vidéos passent par un workflow de statuts :

| Statut | Description |
|--------|-------------|
| Brouillon | Média uploadé, pas encore soumis |
| En cours de revue | Soumis pour validation |
| Révision demandée | Le validateur demande des modifications (avec commentaire) |
| Approuvé | Validé définitivement |
| Rejeté | Refusé |

**Soumettre une nouvelle version :**

Quand une révision est demandée :
1. Ouvrez le média dans la modale de revue
2. Consultez le commentaire du validateur
3. Cliquez sur "Parcourir" dans la section "Nouvelle version"
4. Ajoutez des notes de version (optionnel)
5. Uploadez le fichier corrigé

### Générer un lien de partage

1. Ouvrez un événement ou projet
2. Allez dans la section "Partage"
3. Cliquez sur "Nouveau lien"
4. Choisissez le type :
   - **Validateur** : pour les pasteurs/responsables
   - **Média** : pour l'équipe média (médias validés uniquement)
5. Optionnel : ajoutez un label et une date d'expiration
6. Copiez le lien généré et envoyez-le

### Gérer les églises

Menu **Églises** :
- Ajouter une nouvelle église
- Modifier le nom ou l'adresse
- Supprimer (si aucun événement/projet associé)

### Gérer les utilisateurs

Menu **Utilisateurs** (admin uniquement) :
- Voir les comptes en attente d'approbation
- Approuver ou rejeter les demandes
- Modifier les rôles (Admin / Média)

### Personnalisation

Menu **Paramètres** :
- Uploader un logo personnalisé
- Uploader un favicon personnalisé

---

## Questions fréquentes

### Le lien ne fonctionne pas ?

- Vérifiez que le lien n'a pas expiré
- Demandez un nouveau lien à l'administrateur

### Je ne peux pas me connecter ?

- Votre compte est peut-être en attente d'approbation
- Contactez un administrateur

### Les médias ne s'affichent pas ?

- Vérifiez votre connexion internet
- Essayez de rafraîchir la page
- Les miniatures se chargent progressivement

### Comment annuler une validation ?

- Revenez sur le média concerné
- Changez simplement son statut (les transitions sont réversibles)

### Le commentaire est obligatoire pour une révision ?

Oui, quand vous demandez une révision sur un visuel ou une vidéo, vous devez saisir un commentaire expliquant les modifications souhaitées.

### Quelle taille maximale pour les fichiers ?

- Photos et visuels : 50 Mo par fichier
- Vidéos : 1 Go par fichier (configurable par l'administrateur)

---

## Support

Pour toute question technique, contactez l'équipe de développement.
