import { CardChoiceField } from '@/shared/ui/CardChoiceField';
import { ColorField } from '@/shared/ui/ColorField';
import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { BUTTON_STYLES, CHAT_LAYOUT_DESCRIPTIONS, CHAT_LAYOUTS, CORNERS, FRAME_STYLES } from '../../config/widgetOptions';
import { ChoicePreview } from '../ChoicePreview';

const withPreview = (options, kind) => options.map((option) => ({ ...option, preview: <ChoicePreview kind={kind} value={option.value} /> }));

const CORNER_CARDS = withPreview(CORNERS, 'corners');
const FRAME_CARDS = withPreview(FRAME_STYLES, 'frame');
const BUTTON_CARDS = withPreview(BUTTON_STYLES, 'button');
const CHAT_LAYOUT_CARDS = CHAT_LAYOUTS.map((layout) => ({ ...layout, description: CHAT_LAYOUT_DESCRIPTIONS[layout.value] }));

/** Corners, frame, buttons, the panel's see-through look and how chat lines are drawn. */
export function ShapeTab({ bind }) {
  const corners = bind('/theme/frame/corners');
  const frameStyle = bind('/theme/frame/style');
  const frameWidth = bind('/theme/frame/width');
  const frameColor = bind('/theme/frame/color');
  const buttonStyle = bind('/theme/buttons/style');
  const buttonCase = bind('/theme/buttons/case');
  const opacity = bind('/theme/panel/opacity');
  const blur = bind('/theme/panel/blur');
  const chatLayout = bind('/chat/layout');
  const { MIN: minOpacity, MAX: maxOpacity } = WIDGET_LIMITS.PANEL_OPACITY_PERCENT;

  return (
    <>
      <FormGroup title="Corners">
        <CardChoiceField
          legend="Corners"
          value={corners.value}
          options={CORNER_CARDS}
          columns={4}
          onValueChange={corners.onValueChange}
          error={corners.error}
        />
      </FormGroup>

      <FormGroup title="Frame (bezel)">
        <CardChoiceField
          legend="Frame style"
          value={frameStyle.value}
          options={FRAME_CARDS}
          columns={3}
          onValueChange={frameStyle.onValueChange}
          error={frameStyle.error}
        />
        <NumberField
          label="Frame width"
          value={frameWidth.value}
          min={WIDGET_LIMITS.FRAME_WIDTH.MIN}
          max={WIDGET_LIMITS.FRAME_WIDTH.MAX}
          unit="px"
          onValueChange={frameWidth.onValueChange}
          error={frameWidth.error}
        />
        <ColorField label="Frame color" value={frameColor.value} onValueChange={frameColor.onValueChange} error={frameColor.error} />
      </FormGroup>

      <FormGroup title="Buttons">
        <CardChoiceField
          legend="Button style"
          value={buttonStyle.value}
          options={BUTTON_CARDS}
          columns={3}
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

      <FormGroup title="Panel over the game">
        <NumberField
          label="Opacity"
          value={Math.round(opacity.value * 100)}
          min={minOpacity}
          max={maxOpacity}
          step={5}
          unit="%"
          hint={`${minOpacity}–${maxOpacity}%`}
          onValueChange={(percent) => opacity.onValueChange(percent / 100)}
          error={opacity.error}
        />
        <SwitchField
          label="Blur the game behind"
          description="Keeps text readable when see-through"
          checked={blur.value}
          onCheckedChange={blur.onValueChange}
          error={blur.error}
        />
      </FormGroup>

      <FormGroup title="Chat layout">
        <CardChoiceField
          legend="Chat layout"
          value={chatLayout.value}
          options={CHAT_LAYOUT_CARDS}
          onValueChange={chatLayout.onValueChange}
          error={chatLayout.error}
        />
      </FormGroup>
    </>
  );
}
