import { PartEditor } from '../PartEditor';
import { ChatLayoutGroup } from '../StyleGroups';
import { TextureSlot } from '../TextureSlot';

/** Chat messages: bubbles or log, each side's bubble and the bubble texture. */
export function MessagesTab({ bind, assets, onShowInPreview }) {
  return (
    <>
      <ChatLayoutGroup bind={bind} />
      <PartEditor partKey="bubbleMine" bind={bind} onShowInPreview={onShowInPreview} />
      <PartEditor partKey="bubbleTheirs" bind={bind} onShowInPreview={onShowInPreview} />
      <TextureSlot slotKey="bubble" bind={bind} assets={assets} />
    </>
  );
}
