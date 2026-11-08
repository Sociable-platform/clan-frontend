import { FormGroup } from '@/shared/ui/FormGroup';
import { TextField } from '@/shared/ui/TextField';

import { WIDGET_LIMITS, WIDGET_MESSAGES } from '../../config/widgetConfig';
import { DEFAULT_TERMS, LABEL_GROUPS } from '../../config/widgetOptions';
import { resolveLabel } from '../../utils/resolveLabel';

/**
 * The words in the panel. A label left empty uses the default, shown as the placeholder
 * and following the clan word the developer picks.
 */
export function TextsSection({ bind }) {
  const texts = bind('/texts');
  const clanTerm = bind('/texts/terms/clan');
  const clansTerm = bind('/texts/terms/clans');
  const terms = { clan: clanTerm.value ?? DEFAULT_TERMS.clan, clans: clansTerm.value ?? DEFAULT_TERMS.clans };

  const handleReset = () => texts.onValueChange({ terms: { ...DEFAULT_TERMS }, labels: {} });

  return (
    <>
      <FormGroup title="Clan word" description="What players call a clan, for example Guild or Team.">
        <TextField
          label="Name (singular)"
          value={terms.clan}
          maxLength={WIDGET_LIMITS.TERM_MAX}
          error={clanTerm.error}
          onChange={(event) => clanTerm.onValueChange(event.target.value)}
        />
        <TextField
          label="Name (plural)"
          value={terms.clans}
          maxLength={WIDGET_LIMITS.TERM_MAX}
          error={clansTerm.error}
          onChange={(event) => clansTerm.onValueChange(event.target.value)}
        />
      </FormGroup>

      {LABEL_GROUPS.map((group) => (
        <FormGroup key={group.title} title={group.title}>
          {group.labels.map((label) => {
            const field = bind(`/texts/labels/${label.key}`);
            return (
              <TextField
                key={label.key}
                label={label.name}
                value={field.value ?? ''}
                placeholder={resolveLabel(label.fallback, terms)}
                maxLength={WIDGET_LIMITS.LABEL_MAX}
                error={field.error}
                onChange={(event) =>
                  event.target.value.trim() === '' ? field.onClear() : field.onValueChange(event.target.value)
                }
              />
            );
          })}
        </FormGroup>
      ))}

      <div>
        <button type="button" className="button button-secondary" onClick={handleReset}>
          {WIDGET_MESSAGES.RESET_TEXTS}
        </button>
      </div>
    </>
  );
}
