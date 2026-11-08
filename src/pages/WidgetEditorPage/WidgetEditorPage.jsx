import { Link, useParams } from 'react-router-dom';

import {
  AdvancedSection,
  ChatSection,
  ClanSection,
  LayoutSection,
  ProblemList,
  SaveStatus,
  SectionNav,
  StyleSection,
  TextsSection,
  WIDGET_MESSAGES,
  WidgetEditorSkeleton,
} from '@/features/widget';
import { ROUTES } from '@/shared/config';
import { ErrorState } from '@/shared/ui/ErrorState';

import { useWidgetEditorPage } from './useWidgetEditorPage';

function WidgetEditor({ gameId }) {
  const page = useWidgetEditorPage(gameId);
  const gameLink = (
    <p>
      <Link to={ROUTES.game(gameId)}>{page.gameName ?? 'Game'}</Link>
    </p>
  );

  if (page.isGameNotFound) {
    return (
      <div className="page">
        <ErrorState
          title={WIDGET_MESSAGES.GAME_NOT_FOUND_TITLE}
          message={WIDGET_MESSAGES.GAME_NOT_FOUND_MESSAGE}
        />
        <p>
          <Link to={ROUTES.games}>Back to games</Link>
        </p>
      </div>
    );
  }

  if (page.isError) {
    return (
      <div className="page">
        {gameLink}
        <ErrorState
          title={WIDGET_MESSAGES.LOAD_ERROR_TITLE}
          message={WIDGET_MESSAGES.LOAD_ERROR_MESSAGE}
          onRetry={page.handleRetryLoad}
        />
      </div>
    );
  }

  if (!page.isReady) {
    return (
      <div className="page">
        {gameLink}
        <h1>{WIDGET_MESSAGES.PAGE_TITLE}</h1>
        <p role="status" className="visually-hidden">
          Loading the widget draft
        </p>
        <WidgetEditorSkeleton />
      </div>
    );
  }

  const sections = {
    style: <StyleSection bind={page.bind} />,
    layout: <LayoutSection bind={page.bind} tabsError={page.tabsError} />,
    clan: <ClanSection bind={page.bind} />,
    chat: <ChatSection bind={page.bind} />,
    texts: <TextsSection bind={page.bind} />,
    advanced: <AdvancedSection json={page.rawJson} bytes={page.rawBytes} />,
  };

  return (
    <div className="page editor-page">
      {gameLink}
      <div className="editor-toolbar">
        <h1>{page.gameName ? `${WIDGET_MESSAGES.PAGE_TITLE} · ${page.gameName}` : WIDGET_MESSAGES.PAGE_TITLE}</h1>
        <SaveStatus status={page.status} onRetry={page.handleRetrySave} />
      </div>
      <ProblemList saveError={page.saveError} unplacedErrors={page.unplacedErrors} />

      <div className="editor">
        <SectionNav
          sections={page.sectionItems}
          activeId={page.activeSectionId}
          problemCounts={page.problemCounts}
          onSelect={page.handleSelectSection}
        />
        <div className="editor-panel">{sections[page.activeSectionId]}</div>
      </div>
    </div>
  );
}

export function WidgetEditorPage() {
  const { gameId } = useParams();
  return <WidgetEditor key={gameId} gameId={gameId} />;
}
