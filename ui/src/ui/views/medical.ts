import { html } from "lit";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../external-link.ts";

type MedicalResource = {
  title: string;
  subtitle: string;
  href: string;
  cta: string;
};

const DEEPEVID_URL = "https://deepevid.medsci.cn";
const SEEKEVIDENCE_URL = "https://seekevidence.medsci.cn";
const DEEPEVID_AUTH_STATE_KEY = "medclaw.deepevidence.auth-state.v1";

type DeepEvidenceAuthState = {
  status: "started";
  action: "login" | "register" | "open";
  updatedAt: string;
};

function loadDeepEvidenceAuthState(): DeepEvidenceAuthState | null {
  try {
    const raw = globalThis.localStorage?.getItem(DEEPEVID_AUTH_STATE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<DeepEvidenceAuthState>;
    if (parsed?.status !== "started" || typeof parsed.updatedAt !== "string") {
      return null;
    }
    return {
      status: "started",
      action:
        parsed.action === "login" || parsed.action === "register" || parsed.action === "open"
          ? parsed.action
          : "open",
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

function rememberDeepEvidenceAuth(action: DeepEvidenceAuthState["action"]) {
  try {
    globalThis.localStorage?.setItem(
      DEEPEVID_AUTH_STATE_KEY,
      JSON.stringify({
        status: "started",
        action,
        updatedAt: new Date().toISOString(),
      } satisfies DeepEvidenceAuthState),
    );
  } catch {
    // ignore local storage errors
  }
}

function openDeepEvidence(action: DeepEvidenceAuthState["action"]) {
  rememberDeepEvidenceAuth(action);
  globalThis.open(DEEPEVID_URL, EXTERNAL_LINK_TARGET, "noopener,noreferrer");
}

const SITE_RESOURCES: MedicalResource[] = [
  {
    title: "PubMed",
    subtitle: "Literature search, PMID capture, abstract review, and query refinement.",
    href: "https://pubmed.ncbi.nlm.nih.gov/",
    cta: "Open PubMed",
  },
  {
    title: "ClinicalTrials.gov",
    subtitle: "Trial registry search, status review, sponsor lookup, and NCT extraction.",
    href: "https://clinicaltrials.gov/",
    cta: "Open ClinicalTrials.gov",
  },
  {
    title: "Guideline Review",
    subtitle:
      "Use MedClaw skills to review society and institutional guideline sites with structured outputs and recommendation strength tracking.",
    href: "https://www.nice.org.uk/guidance",
    cta: "Guideline workflow",
  },
];

const ENTRY_RESOURCES: MedicalResource[] = [
  {
    title: "SeekEvidence",
    subtitle:
      "Local evidence workspace entry for research retrieval, evidence management, and downstream writing workflows.",
    href: SEEKEVIDENCE_URL,
    cta: "Open SeekEvidence",
  },
];

const STARTER_SKILLS = [
  "med-pubmed-search",
  "med-clinicaltrials-search",
  "med-guideline-review",
  "med-deepevidence-entry",
  "med-seekevidence-entry",
];

function renderResourceCard(resource: MedicalResource) {
  return html`
    <article class="card">
      <div class="card-title">${resource.title}</div>
      <div class="card-sub">${resource.subtitle}</div>
      <div style="margin-top: 16px;">
        <a
          class="btn"
          href=${resource.href}
          target=${EXTERNAL_LINK_TARGET}
          rel=${buildExternalLinkRel()}
        >${resource.cta}</a>
      </div>
    </article>
  `;
}

export function renderMedical() {
  const deepEvidenceAuth = loadDeepEvidenceAuthState();
  return html`
    <section class="grid">
      <div class="card">
        <div class="card-title">MedClaw v0.1</div>
        <div class="card-sub">
          MedClaw 是基于 OpenClaw 架构打造的医学领域开源版本，面向医疗专业人士提供更轻量、更快、更省 token 的智能工作台。
        </div>
        <div class="callout" style="margin-top: 16px;">
          它不是通用型电脑 Agent 的简单换壳，而是围绕医学检索、证据获取、临床入口、技能调用和长期工作习惯沉淀做了定向收敛。
        </div>
        <div class="callout" style="margin-top: 12px;">
          当前更适合定位为一个医疗科研与证据辅助平台：医学网站访问更快、浏览器使用更省 token、配置更简单、越用越智能。
        </div>
        <div class="callout" style="margin-top: 12px;">
          DeepEvidence 接入 <span class="mono">${DEEPEVID_URL}</span>，SeekEvidence 接入 <span class="mono">${SEEKEVIDENCE_URL}</span>。
        </div>
      </div>

      <div class="grid grid-cols-3">
        ${SITE_RESOURCES.map(renderResourceCard)}
      </div>

      <div class="grid grid-cols-1">
        <article class="card">
          <div class="card-title">DeepEvidence</div>
          <div class="card-sub">
            临床决策 AI 入口。注册和登录会直接跳转到 DeepEvidence 官方站点，并在当前浏览器中保留真实登录状态，后续再次使用通常无需重复登录。
          </div>
          <div class="note-grid" style="margin-top: 16px;">
            <button type="button" class="btn" @click=${() => openDeepEvidence("register")}>
              注册 DeepEvidence
            </button>
            <button type="button" class="btn" @click=${() => openDeepEvidence("login")}>
              登录 DeepEvidence
            </button>
            <button type="button" class="btn btn--primary" @click=${() => openDeepEvidence("open")}>
              进入 DeepEvidence
            </button>
          </div>
          ${
            deepEvidenceAuth
              ? html`
                  <div class="callout" style="margin-top: 16px">
                    MedClaw 已在本地记住你打开过 DeepEvidence 的登录流程。真实登录会话由浏览器中的 DeepEvidence
                    保持，下次进入会更顺滑。
                  </div>
                `
              : html`
                  <div class="callout" style="margin-top: 16px">
                    第一次使用时先注册或登录。之后同一浏览器中的 DeepEvidence 会话可持续复用。
                  </div>
                `
          }
        </article>
      </div>

      <div class="grid grid-cols-1">
        ${ENTRY_RESOURCES.map(renderResourceCard)}
      </div>

      <div class="card">
        <div class="card-title">MedClaw Skills Library</div>
        <div class="card-sub">云端分类管理，本地浏览与安装，支持推荐技能与统计、生物信息学、写作等分类。</div>
        <div class="note-grid" style="margin-top: 16px;">
          ${STARTER_SKILLS.map(
            (skill) => html`
              <div class="callout">
                <div class="mono">${skill}</div>
              </div>
            `,
          )}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Why MedClaw</div>
        <div class="card-sub">
          最核心的优势有 5 个：token 使用大幅减少、浏览器速度大幅提升、专为医疗专业人士定制、极简配置、越用越智能，更接近个人贴身秘书和助手的长期使用模式。
        </div>
      </div>

      <div class="card">
        <div class="card-title">Quick Start</div>
        <div class="card-sub">
          用 <span class="mono">openclaw medclaw --wizard</span> 完成首轮初始化。后续直接用 <span class="mono">openclaw medclaw start</span>，保持极简配置与快速启动。
        </div>
      </div>
    </section>
  `;
}
