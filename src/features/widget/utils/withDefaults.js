import { DEFAULT_WIDGET_CONFIG } from '../config/widgetDefaults';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function merge(defaults, saved) {
  if (!isPlainObject(defaults) || !isPlainObject(saved)) return saved === undefined ? defaults : saved;

  const result = { ...defaults };
  Object.entries(saved).forEach(([key, value]) => {
    result[key] = key in defaults ? merge(defaults[key], value) : value;
  });
  return result;
}

/**
 * Keys config v1 no longer has (TEAM-276: clans have no tags). A draft saved before they went may
 * still carry them, and Platform refuses a config that sends them, so they are dropped on load.
 */
const REMOVED_KEYS = [['clan', 'tags']];

function dropRemovedKeys(config) {
  REMOVED_KEYS.forEach(([section, key]) => {
    if (isPlainObject(config[section])) delete config[section][key];
  });
  return config;
}

/**
 * A draft that can be edited as a whole: whatever the server sent, with every missing part
 * taken from the defaults and `game_id` set. Saved values always win, and keys the editor
 * does not know are kept, so a newer config is not trimmed by an older editor. Only the keys
 * config v1 removed are dropped.
 */
export function withDefaults(config, gameId) {
  return dropRemovedKeys(merge({ ...structuredClone(DEFAULT_WIDGET_CONFIG), game_id: gameId }, config));
}
