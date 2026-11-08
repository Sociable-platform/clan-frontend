/** The editor's sections as buttons. A section with server problems shows how many. */
export function SectionNav({ sections, activeId, problemCounts, onSelect }) {
  return (
    <nav aria-label="Widget sections" className="editor-nav">
      {sections.map((section) => {
        const count = problemCounts[section.id] ?? 0;
        return (
          <button
            key={section.id}
            type="button"
            className="editor-nav-item"
            aria-current={section.id === activeId ? 'true' : undefined}
            onClick={() => onSelect(section.id)}
          >
            {section.label}
            {count > 0 ? (
              <>
                <span aria-hidden="true" className="editor-nav-count">
                  {count}
                </span>
                <span className="visually-hidden">{`, ${count} ${count === 1 ? 'problem' : 'problems'}`}</span>
              </>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
