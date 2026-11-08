import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { SegmentedField } from '@/shared/ui/SegmentedField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { CHAT_LAYOUTS } from '../../config/widgetOptions';

const rangeHint = ({ MIN, MAX }, unit) => `${unit}, ${MIN} to ${MAX}`;

/** How chat looks and which rules it enforces. */
export function ChatSection({ bind }) {
  const layout = bind('/chat/layout');
  const directMessages = bind('/chat/directMessages');
  const clanChat = bind('/chat/clanChat');
  const profanityFilter = bind('/chat/profanityFilter');
  const maxMessageLength = bind('/chat/maxMessageLength');
  const slowModeSeconds = bind('/chat/slowModeSeconds');
  const historyLimit = bind('/chat/historyLimit');

  return (
    <>
      <FormGroup title="Layout">
        <SegmentedField
          legend="Chat layout"
          value={layout.value}
          options={CHAT_LAYOUTS}
          onValueChange={layout.onValueChange}
          error={layout.error}
        />
        <p className="field-hint">Bubbles look like a messenger. Log lines read [TAG] Name: text, like an MMO.</p>
      </FormGroup>

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
      </FormGroup>

      <FormGroup title="Rules">
        <NumberField
          label="Max message length"
          value={maxMessageLength.value}
          min={WIDGET_LIMITS.MESSAGE_LENGTH.MIN}
          max={WIDGET_LIMITS.MESSAGE_LENGTH.MAX}
          hint={rangeHint(WIDGET_LIMITS.MESSAGE_LENGTH, 'Characters')}
          onValueChange={maxMessageLength.onValueChange}
          error={maxMessageLength.error}
        />
        <NumberField
          label="Slow mode"
          value={slowModeSeconds.value}
          min={WIDGET_LIMITS.SLOW_MODE_SECONDS.MIN}
          max={WIDGET_LIMITS.SLOW_MODE_SECONDS.MAX}
          hint={`${rangeHint(WIDGET_LIMITS.SLOW_MODE_SECONDS, 'Seconds between messages')} (0 is off)`}
          onValueChange={slowModeSeconds.onValueChange}
          error={slowModeSeconds.error}
        />
        <NumberField
          label="History shown"
          value={historyLimit.value}
          min={WIDGET_LIMITS.HISTORY_LIMIT.MIN}
          max={WIDGET_LIMITS.HISTORY_LIMIT.MAX}
          hint={rangeHint(WIDGET_LIMITS.HISTORY_LIMIT, 'Messages')}
          onValueChange={historyLimit.onValueChange}
          error={historyLimit.error}
        />
        <SwitchField
          label="Profanity filter"
          description="Banned words become ***"
          checked={profanityFilter.value}
          onCheckedChange={profanityFilter.onValueChange}
          error={profanityFilter.error}
        />
      </FormGroup>
    </>
  );
}
