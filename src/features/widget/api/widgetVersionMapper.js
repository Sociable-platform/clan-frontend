import { API_ERROR_CODES, ApiError } from '@/shared/api';

function assertShape(isValid) {
  if (!isValid) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function mapSummary(raw) {
  assertShape(
    Number.isInteger(raw?.version) && typeof raw?.publishedAt === 'string' && typeof raw?.publishedBy === 'string',
  );
  return { version: raw.version, publishedAt: raw.publishedAt, publishedBy: raw.publishedBy };
}

/** Raw `WidgetVersion` (publish, rollback and read-one responses) -> the version with its config as published. */
export function mapWidgetVersion(raw) {
  assertShape(isPlainObject(raw?.config));
  return { ...mapSummary(raw), config: raw.config };
}

/** Raw `WidgetVersionList` -> versions without configs, newest first whatever order the server used. */
export function mapWidgetVersionList(raw) {
  assertShape(Array.isArray(raw?.versions));
  return raw.versions.map(mapSummary).sort((first, second) => second.version - first.version);
}
