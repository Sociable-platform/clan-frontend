import { useState } from 'react';

// The text of the announcement the visitor closed, kept in this browser. Storing the text (not a
// yes/no) means a new announcement shows again by itself.
const STORAGE_KEY = 'clan.home.announcement.closed';

function readClosed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Blocked storage: the strip simply comes back on the next visit.
    return null;
  }
}

/**
 * Whether the landing page's announcement strip is showing, and how to close it. Closing is
 * remembered in this browser until the announcement's text changes.
 */
export function useAnnouncement(announcement) {
  const [closedText, setClosedText] = useState(readClosed);
  const isVisible = announcement !== null && closedText !== announcement.text;

  const handleClose = () => {
    setClosedText(announcement.text);
    try {
      window.localStorage.setItem(STORAGE_KEY, announcement.text);
    } catch {
      // Not remembered; it stays closed for this visit.
    }
  };

  return { isVisible, handleClose };
}
