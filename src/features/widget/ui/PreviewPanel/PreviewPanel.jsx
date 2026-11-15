import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useId } from 'react';

import { Icon } from '@/shared/ui/Icon';

import { PREVIEW_CLAN_VIEWS, PREVIEW_TABS } from '../../config/widgetPreview';
import { useWidgetPreview } from '../../hooks/useWidgetPreview';

const CLAN_VIEW_LABELS = Object.fromEntries(PREVIEW_CLAN_VIEWS.map((view) => [view.id, view.label]));

/** The Clan tab of the picker: it names the clan screen on show and opens the list of the four clan screens. */
function ClanViewMenu({ preview }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="chip preview-clan-trigger" aria-pressed={preview.tab === 'clan'}>
        Clan
        <span className="preview-screen-hint"> · {CLAN_VIEW_LABELS[preview.screen] ?? preview.screen}</span>
        <Icon name="chevronDown" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="start" sideOffset={6} className="user-menu" aria-label="Clan screen to preview">
          <DropdownMenu.RadioGroup
            value={preview.tab === 'clan' ? (preview.selectedView ?? '') : ''}
            onValueChange={preview.handleSelectView}
          >
            {PREVIEW_CLAN_VIEWS.map((view) => (
              <DropdownMenu.RadioItem key={view.id} value={view.id} className="user-menu-item preview-clan-item">
                {view.label}
                <span className="preview-clan-item-hint">{view.hint}</span>
                <DropdownMenu.ItemIndicator className="user-menu-check">
                  <Icon name="check" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** The live preview: the real widget drawn from the draft with fake data, on a plain background. */
export function PreviewPanel({ config, assetUrls, requestedView = null }) {
  const preview = useWidgetPreview(config, assetUrls, requestedView);
  const viewerId = useId();

  return (
    <section aria-labelledby="preview-heading" className="studio-card">
      {/* Two rows of two: the title with the "Viewing as" label, then the picker with the role list under that label. */}
      <header className="studio-card-header preview-header">
        <h2 id="preview-heading" className="studio-card-title studio-card-title-main">
          Preview
        </h2>
        <label htmlFor={viewerId} className="field-label preview-viewer-label">
          Viewing as
        </label>
      </header>
      <div className="preview-controls">
        <div className="preview-screens" role="group" aria-label="Widget view to preview">
          {PREVIEW_TABS.map((tab) =>
            tab.id === 'clan' ? (
              <ClanViewMenu key={tab.id} preview={preview} />
            ) : (
              <button
                key={tab.id}
                type="button"
                className="chip"
                aria-pressed={preview.tab === tab.id}
                onClick={() => preview.handleSelectView(tab.id)}
              >
                {tab.label}
              </button>
            ),
          )}
        </div>
        <select
          id={viewerId}
          className="field-input field-select preview-viewer-select"
          value={preview.viewerRole}
          onChange={(event) => preview.handleSelectViewerRole(event.target.value)}
        >
          {preview.roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="preview-stage">
        <div ref={preview.containerRef} className="preview-canvas" role="region" aria-label="Widget preview" />
      </div>
    </section>
  );
}
