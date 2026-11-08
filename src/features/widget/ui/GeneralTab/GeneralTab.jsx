import { ColorsTab } from '../ColorsTab';
import { CornersGroup } from '../StyleGroups';
import { TextureLibrary } from '../TextureLibrary';
import { TypeTab } from '../TypeTab';

/**
 * What restyles the whole widget at once: dark or light, the five colors, the fonts and the corner style.
 * Everything about one part of the widget is in that part's own tab (Panel, Messages, Buttons, Tabs, Lists);
 * the images imported for textures are kept here.
 */
export function GeneralTab({ bind, assets }) {
  return (
    <>
      <ColorsTab bind={bind} />
      <CornersGroup bind={bind} />
      <TypeTab bind={bind} />
      <TextureLibrary bind={bind} assets={assets} />
    </>
  );
}
