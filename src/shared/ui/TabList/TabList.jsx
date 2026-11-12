const tabId = (idPrefix, id) => `${idPrefix}-tab-${id}`;
const panelId = (idPrefix, id) => `${idPrefix}-panel-${id}`;

/**
 * A row of tabs (the WAI-ARIA tabs pattern): one tab is selected, arrows/Home/End move between
 * them. `tabs` are `{ id, label, problemCount? }`; a tab with problems shows their number.
 * Pair every tab with a `TabPanel` that uses the same `idPrefix`.
 */
export function TabList({ label, idPrefix, tabs, activeId, onChange }) {
  const handleKeyDown = (event, index) => {
    const lastIndex = tabs.length - 1;
    const targets = { ArrowRight: index === lastIndex ? 0 : index + 1, ArrowLeft: index === 0 ? lastIndex : index - 1, Home: 0, End: lastIndex };
    if (!(event.key in targets)) return;

    event.preventDefault();
    const nextTab = tabs[targets[event.key]];
    onChange(nextTab.id);
    event.currentTarget.parentElement.querySelector(`#${CSS.escape(tabId(idPrefix, nextTab.id))}`)?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="tab-list">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        const count = tab.problemCount ?? 0;
        return (
          <button
            key={tab.id}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            className="tab"
            aria-selected={isActive}
            aria-controls={panelId(idPrefix, tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
            {count > 0 ? (
              <>
                <span aria-hidden="true" className="tab-count">
                  {count}
                </span>
                <span className="visually-hidden">{`, ${count} ${count === 1 ? 'problem' : 'problems'}`}</span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** The content of the selected tab. Only render it for the active tab. */
export function TabPanel({ idPrefix, id, children }) {
  return (
    <div role="tabpanel" id={panelId(idPrefix, id)} aria-labelledby={tabId(idPrefix, id)} className="tab-panel">
      {children}
    </div>
  );
}
