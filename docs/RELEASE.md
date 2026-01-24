# Release process

This project uses Semantic Versioning with pre-release tags while the product is < 1.0.

## Tag convention

Format:
- Stable: vMAJOR.MINOR.PATCH
- Pre-release: vMAJOR.MINOR.PATCH-<stage>.<N>

Stages:
- alpha: internal or very early builds
- beta: MVP tested by a small group
- rc: release candidate

Examples:
- v0.1.0-beta.1
- v0.1.0-beta.2
- v0.1.0
- v0.2.0-alpha.1

## Rules

- Before 1.0, breaking changes are allowed; use MINOR to signal bigger changes.
- PATCH is for fixes or small adjustments.
- Use annotated tags for releases.
- Each tag should have a matching entry in CHANGELOG.md.

## Quick workflow

1) Update CHANGELOG.md.
2) Create the tag with the release script.
3) Push the tag to origin.

Example:

  ./scripts/release.sh v0.1.0-beta.2 "Beta iteration"

## Current baseline

The deployed MVP is tagged as v0.1.0-beta.1.
