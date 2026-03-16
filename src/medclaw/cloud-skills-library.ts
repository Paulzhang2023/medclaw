import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { loadConfig } from "../config/config.js";

export const MedClawCloudSkillCategorySchema = Type.Union([
  Type.Literal("statistics"),
  Type.Literal("bioinformatics"),
  Type.Literal("writing"),
  Type.Literal("literature"),
  Type.Literal("clinical"),
  Type.Literal("productivity"),
  Type.Literal("other"),
]);

export const MedClawCloudSkillSummarySchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  version: Type.String(),
  category: MedClawCloudSkillCategorySchema,
  summary: Type.String(),
  description: Type.Optional(Type.String()),
  featured: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String())),
  homepageUrl: Type.Optional(Type.String()),
  sourceUrl: Type.Optional(Type.String()),
  packageUrl: Type.String(),
  archiveKind: Type.Union([Type.Literal("zip"), Type.Literal("tar.gz"), Type.Literal("tar.bz2")]),
  checksumSha256: Type.Optional(Type.String()),
});

export const MedClawCloudSkillListResponseSchema = Type.Object({
  items: Type.Array(MedClawCloudSkillSummarySchema),
  categories: Type.Array(MedClawCloudSkillCategorySchema),
});

export type MedClawCloudSkillSummary = Static<typeof MedClawCloudSkillSummarySchema>;
export type MedClawCloudSkillListResponse = Static<typeof MedClawCloudSkillListResponseSchema>;

function resolveSkillsLibraryUrl() {
  const cfg = loadConfig();
  const fromConfig = cfg.env?.vars?.MEDCLAW_SKILLS_LIBRARY_URL?.trim();
  const fallback = cfg.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_URL?.trim();
  return (
    fromConfig ||
    process.env.MEDCLAW_SKILLS_LIBRARY_URL?.trim() ||
    fallback ||
    process.env.MEDCLAW_ADAPTER_REGISTRY_URL?.trim() ||
    ""
  );
}

function requireSkillsLibraryUrl() {
  const baseUrl = resolveSkillsLibraryUrl();
  if (!baseUrl) {
    throw new Error(
      "MedClaw skills library URL not configured. Set env.vars.MEDCLAW_SKILLS_LIBRARY_URL or MEDCLAW_SKILLS_LIBRARY_URL.",
    );
  }
  return baseUrl.replace(/\/$/, "");
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Skills library request failed (${res.status}): ${text}`);
  }
  return text ? (JSON.parse(text) as unknown) : {};
}

export async function listCloudSkills(params?: {
  category?: string;
  query?: string;
}): Promise<MedClawCloudSkillListResponse> {
  const baseUrl = requireSkillsLibraryUrl();
  const url = new URL(`${baseUrl}/v1/skills`);
  if (params?.category?.trim()) {
    url.searchParams.set("category", params.category.trim());
  }
  if (params?.query?.trim()) {
    url.searchParams.set("query", params.query.trim());
  }
  const result = await fetchJson(url.toString());
  if (!Value.Check(MedClawCloudSkillListResponseSchema, result)) {
    throw new Error("Invalid cloud skills library response.");
  }
  return result;
}

export async function getCloudSkill(params: { id: string }): Promise<MedClawCloudSkillSummary> {
  const baseUrl = requireSkillsLibraryUrl();
  const result = await fetchJson(`${baseUrl}/v1/skills/${encodeURIComponent(params.id)}`);
  if (!Value.Check(MedClawCloudSkillSummarySchema, result)) {
    throw new Error("Invalid cloud skill detail response.");
  }
  return result;
}
