import { FormGroup } from '@/shared/ui/FormGroup';

import { TEXTURE_SLOTS } from '../../config/widgetOptions';
import { ASSET_KINDS } from '../../config/widgetAssets';
import { assetLabel } from '../../utils/customAssets';
import { textureChoices } from '../../utils/textureChoices';
import { AssetHandoff } from '../AssetHandoff';
import { CustomSwatch } from '../TextureSlot';

/**
 * The textures the developer imported for this game: what is in the library, a way to remove one (it also
 * leaves every slot that uses it), and the SDK option that maps their names to the game's own files.
 * Importing happens in the texture slot where an image is wanted. The section is kept short on purpose;
 * why names are stored instead of URLs belongs in the docs.
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
