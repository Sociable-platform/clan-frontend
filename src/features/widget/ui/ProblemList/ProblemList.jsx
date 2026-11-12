import { FormAlert } from '@/shared/ui/FormAlert';

import { WIDGET_MESSAGES } from '../../config/widgetConfig';

/**
 * Save problems that no field shows: a message for the whole save, and server errors whose
 * path is not a field of the form (listed with their path).
 */
export function ProblemList({ saveError, unplacedErrors }) {
  if (!saveError && unplacedErrors.length === 0) return null;

  return (
    <FormAlert>
      {saveError ?? WIDGET_MESSAGES.NOT_ACCEPTED}
      {unplacedErrors.length > 0 ? (
        <ul className="problem-list">
          {unplacedErrors.map((problem) => (
            <li key={problem.path}>
              <code>{problem.path || 'config'}</code>: {problem.message}
            </li>
          ))}
        </ul>
      ) : null}
    </FormAlert>
  );
}
