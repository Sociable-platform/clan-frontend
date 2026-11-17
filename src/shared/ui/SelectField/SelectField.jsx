import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useId } from 'react';

import { FieldError } from '@/shared/ui/FieldError';
import { Icon } from '@/shared/ui/Icon';

function renderOption(option) {
  return (
    <DropdownMenu.RadioItem key={option.value} value={option.value} className="user-menu-item">
      {option.label}
      <DropdownMenu.ItemIndicator className="user-menu-check">
        <Icon name="check" />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.RadioItem>
  );
}

/**
 * Labelled dropdown. Pass `options` ({ value, label }) or `groups` ({ label, options }) for a
 * list with headings. `value` and `onValueChange` deal in option values, not events. `tip`
 * (optional) is shown right after the label text: an `InfoTip` that explains the field. It sits
 * beside the label, not inside it, so pressing it does not also open the list.
 *
 * `placeholder` (optional) is what the closed button says while `value` matches no option (nothing chosen yet),
 * in a muted colour. It is only that text: it is not an option, so it is not in the list. Leave `value` as ''
 * until a choice is made, and the field stays "empty" for validation.
 *
 * It is a button that opens a menu (the same menu as the account and Clan menus), not a native
 * select, so every list in the app looks alike in both themes. The button is named by the label
 * and the option on show ("Reason Abuse"), and carries the chosen value in `data-value`.
 */
export function SelectField({
  label,
  value,
  onValueChange,
  options = [],
  groups = null,
  placeholder = null,
  error = null,
  tip = null,
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const errorId = `${id}-error`;
  const allOptions = groups ? groups.flatMap((group) => group.options) : options;
  const current = allOptions.find((option) => option.value === value);
  const isPlaceholder = !current && placeholder !== null;

  return (
    <div className="field">
      <div className="field-label-tip">
        <label id={labelId} htmlFor={id} className="field-label">
          {label}
        </label>
        {tip}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          id={id}
          className="field-input field-select"
          data-value={value}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          <span id={valueId} className={isPlaceholder ? 'field-select-value field-select-placeholder' : 'field-select-value'}>
            {current?.label ?? (isPlaceholder ? placeholder : value)}
          </span>
          <Icon name="chevronDown" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="start" sideOffset={6} className="user-menu field-select-menu" aria-label={label}>
            <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
              {groups
                ? groups.map((group) => (
                    <DropdownMenu.Group key={group.label}>
                      <DropdownMenu.Label className="field-select-group">{group.label}</DropdownMenu.Label>
                      {group.options.map(renderOption)}
                    </DropdownMenu.Group>
                  ))
                : options.map(renderOption)}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
