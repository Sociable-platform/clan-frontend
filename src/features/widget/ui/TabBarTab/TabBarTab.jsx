import { PartEditor } from '../PartEditor';

/** The tab bar under the title: the tabs and the one that is open. */
export function TabBarTab({ bind, onShowInPreview }) {
  return (
    <>
      <p className="note">The tabs under the widget title (Friends, Clan, Chat). Each part keeps following the theme until you customize it.</p>
      <PartEditor partKey="tab" bind={bind} onShowInPreview={onShowInPreview} />
      <PartEditor partKey="tabSelected" bind={bind} onShowInPreview={onShowInPreview} />
    </>
  );
}
