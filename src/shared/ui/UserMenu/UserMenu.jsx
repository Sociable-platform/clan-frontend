import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router-dom';

import { THEMES, useTheme } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';

const THEME_OPTIONS = [
  { value: THEMES.LIGHT, label: 'Light theme', icon: 'sun' },
  { value: THEMES.DARK, label: 'Dark theme', icon: 'moon' },
];

function MenuItem({ item }) {
  const content = (
    <>
      <Icon name={item.icon} />
      {item.label}
    </>
  );

  if (item.to) {
    return (
      <DropdownMenu.Item asChild>
        <Link to={item.to} className="user-menu-item">
          {content}
        </Link>
      </DropdownMenu.Item>
    );
  }
  return (
    <DropdownMenu.Item className="user-menu-item" onSelect={item.onSelect}>
      {content}
    </DropdownMenu.Item>
  );
}

/**
 * The one button at the end of the header: a user icon that opens a menu with who is signed in
 * (`accountLabel`, `accountDetail`), the light / dark choice (remembered) and the actions the
 * caller passes as `items`: `{ key, label, icon, onSelect }` or `{ key, label, icon, to }` for a
 * link. Radix handles the keyboard, focus and Escape.
 */
export function UserMenu({ accountLabel = null, accountDetail = null, items }) {
  const { theme, selectTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="user-menu-trigger"
        aria-label={accountLabel ? `Account menu, ${accountLabel}` : 'Account menu'}
      >
        <Icon name="user" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="user-menu">
          {accountLabel ? (
            <DropdownMenu.Label className="user-menu-account">
              <span className="user-menu-name">{accountLabel}</span>
              {accountDetail ? <span className="user-menu-detail">{accountDetail}</span> : null}
            </DropdownMenu.Label>
          ) : null}

          <DropdownMenu.Label className="user-menu-caption">Theme</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={theme} onValueChange={selectTheme}>
            {THEME_OPTIONS.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="user-menu-item"
                // Stay open so the page visibly changes while the menu is still there.
                onSelect={(event) => event.preventDefault()}
              >
                <Icon name={option.icon} />
                {option.label}
                <DropdownMenu.ItemIndicator className="user-menu-check">
                  <Icon name="check" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>

          <DropdownMenu.Separator className="user-menu-separator" />
          {items.map((item) => (
            <MenuItem key={item.key} item={item} />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
