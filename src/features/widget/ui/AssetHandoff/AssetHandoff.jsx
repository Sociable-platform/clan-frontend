import { CopyButton } from '@/shared/ui/CopyButton';

import { buildAssetsSnippet } from '../../utils/customAssets';

/**
 * How the game uses the custom images: the config only holds their names, so the developer points each
 * name at a file in their own project. Shows the SDK option with the names this config uses.
 */
export function AssetHandoff({ kindLabel, badgeIds = [], textureIds = [] }) {
  const snippet = buildAssetsSnippet({ badgeIds, textureIds });

  return (
    <div className="asset-handoff">
      <p className="form-group-description">
        Your {kindLabel} images stay in this browser. The config stores only their names, so your game must ship the files itself.
      </p>
      {snippet ? (
        <>
          <pre className="asset-snippet" tabIndex={0} aria-label="SDK assets option">
            <code>{snippet}</code>
          </pre>
          <CopyButton value={snippet} label="Copy snippet" />
        </>
      ) : null}
    </div>
  );
}
