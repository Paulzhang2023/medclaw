# MedClaw v0.1 Alpha

MedClaw 是基于 OpenClaw 架构打造的医学领域开源版本，面向医疗专业人士提供更轻量、更快、更省 token 的智能工作台。

它不是通用型电脑 Agent 的简单换壳，而是围绕医学检索、证据获取、临床入口、技能调用和长期工作习惯沉淀做了定向收敛。

## 本版本重点

- 医学网站访问更快
- 浏览器使用更省 token
- 配置更简单
- 越用越智能，逐渐沉淀成个人贴身秘书和助手

## 当前支持的重点场景

- 医疗工作台入口
- 内置 PubMed
- ClinicalTrials.gov
- 指南站入口
- DeepEvidence
- 医疗检索专用工具 `medclaw_research`
- 支持 global adapter、workspace adapter、autogen adapter
- MedClaw Skills Library
- 本地浏览与安装
- 支持推荐技能
- 支持分类如统计、生物信息学、写作等
- 极简配置流
- `medclaw.config.json`
- 向内部 OpenClaw config 自动翻译
- `openclaw medclaw --wizard` 默认走极简配置

## 架构特点

- 以 OpenClaw 的 `gateway / agent / browser` 架构为底座
- 在上面加了医学专用的产品层，优先使用结构化网页理解，优化加载速度
- 常规情况下浏览网页速度有大幅度提升

## 安装与使用

### macOS

请下载本次 Release 中附带的：

- `MedClaw-<version>.dmg`
- 或 `MedClaw-<version>.zip`

### 从源码启动

```bash
pnpm install
pnpm build
openclaw medclaw --wizard
```

后续重复启动可使用：

```bash
openclaw medclaw start
```

## 使用边界

MedClaw 是医学信息与工作流辅助工具，不是诊断系统，也不能替代临床判断、正式指南解读、机构规范或患者个体化决策。

所有关键结论都应由具备资质的专业人士独立复核。

## 开源说明

- 架构基础：OpenClaw
- 医学版本：MedClaw
- 开源发布方：梅斯医学 MedSci

欢迎医学、科研与工程团队参与测试、反馈与共建。

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

