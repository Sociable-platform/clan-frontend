import { CardChoiceField } from '@/shared/ui/CardChoiceField';
import { FormGroup } from '@/shared/ui/FormGroup';

import { ASSET_KINDS, ASSET_RULES } from '../../config/widgetAssets';
import { NO_TEXTURE, TEXTURE_SLOTS, TEXTURES } from '../../config/widgetOptions';
import { assetLabel, isCustomAssetId } from '../../utils/customAssets';
import { AssetHandoff } from '../AssetHandoff';
import { AssetImportButton } from '../AssetImportButton';

const NEW_TEXTURE = { fit: 'tile', strength: 'subtle' };
const BUILT_IN = TEXTURES.map((texture) => ({ ...texture, preview: <span className="texture-swatch" data-texture={texture.value} /> }));
const NAME_BY_VALUE = Object.fromEntries(TEXTURES.map((texture) => [texture.value, texture.label]));

const unique = (list) => [...new Set(list)];

function CustomSwatch({ imageUrl }) {
  return imageUrl ? (
    <span className="texture-swatch" data-texture="custom" style={{ '--texture-image': `url("${imageUrl}")` }} />
  ) : (
    <span className="texture-swatch texture-swatch-missing" title="Not imported in this browser">
      ?
    </span>
  );
}

/** One texture (or none) for each part of the panel: built in, or an image the developer imported. */
export function TexturesTab({ bind, assets }) {
  const fields = Object.fromEntries(TEXTURE_SLOTS.map((slot) => [slot.key, bind(`/theme/textures/${slot.key}`)]));
  const imported = assets.library[ASSET_KINDS.TEXTURE];
  const usedIds = TEXTURE_SLOTS.map((slot) => fields[slot.key].value?.asset).filter(isCustomAssetId);
  const customIds = unique([...Object.keys(imported), ...usedIds]);

  const options = [
    ...BUILT_IN,
    ...customIds.map((id) => ({ value: id, label: assetLabel(id), preview: <CustomSwatch imageUrl={imported[id]} /> })),
  ];

  const handleImport = async (file) => {
    await assets.importAsset(ASSET_KINDS.TEXTURE, file, customIds);
  };

  const handleRemove = (id) => {
    TEXTURE_SLOTS.forEach((slot) => {
      if (fields[slot.key].value?.asset === id) fields[slot.key].onClear();
    });
    assets.removeAsset(ASSET_KINDS.TEXTURE, id);
  };

  return (
    <>
      {TEXTURE_SLOTS.map((slot) => {
        const field = fields[slot.key];
        const current = field.value?.asset ?? NO_TEXTURE;
        return (
          <FormGroup key={slot.key} title={slot.label} aside={NAME_BY_VALUE[current] ?? assetLabel(current)}>
            <CardChoiceField
              legend={slot.label}
              value={current}
              options={options}
              columns={5}
              hideLabels
              onValueChange={(asset) =>
                asset === NO_TEXTURE ? field.onClear() : field.onValueChange({ asset, ...NEW_TEXTURE })
              }
              error={field.error}
            />
          </FormGroup>
        );
      })}

      <FormGroup
        title="Your textures"
        aside={`${customIds.length} imported`}
        description="Import a tileable image to use it in any part above. It is drawn under a translucent layer so text stays readable."
      >
        <AssetImportButton
          label="Import texture"
          accept={ASSET_RULES[ASSET_KINDS.TEXTURE].accept}
          hint={ASSET_RULES[ASSET_KINDS.TEXTURE].hint}
          onFile={handleImport}
        />
        {assets.error ? (
          <p role="alert" className="field-error">
            {assets.error}
          </p>
        ) : null}
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

      <p className="note">
        Built-in fonts, badges and textures are stored as names, never URLs, so a config can&apos;t load from an outside site. Your own images are
        stored as names too; the image itself never leaves this browser. Texture strength is capped so text over it stays readable.
      </p>
    </>
  );
}
