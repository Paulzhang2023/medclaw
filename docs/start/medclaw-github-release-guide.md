---
summary: "How to publish MedClaw to GitHub, push the repo, and prepare release assets."
read_when:
  - You are publishing MedClaw to GitHub
  - You need git commands and packaging guidance
title: "MedClaw GitHub Release Guide"
---

# MedClaw GitHub Release Guide

This guide is the practical path for publishing the current MedClaw alpha to GitHub.

## 1. Create the GitHub repository

If you use the GitHub CLI:

```bash
cd /Users/paul/Documents/novel/medclaw
gh repo create MedSci/medclaw --public --source=. --remote=origin --push
```

If you create the repo manually on GitHub first:

```bash
cd /Users/paul/Documents/novel/medclaw
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:MedSci/medclaw.git
git branch -M main
git add .
git commit -m "Release MedClaw alpha"
git push -u origin main
```

## 2. Recommended first push flow

Before pushing:

```bash
pnpm build
git diff --check
```

Then:

```bash
git status
git add .
git commit -m "Prepare MedClaw alpha release"
git push -u origin main
```

## 3. What to upload to GitHub Releases

For the current alpha, the most realistic release assets are:

- GitHub auto-generated source zip/tar.gz
- macOS `.dmg`
- macOS `.zip`
- optional npm tarball
- release notes copied from the MedClaw release page draft

## 4. How to build a macOS install package

The repository already contains a macOS packaging flow.

### Fast alpha package (no notarization)

This is the most practical choice for a first GitHub alpha release:

```bash
cd /Users/paul/Documents/novel/medclaw
pnpm install
pnpm build
SKIP_NOTARIZE=1 SKIP_DSYM=1 BUILD_CONFIG=release bash scripts/package-mac-dist.sh
```

### Signed / notarized package (recommended for wider public release)

If you already have Apple signing and notarization credentials configured, run:

```bash
cd /Users/paul/Documents/novel/medclaw
pnpm install
pnpm build
bash scripts/package-mac-dist.sh
```

Expected outputs:

- `dist/MedClaw.app`
- `dist/MedClaw-<version>.zip`
- `dist/MedClaw-<version>.dmg`

Important note:

The current packaging scripts now emit MedClaw-branded macOS artifacts. Internal source targets still inherit some OpenClaw names, but the generated `.app`, `.zip`, and `.dmg` are branded as `MedClaw`.

## 5. Windows packaging status

Right now there is no equally mature MedClaw-branded Windows installer flow in this repository.

For the current public alpha, the practical Windows options are:

1. Publish source + install instructions
2. Publish the npm/package-based installation path
3. Add a dedicated Windows packaging lane later

So for this alpha, my recommendation is:

- macOS: upload `.dmg` and `.zip`
- Windows: use GitHub source release plus install instructions

Recommended Windows guide to upload or link:

- [MedClaw Windows Install](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-windows-install.md)

## 6. Optional npm/package artifact

If you want a package artifact:

```bash
cd /Users/paul/Documents/novel/medclaw
npm pack
```

This generates a tarball you can also upload to GitHub Releases.

## 7. Suggested GitHub release title

```text
MedClaw v0.1 Alpha
```

## 8. Suggested release description

Use the text in:

- [MedClaw Release Page Copy](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-release-page-copy.md)
- [README.medclaw.md](/Users/paul/Documents/novel/medclaw/README.medclaw.md)

## 9. Recommended asset naming on GitHub

- `MedClaw-v0.1-alpha-macos.dmg`
- `MedClaw-v0.1-alpha-macos.zip`
- `MedClaw-v0.1-alpha-source.tar.gz`

## 10. Where release files should go

The best default place is **GitHub Releases** for the repository itself.

Why:

- users expect downloads there
- versioned assets stay attached to tags
- source archives are generated automatically
- release notes and binaries live together

Recommended upload locations:

- GitHub repository code: source and history
- GitHub Releases: `.dmg`, `.zip`, release notes
- Optional later: official website or CDN mirror for the latest stable installer

## 11. Honest alpha-release recommendation

For this stage, publish MedClaw as:

- `Alpha`
- `Developer Preview`
- `For medical professionals and early collaborators`

Do not yet present it as a fully polished mass-market installer release.
