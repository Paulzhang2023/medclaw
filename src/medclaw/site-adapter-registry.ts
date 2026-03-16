import { Static, Type } from "@sinclair/typebox";

export const MedClawAdapterScopeSchema = Type.Union([
  Type.Literal("global"),
  Type.Literal("workspace"),
  Type.Literal("user"),
]);

export const MedClawRouteMatchSchema = Type.Object({
  hosts: Type.Array(Type.String(), { minItems: 1 }),
  pathPrefixes: Type.Optional(Type.Array(Type.String())),
  pathRegex: Type.Optional(Type.String()),
  searchParamKeys: Type.Optional(Type.Array(Type.String())),
  titleIncludes: Type.Optional(Type.Array(Type.String())),
});

export const MedClawLocatorSchema = Type.Object({
  css: Type.Optional(Type.String()),
  role: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  text: Type.Optional(Type.String()),
});

export const MedClawFieldTransformSchema = Type.Union([
  Type.Literal("trim"),
  Type.Literal("collapseWhitespace"),
  Type.Literal("lowercase"),
  Type.Literal("uppercase"),
  Type.Literal("extractYear"),
  Type.Literal("extractPmid"),
  Type.Literal("extractNctId"),
  Type.Literal("extractClinicalTrialStatus"),
  Type.Literal("extractClinicalTrialPhase"),
  Type.Literal("extractDoi"),
]);

export const MedClawFieldExtractorSchema = Type.Object({
  key: Type.String(),
  selector: Type.String(),
  value: Type.Union([
    Type.Literal("text"),
    Type.Literal("innerHTML"),
    Type.Literal("href"),
    Type.Literal("src"),
  ]),
  attr: Type.Optional(Type.String()),
  required: Type.Optional(Type.Boolean()),
  transforms: Type.Optional(Type.Array(MedClawFieldTransformSchema)),
});

export const MedClawRowExtractorSchema = Type.Object({
  rowSelector: Type.String(),
  dedupeBy: Type.Optional(Type.String()),
  fields: Type.Array(MedClawFieldExtractorSchema, { minItems: 1 }),
});

export const MedClawPaginationSchema = Type.Object({
  next: Type.Optional(MedClawLocatorSchema),
  mode: Type.Optional(Type.Union([Type.Literal("click"), Type.Literal("link")])),
});

export const MedClawPageAdapterSchema = Type.Object({
  pageType: Type.String(),
  match: MedClawRouteMatchSchema,
  ready: Type.Optional(
    Type.Object({
      waitForSelector: Type.Optional(Type.String()),
      snapshotMode: Type.Optional(Type.Union([Type.Literal("efficient")])),
    }),
  ),
  extraction: Type.Object({
    kind: Type.Union([Type.Literal("list"), Type.Literal("detail")]),
    row: Type.Optional(MedClawRowExtractorSchema),
    fields: Type.Optional(Type.Array(MedClawFieldExtractorSchema)),
    outputColumns: Type.Array(Type.String(), { minItems: 1 }),
  }),
  pagination: Type.Optional(MedClawPaginationSchema),
  notes: Type.Optional(Type.Array(Type.String())),
});

export const MedClawSiteAdapterSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  id: Type.String(),
  site: Type.String(),
  scope: MedClawAdapterScopeSchema,
  owner: Type.Optional(Type.String()),
  priority: Type.Optional(Type.Number()),
  tags: Type.Optional(Type.Array(Type.String())),
  pages: Type.Array(MedClawPageAdapterSchema, { minItems: 1 }),
});

export type MedClawAdapterScope = Static<typeof MedClawAdapterScopeSchema>;
export type MedClawRouteMatch = Static<typeof MedClawRouteMatchSchema>;
export type MedClawLocator = Static<typeof MedClawLocatorSchema>;
export type MedClawFieldExtractor = Static<typeof MedClawFieldExtractorSchema>;
export type MedClawRowExtractor = Static<typeof MedClawRowExtractorSchema>;
export type MedClawPagination = Static<typeof MedClawPaginationSchema>;
export type MedClawPageAdapter = Static<typeof MedClawPageAdapterSchema>;
export type MedClawSiteAdapter = Static<typeof MedClawSiteAdapterSchema>;

export function matchRoute(url: URL, match: MedClawRouteMatch, title?: string): boolean {
  const hostMatches = match.hosts.some(
    (candidate) => url.hostname === candidate || url.hostname.endsWith(`.${candidate}`),
  );
  if (!hostMatches) {
    return false;
  }
  if (match.pathPrefixes?.length) {
    const pathOk = match.pathPrefixes.some((prefix) => url.pathname.startsWith(prefix));
    if (!pathOk) {
      return false;
    }
  }
  if (match.pathRegex) {
    const regex = new RegExp(match.pathRegex);
    if (!regex.test(url.pathname)) {
      return false;
    }
  }
  if (match.searchParamKeys?.length) {
    const hasAny = match.searchParamKeys.some((key) => url.searchParams.has(key));
    if (!hasAny) {
      return false;
    }
  }
  if (match.titleIncludes?.length) {
    const normalizedTitle = (title ?? "").toLowerCase();
    const titleOk = match.titleIncludes.some((value) =>
      normalizedTitle.includes(value.toLowerCase()),
    );
    if (!titleOk) {
      return false;
    }
  }
  return true;
}
