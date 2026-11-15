import { Link, useParams } from 'react-router-dom';

import {
  ButtonsTab,
  ChatTab,
  ClanTab,
  ConfigPanel,
  GeneralTab,
  LayoutTab,
  ListsTab,
  MessagesTab,
  PanelTab,
  PreviewPanel,
  ProblemList,
  PublishNotice,
  RollbackDialog,
  StudioBar,
  TabBarTab,
  TextsTab,
  VersionHistoryPanel,
  VersionPreviewPanel,
  WIDGET_MESSAGES,
  WidgetEditorSkeleton,
} from '@/features/widget';
import { ROUTES } from '@/shared/config';
import { HeaderSlot } from '@/shared/ui/AppLayout';
import { ErrorState } from '@/shared/ui/ErrorState';
import { ReadOnlyScope } from '@/shared/ui/ReadOnlyScope';
import { TabList, TabPanel } from '@/shared/ui/TabList';

import { STUDIO_ANCHORS, useWidgetEditorPage } from './useWidgetEditorPage';

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
    clan: <ClanTab bind={page.bind} assets={page.assets} />,
    chat: <ChatTab bind={page.bind} />,
    texts: <TextsTab bind={page.bind} />,
  };
  const { publishing } = page;
  const styleTabContent = {
    general: <GeneralTab bind={page.bind} assets={page.assets} />,
    panel: <PanelTab bind={page.bind} assets={page.assets} />,
    messages: <MessagesTab bind={page.bind} assets={page.assets} onShowInPreview={page.handleShowInPreview} />,
    buttons: <ButtonsTab bind={page.bind} assets={page.assets} onShowInPreview={page.handleShowInPreview} />,
    tabs: <TabBarTab bind={page.bind} onShowInPreview={page.handleShowInPreview} />,
    lists: <ListsTab bind={page.bind} onShowInPreview={page.handleShowInPreview} />,
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
          history={page.history}
          publish={{
            status: publishing.publishStatus,
            latestVersion: publishing.latestVersion,
            nextVersion: publishing.nextVersion,
            isPublishing: publishing.isPublishing,
            onPublish: publishing.handlePublish,
            readOnlyMessage: page.readOnlyMessage,
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
            <ReadOnlyScope isReadOnly={page.readOnlyMessage !== null}>
              {layoutTabContent[page.activeLayoutTabId]}
            </ReadOnlyScope>
          </TabPanel>
        </section>

        <div className="studio-center">
          <PreviewPanel config={page.config} assetUrls={page.assets.urls} requestedView={page.previewRequest} />
          {page.isHistoryOpen ? (
            <div id={STUDIO_ANCHORS.history} className="studio-anchor">
              <VersionHistoryPanel
                versions={publishing.versions}
                latestVersion={publishing.latestVersion}
                previewedVersion={publishing.previewVersionNumber}
                isLoading={publishing.isHistoryLoading}
                isError={publishing.isHistoryError}
                onRetry={publishing.handleRetryHistory}
                onPreview={page.handlePreviewVersion}
                onRollBack={publishing.handleRollbackRequest}
                readOnlyMessage={page.readOnlyMessage}
              />
            </div>
          ) : null}
          {publishing.previewVersionNumber !== null ? (
            <div id={STUDIO_ANCHORS.versionPreview} className="studio-anchor">
              <VersionPreviewPanel
                versionNumber={publishing.previewVersionNumber}
                version={publishing.previewVersion}
                isLoading={publishing.isPreviewLoading}
                isError={publishing.isPreviewError}
                isLive={publishing.previewVersionNumber === publishing.latestVersion}
                onRetry={publishing.handleRetryPreview}
                onClose={publishing.handleClosePreview}
                onRollBack={publishing.handleRollbackRequest}
                readOnlyMessage={page.readOnlyMessage}
              />
            </div>
          ) : null}
          {page.isConfigOpen && publishing.previewVersionNumber === null ? (
            <div id={STUDIO_ANCHORS.config} className="studio-anchor">
              <ConfigPanel
                json={page.rawJson}
                bytes={page.rawBytes}
                schemaVersion={page.schemaVersion}
                problemCount={page.problemCount}
              />
            </div>
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
            <ReadOnlyScope isReadOnly={page.readOnlyMessage !== null}>
              {styleTabContent[page.activeStyleTabId]}
            </ReadOnlyScope>
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
