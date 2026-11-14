import { FormGroup } from '@/shared/ui/FormGroup';
import { InfoTip } from '@/shared/ui/InfoTip';

import { TEXTURE_SLOTS } from '../../config/widgetOptions';
import { ASSET_KINDS } from '../../config/widgetAssets';
import { assetLabel } from '../../utils/customAssets';
import { textureChoices } from '../../utils/textureChoices';
import { AssetHandoff } from '../AssetHandoff';
import { CustomSwatch } from '../TextureSlot';

/**
 * The textures the developer imported for this game: what is in the library, a way to remove one (it also
 * leaves every slot that uses it), and the SDK option that maps their names to the game's own files.
 * Importing happens in the texture slot where an image is wanted. The section stays short; the reasons
 * behind it (names instead of URLs, the translucent layer) are in the "?" next to the title.
 */
export function TextureLibrary({ bind, assets }) {
  const { fields, imported, usedIds, customIds } = textureChoices(bind, assets);

  const handleRemove = (id) => {
    TEXTURE_SLOTS.forEach((slot) => {
      if (fields[slot.key].value?.asset === id) fields[slot.key].onClear();
    });
    assets.removeAsset(ASSET_KINDS.TEXTURE, id);
  };

  return (
    <FormGroup
      title="Your textures"
      aside={`${customIds.length} imported`}
      description="Import a tileable image from any texture picker (Panel, Messages, Buttons)."
      tip={
        <InfoTip label="About your textures">
          <ul className="info-tip-list">
            <li>A texture is drawn under a translucent layer, and its strength is capped, so text over it stays readable.</li>
            <li>The config stores names, never URLs, so it can&apos;t load anything from an outside site.</li>
            <li>The image itself never leaves this browser. In your game, point each name at a file of your own.</li>
          </ul>
        </InfoTip>
      }
    >
      {customIds.length > 0 ? (
        <ul className="asset-list" aria-label="Imported textures">
          {customIds.map((id) => (
            <li key={id} className="asset-list-item">
              <CustomSwatch imageUrl={imported[id]} />
              <span className="asset-list-name">{assetLabel(id)}</span>
              <span className="asset-list-id">{id}</span>
              <button type="button" className="button button-secondary" aria-label={`Remove ${assetLabel(id)}`} onClick={() => handleRemove(id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <AssetHandoff kindLabel="texture" textureIds={customIds.filter((id) => usedIds.includes(id))} />
    </FormGroup>
  );
}
