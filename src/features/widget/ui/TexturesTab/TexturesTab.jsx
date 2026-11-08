import { CardChoiceField } from '@/shared/ui/CardChoiceField';
import { FormGroup } from '@/shared/ui/FormGroup';

import { NO_TEXTURE, TEXTURE_SLOTS, TEXTURES } from '../../config/widgetOptions';

const NEW_TEXTURE = { fit: 'tile', strength: 'subtle' };
const SWATCHES = TEXTURES.map((texture) => ({ ...texture, preview: <span className="texture-swatch" data-texture={texture.value} /> }));
const NAME_BY_VALUE = Object.fromEntries(TEXTURES.map((texture) => [texture.value, texture.label]));

/** One built-in texture (or none) for each part of the panel. */
export function TexturesTab({ bind }) {
  return (
    <>
      {TEXTURE_SLOTS.map((slot) => {
        const field = bind(`/theme/textures/${slot.key}`);
        const current = field.value?.asset ?? NO_TEXTURE;
        return (
          <FormGroup key={slot.key} title={slot.label} aside={NAME_BY_VALUE[current]}>
            <CardChoiceField
              legend={slot.label}
              value={current}
              options={SWATCHES}
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
      <p className="note">
        Fonts, badges and textures are stored as IDs, never URLs, so a config can&apos;t load from an outside site. Texture
        strength is capped so text over it stays readable.
      </p>
    </>
  );
}
