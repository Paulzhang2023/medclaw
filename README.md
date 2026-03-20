<p align="center">
  <img src="docs/assets/medclaw-logo.svg" alt="MedClaw Logo" width="240" />
</p>

# MedClaw V0.2（β）

MedClaw 是基于 OpenClaw 架构打造的医学领域开源版本，面向医疗专业人士提供更轻量、更快、更省 token 的智能工作台。它不是通用型电脑 Agent 的简单换壳，而是围绕医学检索、证据获取、临床入口、技能调用和长期工作习惯沉淀做了定向收敛。

它当前更适合定位为一个医疗科研与证据辅助平台：

- 医学网站访问更快
- 浏览器使用更省 token
- 配置更简单
- 越用越智能，逐渐沉淀成个人贴身秘书和助手

## 核心功能

现在的 MedClaw 已经具备这些主能力：

- 医疗工作台入口
- 内置 PubMed
- ClinicalTrials.gov
- 指南站入口
- DeepEvidence
- SeekEvidence
- 医疗检索专用工具 `medclaw_research`
- 支持 global adapter、workspace adapter、autogen adapter
- MedClaw Skills Library
- 云端分类管理
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
- 解决通用 Agent 过慢的难题

## MedClaw 产品层

- Medical 工作台
- 极简配置
- MedClaw UI 壳层
- Basic / Advanced 设置页
- 医学知识与执行层

## 核心优势

- token 使用大幅减少
- 浏览器速度大幅提升
- 专为医疗专业人士定制
- 极简配置
- 越用越智能，更接近“个人贴身秘书和助手”的长期使用模式

## 安装与使用

### macOS

请下载本次 Release 中附带的：

- `MedClaw-<version>.dmg`
- 或 `MedClaw-<version>.zip`

### Windows

当前版本尚无原生 Windows 安装包。建议使用 **WSL2 + Ubuntu** 运行 MedClaw，详见仓库中的 Windows 安装说明：`docs/start/medclaw-windows-install.md`。

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

MedClaw 是医学信息与工作流辅助工具，不是诊断系统，也不能替代临床判断、正式指南解读、机构规范或患者个体化决策。所有关键结论都应由具备资质的专业人士独立复核。

## 开源说明

- 架构基础：OpenClaw
- 医学版本：MedClaw
- 开源发布方：梅斯医学 MedSci
