import type { ListExercisesQueryDto } from './dto/exercise.dtos';
import type { ExerciseFacetsDto, PaginatedExercisesDto } from './exercise.types';

export type AgentExerciseFilter = 'q' | 'bodyPart' | 'equipment' | 'target';
export type AgentExerciseFacetFilter = Exclude<AgentExerciseFilter, 'q'>;

export interface AgentExerciseSearchInput {
    q?: string;
    bodyPart?: string;
    equipment?: string;
    target?: string;
    limit: number;
}

export interface AgentExerciseSearchFilters {
    q?: string;
    bodyPart?: string;
    equipment?: string;
    target?: string;
}

export interface AgentExerciseCandidate {
    id: string;
    name: string;
    bodyPart: string | null;
    equipment: string | null;
    target: string | null;
}

export interface AgentExerciseSearchItem extends AgentExerciseCandidate {
    /** Filtros de la consulta que este resultado realmente cumple. */
    matchedFilters: AgentExerciseFilter[];
}

export interface AgentExerciseIgnoredFilter {
    filter: AgentExerciseFacetFilter;
    requested: string;
    reason: 'invalid-value' | 'value-belongs-to-another-filter';
    message: string;
    replacementFilter?: AgentExerciseFacetFilter;
}

export interface AgentExerciseFilterNormalization {
    filter: AgentExerciseFacetFilter;
    requested: string;
    canonical: string;
}

export interface AgentExerciseRelaxedFilter {
    filter: AgentExerciseFilter;
    requested: string;
    reason: 'not-satisfied-by-selected-interpretation';
    message: string;
}

export interface AgentExerciseSearchResult {
    total: number;
    items: AgentExerciseSearchItem[];
    matchMode: 'exact' | 'related' | 'none';
    requestedFilters: AgentExerciseSearchFilters;
    appliedFilters: AgentExerciseSearchFilters;
    ignoredFilters: AgentExerciseIgnoredFilter[];
    normalizedFilters: AgentExerciseFilterNormalization[];
    preservedFilters: AgentExerciseFilter[];
    relaxedFilters: AgentExerciseRelaxedFilter[];
    guidance?: string;
}

export interface AgentExerciseCatalogReader {
    facets(): Promise<ExerciseFacetsDto>;
    list(query: ListExercisesQueryDto): Promise<PaginatedExercisesDto>;
    agentCandidates(filters: AgentExerciseSearchFilters): Promise<AgentExerciseCandidate[]>;
}

interface PreparedAgentExerciseSearch {
    requestedFilters: AgentExerciseSearchFilters;
    appliedFilters: AgentExerciseSearchFilters;
    ignoredFilters: AgentExerciseIgnoredFilter[];
    normalizedFilters: AgentExerciseFilterNormalization[];
}

const FACET_FIELDS = ['bodyPart', 'equipment', 'target'] as const satisfies readonly AgentExerciseFacetFilter[];
const FILTER_FIELDS = ['q', ...FACET_FIELDS] as const satisfies readonly AgentExerciseFilter[];

const FACET_RESULT_KEYS = {
    bodyPart: 'bodyParts',
    equipment: 'equipments',
    target: 'targets',
} as const satisfies Record<AgentExerciseFacetFilter, keyof ExerciseFacetsDto>;

const MATCH_WEIGHTS = {
    q: 2,
    bodyPart: 5,
    equipment: 4,
    target: 6,
} as const satisfies Record<AgentExerciseFilter, number>;

function clean(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
}

function searchable(value: string): string {
    return clean(value)
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLocaleLowerCase('en')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function facetKeys(value: string): Set<string> {
    const compact = searchable(value).replace(/\s+/g, '');
    if (!compact) return new Set();
    const singular = compact.endsWith('s') && compact.length > 3 ? compact.slice(0, -1) : compact;
    return new Set([compact, singular]);
}

function findCanonicalFacet(requested: string, values: string[]): string | undefined {
    const requestedKeys = facetKeys(requested);
    const matches = values.filter((value) => [...facetKeys(value)].some((key) => requestedKeys.has(key)));
    return matches.length === 1 ? matches[0] : undefined;
}

function withDefinedFilter(
    target: AgentExerciseSearchFilters,
    filter: AgentExerciseFilter,
    value: string | undefined,
): void {
    if (value) target[filter] = value;
}

/**
 * Convierte variantes inocuas (mayúsculas, guiones, plurales) al valor real
 * del catálogo y detecta el error común de usar una región como músculo target.
 */
export function prepareAgentExerciseSearch(
    input: AgentExerciseSearchInput,
    facets: ExerciseFacetsDto,
): PreparedAgentExerciseSearch {
    const requestedFilters: AgentExerciseSearchFilters = {};
    const appliedFilters: AgentExerciseSearchFilters = {};
    const ignoredFilters: AgentExerciseIgnoredFilter[] = [];
    const normalizedFilters: AgentExerciseFilterNormalization[] = [];

    const q = input.q ? clean(input.q) : undefined;
    withDefinedFilter(requestedFilters, 'q', q);
    withDefinedFilter(appliedFilters, 'q', q);

    for (const filter of FACET_FIELDS) {
        const inputValue = input[filter];
        const requested = inputValue ? clean(inputValue) : undefined;
        if (!requested) continue;
        requestedFilters[filter] = requested;

        const values = facets[FACET_RESULT_KEYS[filter]];
        const canonical = findCanonicalFacet(requested, values);
        if (canonical) {
            appliedFilters[filter] = canonical;
            if (requested !== canonical) normalizedFilters.push({ filter, requested, canonical });
            continue;
        }

        const otherMatch = FACET_FIELDS.map((candidateFilter) => ({
            filter: candidateFilter,
            canonical: findCanonicalFacet(requested, facets[FACET_RESULT_KEYS[candidateFilter]]),
        })).find((match) => match.filter !== filter && match.canonical);

        if (otherMatch?.canonical) {
            appliedFilters[otherMatch.filter] ??= otherMatch.canonical;
            ignoredFilters.push({
                filter,
                requested,
                reason: 'value-belongs-to-another-filter',
                replacementFilter: otherMatch.filter,
                message: `"${requested}" is a ${otherMatch.filter} value, not a ${filter} value.`,
            });
            continue;
        }

        ignoredFilters.push({
            filter,
            requested,
            reason: 'invalid-value',
            message: `"${requested}" is not a valid ${filter} value in the exercise catalog.`,
        });
    }

    return { requestedFilters, appliedFilters, ignoredFilters, normalizedFilters };
}

function candidateMatchedFilters(
    candidate: AgentExerciseCandidate,
    filters: AgentExerciseSearchFilters,
): AgentExerciseFilter[] {
    const matches: AgentExerciseFilter[] = [];
    const requestedName = filters.q ? searchable(filters.q) : '';
    if (requestedName && searchable(candidate.name).includes(requestedName)) matches.push('q');
    if (filters.bodyPart && candidate.bodyPart === filters.bodyPart) matches.push('bodyPart');
    if (filters.equipment && candidate.equipment === filters.equipment) matches.push('equipment');
    if (filters.target && candidate.target === filters.target) matches.push('target');
    return matches;
}

function relevance(matchedFilters: AgentExerciseFilter[]): number {
    const base = matchedFilters.reduce((total, filter) => total + MATCH_WEIGHTS[filter], 0);
    const anatomicalAndEquipment =
        matchedFilters.includes('equipment') &&
        (matchedFilters.includes('bodyPart') || matchedFilters.includes('target'));
    const bodyPartAndTarget = matchedFilters.includes('bodyPart') && matchedFilters.includes('target');
    return base + (anatomicalAndEquipment ? 2 : 0) + (bodyPartAndTarget ? 1 : 0);
}

/** Ordena coincidencias parciales privilegiando anatomía y equipo sobre texto libre. */
export function rankAgentExerciseCandidates(
    candidates: AgentExerciseCandidate[],
    filters: AgentExerciseSearchFilters,
): AgentExerciseSearchItem[] {
    return candidates
        .map((candidate) => {
            const matchedFilters = candidateMatchedFilters(candidate, filters);
            return { ...candidate, matchedFilters, score: relevance(matchedFilters) };
        })
        .filter((candidate) => candidate.matchedFilters.length > 0)
        .sort(
            (a, b) =>
                b.score - a.score ||
                b.matchedFilters.length - a.matchedFilters.length ||
                a.name.localeCompare(b.name, 'en'),
        )
        .map(({ id, name, bodyPart, equipment, target, matchedFilters }) => ({
            id,
            name,
            bodyPart,
            equipment,
            target,
            matchedFilters,
        }));
}

interface CoherentInterpretation {
    items: AgentExerciseSearchItem[];
    preservedFilters: AgentExerciseFilter[];
}

function structuralRelevance(filters: AgentExerciseFilter[]): number {
    return relevance(filters.filter((filter) => filter !== 'q'));
}

/**
 * Un fallback nunca mezcla en la misma lista dos intenciones incompatibles.
 * Agrupa por el subconjunto de restricciones estructuradas que cada ejercicio
 * cumple y elige un único grupo; q solo decide dentro de ese grupo.
 */
export function selectCoherentAgentExerciseInterpretation(ranked: AgentExerciseSearchItem[]): CoherentInterpretation {
    const groups = new Map<string, { structuralFilters: AgentExerciseFilter[]; items: AgentExerciseSearchItem[] }>();

    for (const item of ranked) {
        const structuralFilters = item.matchedFilters.filter((filter) => filter !== 'q');
        const key = structuralFilters.join('|') || 'q';
        const group = groups.get(key);
        if (group) group.items.push(item);
        else groups.set(key, { structuralFilters, items: [item] });
    }

    const structuralGroups = [...groups.values()].filter((group) => group.structuralFilters.length > 0);
    const eligibleGroups = structuralGroups.length > 0 ? structuralGroups : [...groups.values()];
    const [selected] = eligibleGroups.sort(
        (a, b) =>
            structuralRelevance(b.structuralFilters) - structuralRelevance(a.structuralFilters) ||
            b.structuralFilters.length - a.structuralFilters.length ||
            Number(b.structuralFilters.includes('equipment')) - Number(a.structuralFilters.includes('equipment')) ||
            Number(b.structuralFilters.includes('target')) - Number(a.structuralFilters.includes('target')) ||
            b.items.length - a.items.length ||
            a.structuralFilters.join('|').localeCompare(b.structuralFilters.join('|'), 'en'),
    );

    if (!selected) return { items: [], preservedFilters: [] };
    const preservesQ = selected.items.every((item) => item.matchedFilters.includes('q'));
    return {
        items: selected.items,
        preservedFilters: [...(preservesQ ? (['q'] as const) : []), ...selected.structuralFilters],
    };
}

function relaxedFilters(
    appliedFilters: AgentExerciseSearchFilters,
    preservedFilters: AgentExerciseFilter[],
): AgentExerciseRelaxedFilter[] {
    return FILTER_FIELDS.flatMap((filter) => {
        const requested = appliedFilters[filter];
        if (!requested || preservedFilters.includes(filter)) return [];
        const preserved = preservedFilters.length > 0 ? preservedFilters.join(', ') : 'the remaining valid filters';
        return [
            {
                filter,
                requested,
                reason: 'not-satisfied-by-selected-interpretation' as const,
                message: `${filter}="${requested}" was relaxed to preserve ${preserved}.`,
            },
        ];
    });
}

function toListQuery(filters: AgentExerciseSearchFilters, limit: number): ListExercisesQueryDto {
    return { limit, offset: 0, ...filters };
}

function requestedFieldCount(filters: AgentExerciseSearchFilters): number {
    return FILTER_FIELDS.reduce((count, filter) => count + (filters[filter] ? 1 : 0), 0);
}

/**
 * Hace primero la búsqueda AND normal. Si está sobre-restringida, obtiene en
 * una sola consulta interna candidatos que cumplen cualquier filtro y los
 * ordena por coherencia. El LLM recibe matchedFilters para no tratar el
 * fallback como una coincidencia exacta.
 */
export async function searchExerciseCatalogForAgent(
    catalog: AgentExerciseCatalogReader,
    input: AgentExerciseSearchInput,
): Promise<AgentExerciseSearchResult> {
    const facets = await catalog.facets();
    const prepared = prepareAgentExerciseSearch(input, facets);
    const requestedCount = requestedFieldCount(prepared.requestedFilters);
    const appliedCount = requestedFieldCount(prepared.appliedFilters);

    // Evita que una consulta compuesta solo por filtros inválidos se convierta
    // accidentalmente en "devuélveme todo el catálogo".
    if (requestedCount > 0 && appliedCount === 0) {
        return {
            total: 0,
            items: [],
            matchMode: 'none',
            ...prepared,
            preservedFilters: [],
            relaxedFilters: [],
            guidance: 'No valid filters remained. Call getExerciseFilters and retry with catalog values.',
        };
    }

    const exact = await catalog.list(toListQuery(prepared.appliedFilters, input.limit));
    if (exact.items.length > 0) {
        return {
            total: exact.total,
            items: exact.items.map((item) => ({
                id: item.id,
                name: item.name,
                bodyPart: item.bodyPart,
                equipment: item.equipment,
                target: item.target,
                matchedFilters: candidateMatchedFilters(item, prepared.appliedFilters),
            })),
            matchMode: prepared.ignoredFilters.length > 0 ? 'related' : 'exact',
            ...prepared,
            preservedFilters: FILTER_FIELDS.filter((filter) => !!prepared.appliedFilters[filter]),
            relaxedFilters: [],
            ...(prepared.ignoredFilters.length > 0 && {
                guidance: 'Some invalid or misplaced filters were ignored; inspect ignoredFilters before choosing.',
            }),
        };
    }

    const candidates = await catalog.agentCandidates(prepared.appliedFilters);
    const ranked = rankAgentExerciseCandidates(candidates, prepared.appliedFilters);
    const interpretation = selectCoherentAgentExerciseInterpretation(ranked);
    if (interpretation.items.length === 0) {
        return {
            total: 0,
            items: [],
            matchMode: 'none',
            ...prepared,
            preservedFilters: [],
            relaxedFilters: [],
            guidance: 'No catalog exercise matched these constraints. Broaden the request or call getExerciseFilters.',
        };
    }

    const relaxed = relaxedFilters(prepared.appliedFilters, interpretation.preservedFilters);

    return {
        total: interpretation.items.length,
        items: interpretation.items.slice(0, input.limit),
        matchMode: 'related',
        ...prepared,
        preservedFilters: interpretation.preservedFilters,
        relaxedFilters: relaxed,
        guidance:
            'No exercise matched every filter. One coherent interpretation was selected; preservedFilters apply to every result and relaxedFilters must not be claimed as satisfied. Retry separately if a relaxed filter was essential.',
    };
}
