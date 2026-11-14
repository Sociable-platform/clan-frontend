import { useState } from 'react';

import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';
import { NumberField } from '@/shared/ui/NumberField';
import { SwitchField } from '@/shared/ui/SwitchField';

import { ASSET_KINDS, ASSET_MESSAGES, ASSET_RULES } from '../../config/widgetAssets';
import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { BADGES, CLAN_SCREENS } from '../../config/widgetOptions';
import { assetLabel, isCustomAssetId } from '../../utils/customAssets';
import { AssetHandoff } from '../AssetHandoff';
import { AssetImportButton } from '../AssetImportButton';
import { BadgeTile } from '../BadgeTile';
import { RolesEditor } from '../RolesEditor';

const rangeHint = ({ MIN, MAX }, unit = '') => `${MIN}–${MAX}${unit}`;

const unique = (list) => [...new Set(list)];

/** Clan screens, clan rules and the badge icons players can pick from (built in, or imported by the developer). */
export function ClanTab({ bind, assets }) {
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);
  const [notice, setNotice] = useState(null);
  // Custom names the developer turned off stay listed while this tab is open, so they can be turned back on.
  const [turnedOffIds, setTurnedOffIds] = useState([]);
  const maxMembers = bind('/clan/maxMembers');
  const descriptionMax = bind('/clan/descriptionMax');
  const tags = bind('/clan/tags');
  const badges = bind('/clan/badges/allowed');
  const showStats = bind('/clan/screens/home/showStats');
  const allowedBadges = badges.value ?? [];

  const imported = assets.library[ASSET_KINDS.BADGE];
  const customIds = unique([...Object.keys(imported), ...turnedOffIds, ...allowedBadges.filter(isCustomAssetId)]);
  const tiles = [
    ...BADGES,
    ...customIds.map((id) => ({
      id,
      label: assetLabel(id),
      glyph: assetLabel(id).charAt(0),
      imageUrl: imported[id] ?? null,
      isCustom: true,
    })),
  ];
  const selectedTile = tiles.find((tile) => tile.id === selectedBadgeId) ?? null;

  const handleBadgeToggle = (badgeId, isAllowed) => {
    setSelectedBadgeId(badgeId);
    if (!isAllowed && isCustomAssetId(badgeId)) setTurnedOffIds((ids) => unique([...ids, badgeId]));
    if (isAllowed && allowedBadges.length >= WIDGET_LIMITS.BADGES_MAX) {
      setNotice(ASSET_MESSAGES.TOO_MANY_BADGES);
      return;
    }
    setNotice(null);
    badges.onValueChange(tiles.map((tile) => tile.id).filter((id) => (id === badgeId ? isAllowed : allowedBadges.includes(id))));
  };

  const handleImportBadge = async (file) => {
    setNotice(null);
    const id = await assets.importAsset(ASSET_KINDS.BADGE, file, customIds, ASSET_KINDS.BADGE);
    if (!id) return;
    setSelectedBadgeId(id);
    if (allowedBadges.length >= WIDGET_LIMITS.BADGES_MAX) setNotice(ASSET_MESSAGES.TOO_MANY_BADGES);
    else badges.onValueChange([...allowedBadges, id]);
  };

  const handleRemoveBadge = (badgeId) => {
    assets.removeAsset(ASSET_KINDS.BADGE, badgeId);
    badges.onValueChange(allowedBadges.filter((id) => id !== badgeId));
    setTurnedOffIds((ids) => ids.filter((id) => id !== badgeId));
    setSelectedBadgeId(null);
    setNotice(null);
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
          description="Member count under the clan name when the info is open"
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

      <RolesEditor bind={bind} />

      <FormGroup
        title="Badge set"
        aside={`${allowedBadges.length} of ${tiles.length} on`}
        description="Players pick one when they create a clan. Tap a badge to turn it on or off, or import your own image."
      >
        <div className="badge-grid">
          {tiles.map((tile) => (
            <BadgeTile
              key={tile.id}
              badge={tile}
              isOn={allowedBadges.includes(tile.id)}
              isSelected={tile.id === selectedBadgeId}
              onToggle={(isOn) => handleBadgeToggle(tile.id, isOn)}
            />
          ))}
        </div>
        {selectedTile?.isCustom ? (
          <div className="asset-selected">
            <span className="asset-selected-name">{selectedTile.label}</span>
            {selectedTile.imageUrl ? null : (
              <span className="asset-selected-note">
                Not imported in this browser, so the preview shows its first letter. Import the same file to see it here. Your game uses its own file.
              </span>
            )}
            <button type="button" className="button button-secondary" onClick={() => handleRemoveBadge(selectedTile.id)}>
              Remove {selectedTile.label}
            </button>
          </div>
        ) : null}
        <AssetImportButton
          label="Import badge image"
          accept={ASSET_RULES[ASSET_KINDS.BADGE].accept}
          hint={ASSET_RULES[ASSET_KINDS.BADGE].hint}
          onFile={handleImportBadge}
        />
        {assets.error && assets.errorOrigin === ASSET_KINDS.BADGE ? (
          <p role="alert" className="field-error">
            {assets.error}
          </p>
        ) : null}
        {notice ? (
          <p role="alert" className="field-error">
            {notice}
          </p>
        ) : null}
        <FieldError id="badges-error">{badges.error}</FieldError>
        <AssetHandoff kindLabel="badge" badgeIds={allowedBadges.filter(isCustomAssetId)} />
      </FormGroup>
    </>
  );
}
