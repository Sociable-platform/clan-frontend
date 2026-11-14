import { CardChoiceField } from '@/shared/ui/CardChoiceField';
import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';
import { SwitchField } from '@/shared/ui/SwitchField';

import { POSITIONS, TABS } from '../../config/widgetOptions';
import { ChoicePreview } from '../ChoicePreview';

const POSITION_CARDS = POSITIONS.map((position) => ({
  ...position,
  preview: <ChoicePreview kind="dock" value={position.value} />,
}));

/** Where the panel sits and which tabs it has. `tabsError` is the "keep one tab on" rule. */
export function LayoutTab({ bind, tabsError }) {
  const position = bind('/layout/position');

  return (
    <>
      <FormGroup title="Panel position">
        <CardChoiceField
          legend="Panel position"
          value={position.value}
          options={POSITION_CARDS}
          onValueChange={position.onValueChange}
          error={position.error}
        />
      </FormGroup>

      <FormGroup title="Tabs">
        {TABS.map((tab) => {
          const enabled = bind(`/${tab.key}/enabled`);
          return (
            <SwitchField
              key={tab.key}
              label={tab.label}
              description={tab.description}
              checked={enabled.value}
              onCheckedChange={enabled.onValueChange}
              error={enabled.error}
            />
          );
        })}
        <FieldError id="tabs-error">{tabsError}</FieldError>
      </FormGroup>
    </>
  );
}
