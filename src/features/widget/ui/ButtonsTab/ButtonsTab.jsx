import { PartEditor } from '../PartEditor';
import { ButtonStyleGroup } from '../StyleGroups';
import { TextureSlot } from '../TextureSlot';

/** Buttons: the look they share, the main and the outline ones separately, and the button texture. */
export function ButtonsTab({ bind, assets, onShowInPreview }) {
  return (
    <>
      <ButtonStyleGroup bind={bind} />
      <PartEditor partKey="button" bind={bind} onShowInPreview={onShowInPreview} />
      <PartEditor partKey="buttonSecondary" bind={bind} onShowInPreview={onShowInPreview} />
      <TextureSlot slotKey="button" bind={bind} assets={assets} />
    </>
  );
}
