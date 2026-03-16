---
summary: "Draft copy for a public MedClaw alpha landing page."
read_when:
  - You are preparing a MedClaw public release page
  - You need launch copy that avoids exposing technical internals
title: "MedClaw Release Page Copy"
---

# MedClaw Release Page Copy

## Hero

MedClaw  
面向医疗专业人士的智能医学工作台

更省 token，更快浏览，极简配置，越用越懂你。

基于 OpenClaw 架构，由梅斯医学 MedSci 开源发布。

## Sub-hero

MedClaw 是基于 OpenClaw 架构打造的医学领域开源版本，面向医疗专业人士提供更轻量、更快、更省 token 的智能工作台。

它不是通用型电脑 Agent 的简单换壳，而是围绕医学检索、证据获取、临床入口、技能调用和长期工作习惯沉淀做了定向收敛。

## Highlights

### 大幅减少 token 使用

在重复性的医学浏览和证据整理任务中，MedClaw 会显著降低 token 消耗，帮助你把预算花在更重要的分析与判断上。

### 浏览器速度大幅提升

面对固定医学站点和重复工作流，MedClaw 的响应更快，更适合高频文献与证据任务。

### 专为医疗专业人士定制

围绕医学检索、临床证据、指南阅读与科研支持而设计，而不是面向泛用互联网操作。

### 极简配置

更少的配置项，更短的上手路径，让医疗专业人士能够更快开始使用。

### 越用越智能

MedClaw 会逐步沉淀你的常用入口、常见任务和工作节奏，越来越像你的个人贴身秘书和助手。

## 产品定位

它当前更适合定位为一个医疗科研与证据辅助平台：

- 医学网站访问更快
- 浏览器使用更省 token
- 配置更简单
- 越用越智能，逐渐沉淀成个人贴身秘书和助手

## Core capabilities

- 医疗工作台入口
- 内置 PubMed
- ClinicalTrials.gov
- 指南站入口
- DeepEvidence
- SeekEvidence
- 医疗检索专用工具 `medclaw_research`
- 支持 global adapter
- 支持 workspace adapter
- 支持 autogen adapter
- MedClaw Skills Library
- 云端分类管理
- 本地浏览与安装
- 支持推荐技能
- 支持分类如统计、生物信息学、写作等
- 极简配置流
- `medclaw.config.json`
- 向内部 OpenClaw config 自动翻译
- `openclaw medclaw --wizard` 默认走极简配置

## Architecture traits

- 以 OpenClaw 的 `gateway / agent / browser` 架构为底座
- 在上面加了医学专用的产品层，优先使用结构化网页理解，优化加载速度
- 常规情况下浏览网页速度有大幅度提升

## Boundary statement

MedClaw 是医学信息与工作流辅助工具，不是诊断系统，也不能替代临床判断、正式指南解读或机构规范。

所有关键结论都应由合格专业人士独立复核。

## Attribution

MedClaw 基于 OpenClaw 架构，由梅斯医学 MedSci 面向医学领域专业人士开源发布。
