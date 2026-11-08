import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { BADGES, CLAN_SCREENS } from '../../config/widgetOptions';
import { BadgeTile } from '../BadgeTile';

const rangeHint = ({ MIN, MAX }, unit = '') => `${MIN}–${MAX}${unit}`;

/** Clan screens, clan rules and the badge icons players can pick from. */
export function ClanTab({ bind }) {
  const maxMembers = bind('/clan/maxMembers');
  const descriptionMax = bind('/clan/descriptionMax');
  const tags = bind('/clan/tags');
  const badges = bind('/clan/badges/allowed');
  const showStats = bind('/clan/screens/home/showStats');
  const allowedBadges = badges.value ?? [];

  const handleBadgeToggle = (badgeId, isAllowed) => {
    const next = BADGES.map((badge) => badge.id).filter((id) =>
      id === badgeId ? isAllowed : allowedBadges.includes(id),
    );
    badges.onValueChange(next);
  };

  return (
    <>
      <FormGroup
        title="Clan screens"
        description="A player in a clan opens straight into Home and chat. Discover and Create only show to players without a clan."
      >
        {CLAN_SCREENS.map((screen, index) => {
          const enabled = bind(`/clan/screens/${screen.key}/enabled`);
          return (
            <SwitchField
              key={screen.key}
              badge={String(index + 1).padStart(2, '0')}
              label={screen.label}
              description={`${screen.audience} · ${screen.description}`}
              checked={enabled.value}
              onCheckedChange={enabled.onValueChange}
              error={enabled.error}
            />
          );
        })}
        <SwitchField
          label="Stats on Home"
          description="Member count and level in the Home header"
          checked={showStats.value}
          onCheckedChange={showStats.onValueChange}
          error={showStats.error}
        />
      </FormGroup>

      <FormGroup title="Rules">
        <NumberField
          label="Max members"
          value={maxMembers.value}
          min={WIDGET_LIMITS.MAX_MEMBERS.MIN}
          max={WIDGET_LIMITS.MAX_MEMBERS.MAX}
          step={5}
          hint={rangeHint(WIDGET_LIMITS.MAX_MEMBERS)}
          onValueChange={maxMembers.onValueChange}
          error={maxMembers.error}
        />
        <NumberField
          label="Description length"
          value={descriptionMax.value}
          min={WIDGET_LIMITS.DESCRIPTION_MAX.MIN}
          max={WIDGET_LIMITS.DESCRIPTION_MAX.MAX}
          step={10}
          hint={rangeHint(WIDGET_LIMITS.DESCRIPTION_MAX, ' chars')}
          onValueChange={descriptionMax.onValueChange}
          error={descriptionMax.error}
        />
        <SwitchField
          label="Clan tags"
          description="Shown in the game above the player"
          checked={tags.value}
          onCheckedChange={tags.onValueChange}
          error={tags.error}
        />
      </FormGroup>

      <FormGroup
        title="Badge set"
        aside={`${allowedBadges.length} of ${BADGES.length} on`}
        description="You provide the badges. Players pick one when they create a clan. Tap to turn a badge on or off."
      >
        <div className="badge-grid">
          {BADGES.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              isOn={allowedBadges.includes(badge.id)}
              onToggle={(isOn) => handleBadgeToggle(badge.id, isOn)}
            />
          ))}
        </div>
        <FieldError id="badges-error">{badges.error}</FieldError>
      </FormGroup>
    </>
  );
}
