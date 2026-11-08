import { ColorField } from '@/shared/ui/ColorField';
import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { RangeField } from '@/shared/ui/RangeField';
import { SegmentedField } from '@/shared/ui/SegmentedField';
import { SelectField } from '@/shared/ui/SelectField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import {
  BUTTON_STYLES,
  CORNERS,
  FONT_GROUPS,
  FRAME_STYLES,
  NO_TEXTURE,
  TEXTURE_SLOTS,
  TEXTURES,
  THEME_MODES,
} from '../../config/widgetOptions';

const COLOR_FIELDS = [
  ['brand', 'Brand'],
  ['background', 'Background'],
  ['surface', 'Surface'],
  ['text', 'Text'],
  ['muted', 'Muted text'],
];

const NEW_TEXTURE = { fit: 'tile', strength: 'subtle' };

/** Look of the panel: mode, colours, fonts, frame, buttons, glass effect and textures. */
export function StyleSection({ bind }) {
  const mode = bind('/theme/mode');
  const headingFont = bind('/theme/fonts/heading/family');
  const bodyFont = bind('/theme/fonts/body/family');
  const frameStyle = bind('/theme/frame/style');
  const frameWidth = bind('/theme/frame/width');
  const frameColor = bind('/theme/frame/color');
  const corners = bind('/theme/frame/corners');
  const buttonStyle = bind('/theme/buttons/style');
  const buttonCase = bind('/theme/buttons/case');
  const opacity = bind('/theme/panel/opacity');
  const blur = bind('/theme/panel/blur');

  return (
    <>
      <FormGroup title="Mode">
        <SegmentedField
          legend="Color mode"
          value={mode.value}
          options={THEME_MODES}
          onValueChange={mode.onValueChange}
          error={mode.error}
        />
      </FormGroup>

      <FormGroup title="Colors">
        {COLOR_FIELDS.map(([key, label]) => {
          const field = bind(`/theme/colors/${key}`);
          return (
            <ColorField
              key={key}
              label={label}
              value={field.value}
              onValueChange={field.onValueChange}
              error={field.error}
            />
          );
        })}
      </FormGroup>

      <FormGroup title="Fonts">
        <SelectField
          label="Heading font"
          value={headingFont.value}
          groups={FONT_GROUPS}
          onValueChange={headingFont.onValueChange}
          error={headingFont.error}
        />
        <SelectField
          label="Body font"
          value={bodyFont.value}
          groups={FONT_GROUPS}
          onValueChange={bodyFont.onValueChange}
          error={bodyFont.error}
        />
      </FormGroup>

      <FormGroup title="Frame">
        <SelectField
          label="Frame style"
          value={frameStyle.value}
          options={FRAME_STYLES}
          onValueChange={frameStyle.onValueChange}
          error={frameStyle.error}
        />
        <NumberField
          label="Frame width (px)"
          value={frameWidth.value}
          min={WIDGET_LIMITS.FRAME_WIDTH.MIN}
          max={WIDGET_LIMITS.FRAME_WIDTH.MAX}
          hint={`${WIDGET_LIMITS.FRAME_WIDTH.MIN} to ${WIDGET_LIMITS.FRAME_WIDTH.MAX}`}
          onValueChange={frameWidth.onValueChange}
          error={frameWidth.error}
        />
        <ColorField
          label="Frame color"
          value={frameColor.value}
          onValueChange={frameColor.onValueChange}
          error={frameColor.error}
        />
        <SegmentedField
          legend="Corners"
          value={corners.value}
          options={CORNERS}
          onValueChange={corners.onValueChange}
          error={corners.error}
        />
      </FormGroup>

      <FormGroup title="Buttons">
        <SegmentedField
          legend="Button style"
          value={buttonStyle.value}
          options={BUTTON_STYLES}
          onValueChange={buttonStyle.onValueChange}
          error={buttonStyle.error}
        />
        <SwitchField
          label="Uppercase labels"
          description="Common in shooters and arcade games"
          checked={buttonCase.value === 'upper'}
          onCheckedChange={(isUpper) => buttonCase.onValueChange(isUpper ? 'upper' : 'normal')}
          error={buttonCase.error}
        />
      </FormGroup>

      <FormGroup title="Panel">
        <RangeField
          label="Panel opacity"
          value={Math.round(opacity.value * 100)}
          min={WIDGET_LIMITS.PANEL_OPACITY_PERCENT.MIN}
          max={WIDGET_LIMITS.PANEL_OPACITY_PERCENT.MAX}
          step={5}
          formatValue={(percent) => `${percent}%`}
          onValueChange={(percent) => opacity.onValueChange(percent / 100)}
          error={opacity.error}
        />
        <SwitchField
          label="Blur behind the panel"
          description="A see-through, frosted look"
          checked={blur.value}
          onCheckedChange={blur.onValueChange}
          error={blur.error}
        />
      </FormGroup>

      <FormGroup title="Textures" description="Built-in patterns, one per part of the panel.">
        {TEXTURE_SLOTS.map((slot) => {
          const field = bind(`/theme/textures/${slot.key}`);
          return (
            <SelectField
              key={slot.key}
              label={slot.label}
              value={field.value?.asset ?? NO_TEXTURE}
              options={TEXTURES}
              onValueChange={(asset) =>
                asset === NO_TEXTURE ? field.onClear() : field.onValueChange({ asset, ...NEW_TEXTURE })
              }
              error={field.error}
            />
          );
        })}
      </FormGroup>
    </>
  );
}
