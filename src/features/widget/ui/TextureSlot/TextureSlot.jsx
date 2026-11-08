import { CardChoiceField } from '@/shared/ui/CardChoiceField';
import { FormGroup } from '@/shared/ui/FormGroup';

import { ASSET_KINDS, ASSET_RULES } from '../../config/widgetAssets';
import { NO_TEXTURE, TEXTURE_SLOTS, TEXTURES } from '../../config/widgetOptions';
import { assetLabel } from '../../utils/customAssets';
import { textureChoices } from '../../utils/textureChoices';
import { AssetImportButton } from '../AssetImportButton';

const NEW_TEXTURE = { fit: 'tile', strength: 'subtle' };
const BUILT_IN = TEXTURES.map((texture) => ({ ...texture, preview: <span className="texture-swatch" data-texture={texture.value} /> }));
const NAME_BY_VALUE = Object.fromEntries(TEXTURES.map((texture) => [texture.value, texture.label]));

export function CustomSwatch({ imageUrl }) {
  return imageUrl ? (
    <span className="texture-swatch" data-texture="custom" style={{ '--texture-image': `url("${imageUrl}")` }} />
  ) : (
    <span className="texture-swatch texture-swatch-missing" title="Not imported in this browser">
      ?
    </span>
  );
}

/**
 * One texture slot (a built-in texture, an imported one, or none) with an Import button that adds to the
 * game's shared library and applies the new image to this slot. The library itself is managed in General.
 */
export function TextureSlot({ slotKey, bind, assets }) {
  const slot = TEXTURE_SLOTS.find((candidate) => candidate.key === slotKey);
  const { fields, imported, customIds } = textureChoices(bind, assets);
  const field = fields[slotKey];
  const current = field.value?.asset ?? NO_TEXTURE;

  const options = [
    ...BUILT_IN,
    ...customIds.map((id) => ({ value: id, label: assetLabel(id), preview: <CustomSwatch imageUrl={imported[id]} /> })),
  ];

  const handleImport = async (file) => {
    const id = await assets.importAsset(ASSET_KINDS.TEXTURE, file, customIds, slotKey);
    if (id) field.onValueChange({ asset: id, ...NEW_TEXTURE });
  };

  return (
    <FormGroup title={`${slot.label} texture`} aside={NAME_BY_VALUE[current] ?? assetLabel(current)}>
      <CardChoiceField
        legend={`${slot.label} texture`}
        value={current}
        options={options}
        columns={5}
        hideLabels
        onValueChange={(asset) => (asset === NO_TEXTURE ? field.onClear() : field.onValueChange({ asset, ...NEW_TEXTURE }))}
        error={field.error}
      />
      <AssetImportButton
        label="Import texture"
        accept={ASSET_RULES[ASSET_KINDS.TEXTURE].accept}
        hint={ASSET_RULES[ASSET_KINDS.TEXTURE].hint}
        onFile={handleImport}
      />
      {assets.error && assets.errorOrigin === slotKey ? (
        <p role="alert" className="field-error">
          {assets.error}
        </p>
      ) : null}
    </FormGroup>
  );
}
