import { FrameGroup, PanelLookGroup } from '../StyleGroups';
import { TextureSlot } from '../TextureSlot';

/** The panel itself: its frame (bezel), how see-through it is, and the textures of the frame and the content area. */
export function PanelTab({ bind, assets }) {
  return (
    <>
      <FrameGroup bind={bind} />
      <PanelLookGroup bind={bind} />
      <TextureSlot slotKey="panel" bind={bind} assets={assets} />
      <TextureSlot slotKey="content" bind={bind} assets={assets} />
    </>
  );
}
