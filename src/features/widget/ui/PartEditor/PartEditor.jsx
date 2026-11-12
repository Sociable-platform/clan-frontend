import { ColorField } from '@/shared/ui/ColorField';
import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { SelectField } from '@/shared/ui/SelectField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { FRAME_STYLES } from '../../config/widgetOptions';
import { PART_MESSAGES, PARTS } from '../../config/widgetParts';
import { PREVIEW_VIEWS } from '../../config/widgetPreview';
import { contrastRatio } from '../../utils/contrast';
import { effectivePart, seedPartStyle } from '../../utils/partStyles';
import { ContrastReadout } from '../ContrastReadout';

const VIEW_LABELS = Object.fromEntries(PREVIEW_VIEWS.map((view) => [view.id, view.label]));

/**
 * One part of the widget (a chat bubble, the main buttons, the tab bar...): a switch to customize it and,
 * when on, its colors, border and corner radius. A part starts from what the theme gives it, so switching
 * it on changes nothing until a value is edited; switching it off follows the theme again.
 */
export function PartEditor({ partKey, bind, onShowInPreview }) {
  const part = PARTS.find((candidate) => candidate.key === partKey);
  const theme = bind('/theme').value;
  const components = bind('/theme/components');
  const style = bind(`/theme/components/${partKey}`);
  const background = bind(`/theme/components/${partKey}/background`);
  const text = bind(`/theme/components/${partKey}/text`);
  const borderStyle = bind(`/theme/components/${partKey}/borderStyle`);
  const borderWidth = bind(`/theme/components/${partKey}/borderWidth`);
  const borderColor = bind(`/theme/components/${partKey}/borderColor`);
  const radius = bind(`/theme/components/${partKey}/radius`);
  const isCustom = style.value != null;
  const shown = effectivePart(style.value, seedPartStyle(partKey, theme));

  // Switching off the last customized part removes the whole section, so a config nobody customized carries none.
  const handleSwitch = (on) => {
    if (on) {
      style.onValueChange(seedPartStyle(partKey, theme));
      onShowInPreview?.(part.view);
      return;
    }
    const others = Object.keys(components.value ?? {}).filter((name) => name !== partKey);
    if (others.length === 0) components.onClear();
    else style.onClear();
  };

  return (
    <FormGroup title={part.label} description={part.description}>
      <SwitchField label={`Customize ${part.label}`} checked={isCustom} onCheckedChange={handleSwitch} error={style.error} />
      {isCustom ? (
        <>
          <div className="part-where">
            <span>Seen in the preview on {VIEW_LABELS[part.view]}.</span>
            <button type="button" className="button button-secondary" aria-label={`Show ${part.label} in preview`} onClick={() => onShowInPreview?.(part.view)}>
              Show in preview
            </button>
          </div>
          <ColorField label="Background" value={shown.background} onValueChange={background.onValueChange} error={background.error} />
          <ColorField label="Text" value={shown.text} onValueChange={text.onValueChange} error={text.error} />
          <ContrastReadout label={PART_MESSAGES.CONTRAST_LABEL} ratio={contrastRatio(shown.text, shown.background)} />
          <SelectField label="Border style" value={shown.borderStyle} options={FRAME_STYLES} onValueChange={borderStyle.onValueChange} error={borderStyle.error} />
          <NumberField
            label="Border width"
            value={shown.borderWidth}
            min={WIDGET_LIMITS.PART_BORDER_WIDTH.MIN}
            max={WIDGET_LIMITS.PART_BORDER_WIDTH.MAX}
            unit="px"
            onValueChange={borderWidth.onValueChange}
            error={borderWidth.error}
          />
          <ColorField label="Border color" value={shown.borderColor} onValueChange={borderColor.onValueChange} error={borderColor.error} />
          <NumberField
            label="Corner radius"
            value={shown.radius}
            min={WIDGET_LIMITS.PART_RADIUS.MIN}
            max={WIDGET_LIMITS.PART_RADIUS.MAX}
            unit="px"
            onValueChange={radius.onValueChange}
            error={radius.error}
          />
        </>
      ) : null}
    </FormGroup>
  );
}
