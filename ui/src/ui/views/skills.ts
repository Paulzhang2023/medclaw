import { html, nothing } from "lit";
import type { SkillMessageMap } from "../controllers/skills.ts";
import { clampText } from "../format.ts";
import type { CloudSkillSummary, SkillStatusEntry, SkillStatusReport } from "../types.ts";
import { groupSkills } from "./skills-grouping.ts";
import {
  computeSkillMissing,
  computeSkillReasons,
  renderSkillStatusChips,
} from "./skills-shared.ts";

export type SkillsProps = {
  connected: boolean;
  loading: boolean;
  report: SkillStatusReport | null;
  error: string | null;
  filter: string;
  libraryLoading: boolean;
  library: { items: CloudSkillSummary[]; categories: string[] } | null;
  libraryError: string | null;
  libraryCategory: string;
  edits: Record<string, string>;
  busyKey: string | null;
  messages: SkillMessageMap;
  onFilterChange: (next: string) => void;
  onRefresh: () => void;
  onLibraryCategoryChange: (next: string) => void | Promise<void>;
  onLibraryRefresh: () => void;
  onToggle: (skillKey: string, enabled: boolean) => void;
  onEdit: (skillKey: string, value: string) => void;
  onSaveKey: (skillKey: string) => void;
  onInstall: (skillKey: string, name: string, installId: string) => void;
  onInstallCloudSkill: (skillId: string) => void;
};

export function renderSkills(props: SkillsProps) {
  const skills = props.report?.skills ?? [];
  const filter = props.filter.trim().toLowerCase();
  const filtered = filter
    ? skills.filter((skill) =>
        [skill.name, skill.description, skill.source].join(" ").toLowerCase().includes(filter),
      )
    : skills;
  const groups = groupSkills(filtered);
  const orderedLibraryItems = sortLibrarySkills(props.library?.items ?? []);
  const featuredSkills = orderedLibraryItems.filter((skill) => skill.featured);
  const otherLibrarySkills = orderedLibraryItems.filter((skill) => !skill.featured);

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">MedClaw Skills Library</div>
          <div class="card-sub">Cloud-curated medical and research skills, grouped by category.</div>
        </div>
        <button class="btn" ?disabled=${props.libraryLoading || !props.connected} @click=${props.onLibraryRefresh}>
          ${props.libraryLoading ? "Loading…" : "Refresh Library"}
        </button>
      </div>

      <div class="filters" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 14px;">
        <label class="field" style="min-width: 220px;">
          <select
            .value=${props.libraryCategory}
            @change=${(e: Event) =>
              props.onLibraryCategoryChange((e.target as HTMLSelectElement).value)}
          >
            <option value="">All categories</option>
            ${(props.library?.categories ?? []).map(
              (category) =>
                html`<option value=${category}>${formatCategoryLabel(category)}</option>`,
            )}
          </select>
        </label>
        <div class="muted">${orderedLibraryItems.length} library skills</div>
      </div>

      ${
        props.libraryError
          ? html`<div class="callout danger" style="margin-top: 12px;">${props.libraryError}</div>`
          : nothing
      }

      ${
        featuredSkills.length > 0
          ? html`
            <div style="margin-top: 18px;">
              <div class="card-title" style="font-size: 15px;">Recommended Medical Skills</div>
              <div class="card-sub">Curated skills we recommend for medical professionals first.</div>
              <div class="list skills-grid" style="margin-top: 12px;">
                ${featuredSkills.map((skill) => renderCloudSkill(skill, props))}
              </div>
            </div>
          `
          : nothing
      }

      ${
        otherLibrarySkills.length
          ? html`
              <div style="margin-top: 18px;">
                <div class="card-title" style="font-size: 15px;">Medical Skills Categories</div>
                <div class="card-sub">Clinical, literature, statistics, bioinformatics, writing, and more.</div>
                <div class="list skills-grid" style="margin-top: 12px;">
                  ${otherLibrarySkills.map((skill) => renderCloudSkill(skill, props))}
                </div>
              </div>
            `
          : html`
              <div class="muted" style="margin-top: 16px;">
                ${
                  props.libraryLoading
                    ? "Loading cloud skills library…"
                    : "No cloud skills found for the current category."
                }
              </div>
            `
      }
    </section>

    <section class="card" style="margin-top: 16px;">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Installed Skills</div>
          <div class="card-sub">Installed skills and their status.</div>
        </div>
        <button class="btn" ?disabled=${props.loading || !props.connected} @click=${props.onRefresh}>
          ${props.loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div class="filters" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 14px;">
        <a
          class="btn"
          href="https://clawhub.com"
          target="_blank"
          rel="noreferrer"
          title="Browse skills on ClawHub"
        >Browse Skills Store</a>
        <label class="field" style="flex: 1; min-width: 180px;">
          <input
            .value=${props.filter}
            @input=${(e: Event) => props.onFilterChange((e.target as HTMLInputElement).value)}
            placeholder="Search skills"
            autocomplete="off"
            name="skills-filter"
          />
        </label>
        <div class="muted">${filtered.length} shown</div>
      </div>

      ${
        props.error
          ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
          : nothing
      }

      ${
        filtered.length === 0
          ? html`
              <div class="muted" style="margin-top: 16px">
                ${
                  !props.connected && !props.report
                    ? "Not connected to gateway."
                    : "No skills found."
                }
              </div>
            `
          : html`
            <div class="agent-skills-groups" style="margin-top: 16px;">
              ${groups.map((group) => {
                const collapsedByDefault = group.id === "workspace" || group.id === "built-in";
                return html`
                  <details class="agent-skills-group" ?open=${!collapsedByDefault}>
                    <summary class="agent-skills-header">
                      <span>${group.label}</span>
                      <span class="muted">${group.skills.length}</span>
                    </summary>
                    <div class="list skills-grid">
                      ${group.skills.map((skill) => renderSkill(skill, props))}
                    </div>
                  </details>
                `;
              })}
            </div>
          `
      }
    </section>
  `;
}

function renderCloudSkill(skill: CloudSkillSummary, props: SkillsProps) {
  const busy = props.busyKey === `cloud:${skill.id}`;
  const message = props.messages[`cloud:${skill.id}`] ?? null;
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${skill.name}</div>
        <div class="list-sub">${clampText(skill.summary, 160)}</div>
        <div class="row" style="gap: 8px; flex-wrap: wrap; margin-top: 8px;">
          <span class="badge">${formatCategoryLabel(skill.category)}</span>
          <span class="badge">v${skill.version}</span>
          ${(skill.tags ?? []).slice(0, 4).map((tag) => html`<span class="badge">${tag}</span>`)}
        </div>
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; flex-wrap: wrap;">
          ${
            skill.homepageUrl
              ? html`<a class="btn" href=${skill.homepageUrl} target="_blank" rel="noreferrer">Open</a>`
              : nothing
          }
          ${
            skill.sourceUrl
              ? html`<a class="btn" href=${skill.sourceUrl} target="_blank" rel="noreferrer">Source</a>`
              : nothing
          }
          <button class="btn primary" ?disabled=${busy} @click=${() => props.onInstallCloudSkill(skill.id)}>
            ${busy ? "Installing…" : "Install"}
          </button>
        </div>
        ${
          message
            ? html`<div
              class="muted"
              style="margin-top: 8px; color: ${
                message.kind === "error"
                  ? "var(--danger-color, #d14343)"
                  : "var(--success-color, #0a7f5a)"
              };"
            >
              ${message.message}
            </div>`
            : nothing
        }
      </div>
    </div>
  `;
}

function formatCategoryLabel(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sortLibrarySkills(skills: CloudSkillSummary[]) {
  const categoryRank = new Map<string, number>([
    ["clinical", 0],
    ["literature", 1],
    ["statistics", 2],
    ["bioinformatics", 3],
    ["writing", 4],
    ["productivity", 5],
    ["other", 6],
  ]);
  return [...skills].toSorted((a, b) => {
    const featuredA = a.featured ? 0 : 1;
    const featuredB = b.featured ? 0 : 1;
    if (featuredA !== featuredB) {
      return featuredA - featuredB;
    }
    const rankA = categoryRank.get(a.category) ?? 99;
    const rankB = categoryRank.get(b.category) ?? 99;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.name.localeCompare(b.name);
  });
}

function renderSkill(skill: SkillStatusEntry, props: SkillsProps) {
  const busy = props.busyKey === skill.skillKey;
  const apiKey = props.edits[skill.skillKey] ?? "";
  const message = props.messages[skill.skillKey] ?? null;
  const canInstall = skill.install.length > 0 && skill.missing.bins.length > 0;
  const showBundledBadge = Boolean(skill.bundled && skill.source !== "openclaw-bundled");
  const missing = computeSkillMissing(skill);
  const reasons = computeSkillReasons(skill);
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          ${skill.emoji ? `${skill.emoji} ` : ""}${skill.name}
        </div>
        <div class="list-sub">${clampText(skill.description, 140)}</div>
        ${renderSkillStatusChips({ skill, showBundledBadge })}
        ${
          missing.length > 0
            ? html`
              <div class="muted" style="margin-top: 6px;">
                Missing: ${missing.join(", ")}
              </div>
            `
            : nothing
        }
        ${
          reasons.length > 0
            ? html`
              <div class="muted" style="margin-top: 6px;">
                Reason: ${reasons.join(", ")}
              </div>
            `
            : nothing
        }
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; flex-wrap: wrap;">
          <button
            class="btn"
            ?disabled=${busy}
            @click=${() => props.onToggle(skill.skillKey, skill.disabled)}
          >
            ${skill.disabled ? "Enable" : "Disable"}
          </button>
          ${
            canInstall
              ? html`<button
                class="btn"
                ?disabled=${busy}
                @click=${() => props.onInstall(skill.skillKey, skill.name, skill.install[0].id)}
              >
                ${busy ? "Installing…" : skill.install[0].label}
              </button>`
              : nothing
          }
        </div>
        ${
          message
            ? html`<div
              class="muted"
              style="margin-top: 8px; color: ${
                message.kind === "error"
                  ? "var(--danger-color, #d14343)"
                  : "var(--success-color, #0a7f5a)"
              };"
            >
              ${message.message}
            </div>`
            : nothing
        }
        ${
          skill.primaryEnv
            ? html`
              <div class="field" style="margin-top: 10px;">
                <span>API key</span>
                <input
                  type="password"
                  .value=${apiKey}
                  @input=${(e: Event) =>
                    props.onEdit(skill.skillKey, (e.target as HTMLInputElement).value)}
                />
              </div>
              <button
                class="btn primary"
                style="margin-top: 8px;"
                ?disabled=${busy}
                @click=${() => props.onSaveKey(skill.skillKey)}
              >
                Save key
              </button>
            `
            : nothing
        }
      </div>
    </div>
  `;
}
