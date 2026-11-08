import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { BADGES, CLAN_SCREENS } from '../../config/widgetOptions';

const rangeHint = ({ MIN, MAX }) => `${MIN} to ${MAX}`;

/** Clan rules, the badges players can pick from and which clan screens exist. */
export function ClanSection({ bind }) {
  const maxMembers = bind('/clan/maxMembers');
  const tags = bind('/clan/tags');
  const descriptionMax = bind('/clan/descriptionMax');
  const badges = bind('/clan/badges/allowed');
  const showStats = bind('/clan/screens/home/showStats');
  const allowedBadges = badges.value ?? [];

  const handleBadgeChange = (badgeId, isAllowed) => {
    const next = BADGES.map((badge) => badge.id).filter((id) =>
      id === badgeId ? isAllowed : allowedBadges.includes(id),
    );
    badges.onValueChange(next);
  };

  return (
    <>
      <FormGroup title="Rules">
        <NumberField
          label="Max members"
          value={maxMembers.value}
          min={WIDGET_LIMITS.MAX_MEMBERS.MIN}
          max={WIDGET_LIMITS.MAX_MEMBERS.MAX}
          hint={rangeHint(WIDGET_LIMITS.MAX_MEMBERS)}
          onValueChange={maxMembers.onValueChange}
          error={maxMembers.error}
        />
        <NumberField
          label="Description length"
          value={descriptionMax.value}
          min={WIDGET_LIMITS.DESCRIPTION_MAX.MIN}
          max={WIDGET_LIMITS.DESCRIPTION_MAX.MAX}
          hint={`Characters, ${rangeHint(WIDGET_LIMITS.DESCRIPTION_MAX)}`}
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

      <FormGroup title="Badges" description="The icons a clan can pick. With none selected clans get a plain tag.">
        {BADGES.map((badge) => (
          <SwitchField
            key={badge.id}
            label={`${badge.glyph} ${badge.label}`}
            checked={allowedBadges.includes(badge.id)}
            onCheckedChange={(isAllowed) => handleBadgeChange(badge.id, isAllowed)}
          />
        ))}
        <FieldError id="badges-error">{badges.error}</FieldError>
      </FormGroup>

      <FormGroup title="Screens" description="A player in a clan opens straight into Home. Discover and Create only show to players without a clan.">
        {CLAN_SCREENS.map((screen) => {
          const enabled = bind(`/clan/screens/${screen.key}/enabled`);
          return (
            <SwitchField
              key={screen.key}
              label={screen.label}
              description={screen.description}
              checked={enabled.value}
              onCheckedChange={enabled.onValueChange}
              error={enabled.error}
            />
          );
        })}
        <SwitchField
          label="Show stats on Home"
          checked={showStats.value}
          onCheckedChange={showStats.onValueChange}
          error={showStats.error}
        />
      </FormGroup>
    </>
  );
}
