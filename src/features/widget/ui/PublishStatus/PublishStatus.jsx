import { WIDGET_MESSAGES } from '../../config/widgetConfig';
import { PUBLISH_STATUS } from '../../hooks/useWidgetPublishing';

/** Whether players see this draft: never published, the live version, or a draft that moved on. */
export function PublishStatus({ status, latestVersion }) {
  const text = {
    [PUBLISH_STATUS.NOT_PUBLISHED]: WIDGET_MESSAGES.NOT_PUBLISHED,
    [PUBLISH_STATUS.PUBLISHED]: `Published · v${latestVersion}`,
    [PUBLISH_STATUS.CHANGED]: WIDGET_MESSAGES.UNPUBLISHED_CHANGES,
  }[status];

  return (
    <span className="publish-status" data-status={status}>
      {text}
    </span>
  );
}
