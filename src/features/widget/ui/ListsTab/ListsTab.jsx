import { PartEditor } from '../PartEditor';

/** Lists: the rows and cards of clans, members, friend requests and the clan header. */
export function ListsTab({ bind, onShowInPreview }) {
  return (
    <>
      <p className="note">Clan, member and request rows and the clan header card. The preview opens on Members, where the rows are.</p>
      <PartEditor partKey="row" bind={bind} onShowInPreview={onShowInPreview} />
    </>
  );
}
