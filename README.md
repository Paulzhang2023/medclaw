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
