import { useCallback, useMemo, useState } from 'react';

import { ASSET_KINDS, ASSET_MESSAGES } from '../config/widgetAssets';
import { assetIdFromFileName, checkImageBytes, sniffImageFormat, toDataUrl } from '../utils/customAssets';
import { readFileBytes } from '../utils/readFileBytes';
import { loadWidgetAssets, saveWidgetAssets } from '../utils/widgetAssetStorage';

/**
 * The custom badge and texture images the developer imported for one game. They live in this browser
 * only (the config just carries their names), so the preview can draw them; `urls` is what the preview
 * hands to the renderer, and `importAsset` / `removeAsset` change the library.
 */
export function useWidgetAssets(gameId) {
  const [library, setLibrary] = useState(() => loadWidgetAssets(gameId));
  const [error, setError] = useState(null);

  const urls = useMemo(() => ({ badges: library[ASSET_KINDS.BADGE], textures: library[ASSET_KINDS.TEXTURE] }), [library]);

  const persist = useCallback(
    (next) => {
      if (!saveWidgetAssets(gameId, next)) {
        setError(ASSET_MESSAGES.STORAGE_FULL);
        return false;
      }
      setLibrary(next);
      return true;
    },
    [gameId],
  );

  /** Checks the file, keeps it and resolves to its config name, or sets `error` and resolves to null. */
  const importAsset = useCallback(
    async (kind, file, takenIds = []) => {
      setError(null);
      let bytes;
      try {
        bytes = await readFileBytes(file);
      } catch {
        setError(ASSET_MESSAGES.READ_FAILED);
        return null;
      }
      const problem = checkImageBytes(bytes, kind);
      if (problem) {
        setError(problem);
        return null;
      }
      const id = assetIdFromFileName(file.name, [...takenIds, ...Object.keys(library[kind])]);
      const dataUrl = toDataUrl(bytes, sniffImageFormat(bytes));
      return persist({ ...library, [kind]: { ...library[kind], [id]: dataUrl } }) ? id : null;
    },
    [library, persist],
  );

  const removeAsset = useCallback(
    (kind, id) => {
      setError(null);
      const { [id]: removed, ...rest } = library[kind];
      return removed === undefined ? true : persist({ ...library, [kind]: rest });
    },
    [library, persist],
  );

  return { library, urls, error, importAsset, removeAsset, handleDismissError: () => setError(null) };
}
