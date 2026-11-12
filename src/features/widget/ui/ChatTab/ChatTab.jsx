import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';

const rangeHint = ({ MIN, MAX }, unit = '') => `${MIN}–${MAX}${unit}`;

/** Which chat channels exist and the rules they enforce. */
export function ChatTab({ bind }) {
  const directMessages = bind('/chat/directMessages');
  const clanChat = bind('/chat/clanChat');
  const profanityFilter = bind('/chat/profanityFilter');
  const maxMessageLength = bind('/chat/maxMessageLength');
  const slowModeSeconds = bind('/chat/slowModeSeconds');
  const historyLimit = bind('/chat/historyLimit');

  return (
    <>
      <FormGroup title="Channels">
        <SwitchField
          label="Direct messages"
          description="Between friends only"
          checked={directMessages.value}
          onCheckedChange={directMessages.onValueChange}
          error={directMessages.error}
        />
        <SwitchField
          label="Clan chat"
          description="One channel per clan"
          checked={clanChat.value}
          onCheckedChange={clanChat.onValueChange}
          error={clanChat.error}
        />
        <SwitchField
          label="Profanity filter"
          description="Banned words become ***"
          checked={profanityFilter.value}
          onCheckedChange={profanityFilter.onValueChange}
          error={profanityFilter.error}
        />
      </FormGroup>

      <FormGroup title="Message rules">
        <NumberField
          label="Max message length"
          value={maxMessageLength.value}
          min={WIDGET_LIMITS.MESSAGE_LENGTH.MIN}
          max={WIDGET_LIMITS.MESSAGE_LENGTH.MAX}
          step={20}
          hint={rangeHint(WIDGET_LIMITS.MESSAGE_LENGTH, ' chars')}
          onValueChange={maxMessageLength.onValueChange}
          error={maxMessageLength.error}
        />
        <NumberField
          label="Slow mode"
          value={slowModeSeconds.value}
          min={WIDGET_LIMITS.SLOW_MODE_SECONDS.MIN}
          max={WIDGET_LIMITS.SLOW_MODE_SECONDS.MAX}
          unit="s"
          hint={`${rangeHint(WIDGET_LIMITS.SLOW_MODE_SECONDS, ' s')}, 0 is off`}
          onValueChange={slowModeSeconds.onValueChange}
          error={slowModeSeconds.error}
        />
        <NumberField
          label="History shown"
          value={historyLimit.value}
          min={WIDGET_LIMITS.HISTORY_LIMIT.MIN}
          max={WIDGET_LIMITS.HISTORY_LIMIT.MAX}
          step={5}
          hint={rangeHint(WIDGET_LIMITS.HISTORY_LIMIT, ' messages')}
          onValueChange={historyLimit.onValueChange}
          error={historyLimit.error}
        />
      </FormGroup>
    </>
  );
}
