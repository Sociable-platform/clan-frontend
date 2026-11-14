import { useState } from 'react';

import { DEFAULT_WIDGET_CONFIG, useWidgetPreview } from '@/features/widget';
import { SwitchField } from '@/shared/ui/SwitchField';

import { DEMO } from './homeContent';

const TAB_KEYS = DEMO.tabs.map((tab) => tab.key);

/**
 * A small piece of the editor next to the real widget: switch a tab off or pick a colour on the
 * left and the widget on the right changes at once. The widget is the shared renderer with mock
 * data, exactly as in the editor's preview, so nothing here needs an account or the network.
 * At least one tab stays on: a widget with no tabs has nothing to show.
 */
export function HomeDemo() {
  const [config, setConfig] = useState(DEFAULT_WIDGET_CONFIG);
  const preview = useWidgetPreview(config);
  const enabledCount = TAB_KEYS.filter((key) => config[key].enabled).length;

  const handleToggleTab = (key, enabled) => {
    if (!enabled && enabledCount === 1) return;
    setConfig((current) => ({ ...current, [key]: { ...current[key], enabled } }));
  };
  const handleSelectColor = (brand) =>
    setConfig((current) => ({ ...current, theme: { ...current.theme, colors: { ...current.theme.colors, brand } } }));

  return (
    <section aria-labelledby="home-demo-title" className="home-demo">
      <div className="home-demo-editor">
        <p className="home-eyebrow">{DEMO.editorEyebrow}</p>
        <h2 id="home-demo-title" className="home-demo-title">
          {DEMO.title}
        </h2>
        {DEMO.tabs.map((tab) => (
          <SwitchField
            key={tab.key}
            label={tab.label}
            description={tab.description}
            checked={config[tab.key].enabled}
            onCheckedChange={(enabled) => handleToggleTab(tab.key, enabled)}
          />
        ))}
        {enabledCount === 1 ? <p className="home-demo-hint">{DEMO.lastTabHint}</p> : null}
        <div role="group" aria-label={DEMO.colorLabel} className="home-demo-colors">
          <span className="home-demo-colors-label">{DEMO.colorLabel}</span>
          {DEMO.colors.map((color) => (
            <button
              key={color.value}
              type="button"
              className="home-demo-color"
              style={{ background: color.value }}
              aria-label={color.name}
              aria-pressed={config.theme.colors.brand === color.value}
              onClick={() => handleSelectColor(color.value)}
            />
          ))}
        </div>
        <p className="home-text">{DEMO.publishNote}</p>
      </div>
      <div className="home-demo-game">
        <p className="home-eyebrow">{DEMO.gameEyebrow}</p>
        <div ref={preview.containerRef} className="home-demo-canvas" role="region" aria-label="Widget demo" />
      </div>
    </section>
  );
}
