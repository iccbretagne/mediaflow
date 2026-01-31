# Release process

Ce projet utilise le [Semantic Versioning](https://semver.org/) avec des tags de pré-release tant que le produit est < 1.0.

## Convention de tags

Format :
- Stable : `vMAJOR.MINOR.PATCH`
- Pré-release : `vMAJOR.MINOR.PATCH-<stage>.<N>`

Stages :
- `alpha` : builds internes ou très précoces
- `beta` : MVP testé par un petit groupe
- `rc` : release candidate

Exemples :
- `v0.2.0-rc.7`
- `v0.2.0`
- `v0.3.0-alpha.1`

## Source de vérité

La version dans `package.json` est la **source unique**. Le footer admin la lit dynamiquement.

## Publier une nouvelle version

Utiliser `npm version` qui fait automatiquement :
1. Met à jour `version` dans `package.json`
2. Crée un commit
3. Crée le tag Git correspondant

```bash
# Release candidate
npm version 0.2.0-rc.8

# Version stable
npm version 0.2.0

# Pousser le commit + tag
git push --follow-tags
```

## Check CI

Le workflow GitHub Actions (`ci.yml`) inclut un job `check-version` qui se déclenche sur les push de tags `v*`. Il vérifie que le tag correspond à la version dans `package.json` et **échoue en cas d'incohérence**.

Cela garantit que tout tag créé manuellement (sans `npm version`) sera rejeté s'il ne correspond pas au `package.json`.

## Règles

- Avant 1.0, les breaking changes sont autorisés ; utiliser MINOR pour signaler les changements importants.
- PATCH pour les corrections ou petits ajustements.
- Chaque tag devrait avoir une entrée correspondante dans CHANGELOG.md.

## Baseline actuelle

La version courante est `v0.2.0-rc.7`.
