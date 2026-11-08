import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';
import { SegmentedField } from '@/shared/ui/SegmentedField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { POSITIONS, TABS } from '../../config/widgetOptions';

/** Where the panel sits and which tabs it has. `tabsError` is the "at least one tab" rule. */
export function LayoutSection({ bind, tabsError }) {
  const position = bind('/layout/position');
  const startCollapsed = bind('/layout/startCollapsed');

  return (
    <>
      <FormGroup title="Panel">
        <SegmentedField
          legend="Panel position"
          value={position.value}
          options={POSITIONS}
          onValueChange={position.onValueChange}
          error={position.error}
        />
        <SwitchField
          label="Start collapsed"
          description="Players open the panel from the launcher button"
          checked={startCollapsed.value}
          onCheckedChange={startCollapsed.onValueChange}
          error={startCollapsed.error}
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
