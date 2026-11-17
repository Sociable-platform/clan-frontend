import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router-dom';

import { Icon } from '@/shared/ui/Icon';

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
 * The account button at the end of the header: a user icon that opens a menu with who is signed
 * in (`accountLabel`, `accountDetail`) and the actions the caller passes as `items`: `{ key, label, icon, onSelect }` or `{ key, label, icon, to }` for a
 * link. Radix handles the keyboard, focus and Escape.
 */
export function UserMenu({ accountLabel = null, accountDetail = null, items }) {
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
          {accountLabel ? <DropdownMenu.Separator className="user-menu-separator" /> : null}

          {items.map((item) => (
            <MenuItem key={item.key} item={item} />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
