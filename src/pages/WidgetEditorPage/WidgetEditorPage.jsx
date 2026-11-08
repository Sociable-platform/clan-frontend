import { Link, useParams } from 'react-router-dom';

import {
  ChatTab,
  ClanTab,
  ColorsTab,
  ConfigPanel,
  LayoutTab,
  PreviewPanel,
  ProblemList,
  PublishNotice,
  RollbackDialog,
  ShapeTab,
  StudioBar,
  TextsTab,
  TexturesTab,
  TypeTab,
  VersionHistoryPanel,
  VersionPreviewPanel,
  WIDGET_MESSAGES,
  WidgetEditorSkeleton,
} from '@/features/widget';
import { ROUTES } from '@/shared/config';
import { HeaderSlot } from '@/shared/ui/AppLayout';
import { ErrorState } from '@/shared/ui/ErrorState';
import { TabList, TabPanel } from '@/shared/ui/TabList';

import { useWidgetEditorPage } from './useWidgetEditorPage';

function WidgetEditor({ gameId }) {
  const page = useWidgetEditorPage(gameId);

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
        <p>
          <Link to={ROUTES.game(gameId)}>{page.gameName ?? 'Game'}</Link>
        </p>
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
      <div className="studio">
        <h1 className="visually-hidden">{WIDGET_MESSAGES.PAGE_TITLE}</h1>
        <p role="status" className="visually-hidden">
          Loading the widget draft
        </p>
        <WidgetEditorSkeleton />
      </div>
    );
  }

  const layoutTabContent = {
    layout: <LayoutTab bind={page.bind} tabsError={page.tabsError} />,
    clan: <ClanTab bind={page.bind} />,
    chat: <ChatTab bind={page.bind} />,
    texts: <TextsTab bind={page.bind} />,
  };
  const { publishing } = page;
  const styleTabContent = {
    colors: <ColorsTab bind={page.bind} />,
    type: <TypeTab bind={page.bind} />,
    shape: <ShapeTab bind={page.bind} />,
    textures: <TexturesTab bind={page.bind} />,
  };

  return (
    <div className="studio">
      <h1 className="visually-hidden">
        {page.gameName ? `${WIDGET_MESSAGES.PAGE_TITLE} · ${page.gameName}` : WIDGET_MESSAGES.PAGE_TITLE}
      </h1>
      <HeaderSlot>
        <StudioBar
          gameName={page.gameName}
          gameId={gameId}
          gameHref={ROUTES.game(gameId)}
          status={page.status}
          onRetry={page.handleRetrySave}
          isConfigOpen={page.isConfigOpen}
          onToggleConfig={page.handleToggleConfig}
          isHistoryOpen={page.isHistoryOpen}
          onToggleHistory={page.handleToggleHistory}
          publish={{
            status: publishing.publishStatus,
            latestVersion: publishing.latestVersion,
            nextVersion: publishing.nextVersion,
            isPublishing: publishing.isPublishing,
            onPublish: publishing.handlePublish,
          }}
        />
      </HeaderSlot>
      <ProblemList saveError={page.saveError} unplacedErrors={page.unplacedErrors} />
      <PublishNotice notice={publishing.notice} onDismiss={publishing.handleDismissNotice} />

      <div className="studio-body">
        <section aria-label="Widget settings" className="studio-panel studio-left">
          <TabList
            label="Widget settings"
            idPrefix="settings"
            tabs={page.layoutTabs}
            activeId={page.activeLayoutTabId}
            onChange={page.handleSelectLayoutTab}
          />
          <TabPanel idPrefix="settings" id={page.activeLayoutTabId}>
            {layoutTabContent[page.activeLayoutTabId]}
          </TabPanel>
        </section>

        <div className="studio-center">
          <PreviewPanel config={page.config} />
          {page.isHistoryOpen ? (
            <VersionHistoryPanel
              versions={publishing.versions}
              latestVersion={publishing.latestVersion}
              previewedVersion={publishing.previewVersionNumber}
              isLoading={publishing.isHistoryLoading}
              isError={publishing.isHistoryError}
              onRetry={publishing.handleRetryHistory}
              onPreview={publishing.handlePreview}
              onRollBack={publishing.handleRollbackRequest}
            />
          ) : null}
          {publishing.previewVersionNumber !== null ? (
            <VersionPreviewPanel
              versionNumber={publishing.previewVersionNumber}
              version={publishing.previewVersion}
              isLoading={publishing.isPreviewLoading}
              isError={publishing.isPreviewError}
              isLive={publishing.previewVersionNumber === publishing.latestVersion}
              onRetry={publishing.handleRetryPreview}
              onClose={publishing.handleClosePreview}
              onRollBack={publishing.handleRollbackRequest}
            />
          ) : null}
          {page.isConfigOpen && publishing.previewVersionNumber === null ? (
            <ConfigPanel
              json={page.rawJson}
              bytes={page.rawBytes}
              schemaVersion={page.schemaVersion}
              problemCount={page.problemCount}
            />
          ) : null}
        </div>

        <section aria-labelledby="style-heading" className="studio-panel studio-right">
          <h2 id="style-heading" className="studio-panel-title">
            Style
          </h2>
          <TabList
            label="Style"
            idPrefix="style"
            tabs={page.styleTabs}
            activeId={page.activeStyleTabId}
            onChange={page.handleSelectStyleTab}
          />
          <TabPanel idPrefix="style" id={page.activeStyleTabId}>
            {styleTabContent[page.activeStyleTabId]}
          </TabPanel>
        </section>
      </div>

      <RollbackDialog
        version={publishing.versionToRollBack}
        newVersionNumber={publishing.nextVersion}
        isPending={publishing.isRollingBack}
        errorMessage={publishing.rollbackError}
        onCancel={publishing.handleRollbackCancel}
        onConfirm={publishing.handleRollbackConfirm}
      />
    </div>
  );
}

export function WidgetEditorPage() {
  const { gameId } = useParams();
  return <WidgetEditor key={gameId} gameId={gameId} />;
}
