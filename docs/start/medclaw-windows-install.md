---
summary: "Practical Windows install guide for MedClaw alpha users."
read_when:
  - You want to share MedClaw with Windows users
  - You need a realistic install path for the current alpha
title: "MedClaw Windows Install"
---

# MedClaw Windows Install

For the current MedClaw alpha, the recommended Windows path is **WSL2**.

There is not yet a mature native Windows installer for MedClaw. The most reliable experience today is:

- Windows host
- WSL2
- Ubuntu
- MedClaw running inside WSL2

## Recommended path

### 1. Install WSL2

Open PowerShell as Administrator:

```powershell
wsl --install
```

If you want to choose Ubuntu explicitly:

```powershell
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Then restart Windows if prompted.

### 2. Open Ubuntu in WSL2

After install, launch Ubuntu and complete the initial Linux username/password setup.

### 3. Install Node.js and pnpm inside WSL2

Inside Ubuntu:

```bash
sudo apt update
sudo apt install -y curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm
```

### 4. Clone MedClaw

Inside Ubuntu:

```bash
git clone https://github.com/Paulzhang2023/medclaw.git
cd medclaw
```

### 5. Install and build

```bash
pnpm install
pnpm build
```

### 6. Start MedClaw

For first-time setup:

```bash
openclaw medclaw --wizard
```

Or, if running from source in the repo:

```bash
node openclaw.mjs medclaw --wizard
```

For later repeat launches:

```bash
openclaw medclaw start
```

Or:

```bash
node openclaw.mjs medclaw start
```

## What Windows users should expect

- This alpha works best for browser-based medical workflows.
- PubMed, ClinicalTrials.gov, guideline sites, DeepEvidence, and SeekEvidence are the main entry points.
- Native Windows desktop packaging is not included yet.
- WSL2 is the recommended installation and runtime path for now.

## Suggested note for GitHub Release

If you upload MedClaw publicly, tell Windows users:

> Windows users: please use the WSL2 installation path for the current alpha. Native Windows installer packaging is planned later.
