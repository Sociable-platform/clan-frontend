const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);

/** The config's numeric limits, with the schema's defaults when a value is missing or not a number (a draft can be mid-edit). */
export const maxMembers = (config) => finite(config?.clan?.maxMembers, 30);
export const descriptionMax = (config) => finite(config?.clan?.descriptionMax, 140);
export const maxMessageLength = (config) => finite(config?.chat?.maxMessageLength, 300);
export const slowModeSeconds = (config) => finite(config?.chat?.slowModeSeconds, 0);
