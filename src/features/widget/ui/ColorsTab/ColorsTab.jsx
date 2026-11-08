import { CardChoiceField } from '@/shared/ui/CardChoiceField';
import { ColorField } from '@/shared/ui/ColorField';
import { FormGroup } from '@/shared/ui/FormGroup';

import { BRAND_QUICK_PICKS, THEME_MODES, THEME_PALETTES } from '../../config/widgetOptions';
import { contrastRatio, MIN_TEXT_CONTRAST, readableTextOn } from '../../utils/contrast';
import { ChoicePreview } from '../ChoicePreview';

const COLOR_FIELDS = [
  ['brand', 'Brand'],
  ['background', 'Background'],
  ['surface', 'Surface'],
  ['text', 'Text'],
  ['muted', 'Muted text'],
];

const MODE_CARDS = THEME_MODES.map((mode) => ({ ...mode, preview: <ChoicePreview kind="mode" value={mode.value} /> }));

function ContrastReadout({ label, ratio }) {
  if (ratio === null) return null;
  const passes = ratio >= MIN_TEXT_CONTRAST;
  return (
    <div className="readout" data-passes={passes}>
      <span>{label}</span>
      <span className="readout-value">{`${ratio.toFixed(1)}:1 · ${passes ? 'passes' : 'low contrast'}`}</span>
    </div>
  );
}

/** Dark or light, the five colours, quick brand picks and contrast checks. */
export function ColorsTab({ bind }) {
  const theme = bind('/theme');
  const mode = bind('/theme/mode');
  const colors = bind('/theme/colors');
  const brand = bind('/theme/colors/brand');
  const current = theme.value.colors;

  // A colour still at the old mode's default follows the mode; one the developer picked stays.
  const handleModeChange = (nextMode) => {
    const previous = THEME_PALETTES[theme.value.mode] ?? {};
    const swapped = Object.fromEntries(
      Object.entries(THEME_PALETTES[nextMode]).map(([key, color]) => [key, current[key] === previous[key] ? color : current[key]]),
    );
    theme.onValueChange({ ...theme.value, mode: nextMode, colors: { ...current, ...swapped } });
  };

  const handleReset = () => colors.onValueChange({ ...current, ...THEME_PALETTES[theme.value.mode] });

  return (
    <>
      <FormGroup title="Theme">
        <CardChoiceField
          legend="Color mode"
          value={theme.value.mode}
          options={MODE_CARDS}
          onValueChange={handleModeChange}
          error={mode.error}
        />
      </FormGroup>

      <FormGroup title="Colors" description="Any color. Use the picker or type a hex code.">
        {COLOR_FIELDS.map(([key, label]) => {
          const field = bind(`/theme/colors/${key}`);
          return (
            <ColorField key={key} label={label} value={field.value} onValueChange={field.onValueChange} error={field.error} />
          );
        })}
      </FormGroup>

      <FormGroup title="Quick picks for brand">
        <div className="quick-picks">
          {BRAND_QUICK_PICKS.map((pick) => (
            <button
              key={pick.value}
              type="button"
              className="quick-pick"
              style={{ '--quick-pick': pick.value }}
              aria-label={`Brand ${pick.label} ${pick.value}`}
              aria-pressed={current.brand === pick.value}
              onClick={() => brand.onValueChange(pick.value)}
            />
          ))}
        </div>
        <ContrastReadout label="Text on background" ratio={contrastRatio(current.text, current.background)} />
        <ContrastReadout label="Button text on brand" ratio={contrastRatio(readableTextOn(current.brand), current.brand)} />
        <button type="button" className="button button-secondary" onClick={handleReset}>
          Reset to theme defaults
        </button>
      </FormGroup>
    </>
  );
}
