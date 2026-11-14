import { SelectField } from '@/shared/ui/SelectField';
import { TextField } from '@/shared/ui/TextField';

import { ADMIN_LIMITS, STATUS_FILTER_OPTIONS } from '../../config/adminConfig';

/** Search box and status filter above the table. Both are controlled by the page. */
export function DevelopersFilters({ search, status, onSearchChange, onStatusChange }) {
  return (
    <form
      className="filters"
      role="search"
      aria-label="Filter developers"
      onSubmit={(event) => event.preventDefault()}
    >
      <TextField
        label="Search"
        name="search"
        type="search"
        placeholder="Email or name"
        autoComplete="off"
        maxLength={ADMIN_LIMITS.SEARCH_MAX}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <SelectField
        label="Status"
        value={status}
        options={STATUS_FILTER_OPTIONS}
        onValueChange={onStatusChange}
      />
    </form>
  );
}
