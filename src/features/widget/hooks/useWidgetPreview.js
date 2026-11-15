import { createMockData, googleFontsHref, render } from '@clan/ui';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_PREVIEW_SCREEN, isClanScreen, isTabView, PREVIEW_FONTS_LINK_ATTRIBUTE } from '../config/widgetPreview';
import { createSlowModePreview } from '../utils/previewSlowMode';

/** Keep one stylesheet link in the page head with the Google fonts the draft uses (a Shadow DOM cannot load fonts itself). */
function usePreviewFonts(config) {
  const href = googleFontsHref(config);

  useEffect(() => {
    let link = document.head.querySelector(`link[${PREVIEW_FONTS_LINK_ATTRIBUTE}]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute(PREVIEW_FONTS_LINK_ATTRIBUTE, '');
      document.head.append(link);
    }
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }, [href]);
}

const NO_CHANGES = { changes: {}, kicked: [] };

/** Mock data for the draft, plus what the player did in the preview (accepted and declined requests, removed and blocked friends, unblocked players, friend requests sent to clan members, sent messages, member changes). */
function buildPreviewData({ config, inClan, accepted, declined, removed, blockedIds, unblocked, requested, sent, viewerRole, managed }) {
  const base = createMockData(config, { inClan, viewerRole });
  const members = base.members
    .filter((member) => !managed.kicked.includes(member.id))
    .map((member) => (managed.changes[member.id] ? { ...member, role: managed.changes[member.id] } : member))
    .map((member) => (requested.includes(member.id) ? { ...member, relation: 'request_sent' } : member));
  const addedFriends = base.requests.filter((request) => accepted.includes(request.id)).map((request) => ({ id: request.id, name: request.name, status: 'Just added', online: true }));
  const allFriends = [...base.friends, ...addedFriends];
  const sentIn = (conversation) => sent.filter((message) => message.conversation === conversation);

  return {
    ...base,
    members,
    clan: base.clan ? { ...base.clan, memberCount: members.length } : null,
    friends: allFriends.filter((friend) => !removed.includes(friend.id) && !blockedIds.includes(friend.id)),
    // A blocked friend joins the blocked list; unblocking takes a player off it but does not bring the friendship back.
    blocked: [...base.blocked, ...allFriends.filter((friend) => blockedIds.includes(friend.id)).map(({ id, name }) => ({ id, name }))].filter((player) => !unblocked.includes(player.id)),
    requests: base.requests.filter((request) => !accepted.includes(request.id) && !declined.includes(request.id)),
    messages: [...base.messages, ...sentIn('clan')],
    threads: Object.fromEntries(Object.entries(base.threads).map(([id, thread]) => [id, [...thread, ...sentIn(id)]])),
  };
}

/**
 * Mounts the shared widget renderer (`@clan/ui`, the same code the SDK runs) into a container and
 * keeps it showing the draft with mock data and no network. `assetUrls` are the images the developer imported
 * for custom badges and textures (`{ badges, textures }`, by name). `requestedView` is `{ view, id }`: a request to show a view. The host owns which tab and clan screen
 * are shown: the picker and the widget's own buttons both end up in `tab` and `screen`. Sending a message starts the
 * game's slow mode wait on the Send button, as the SDK shows it to a player (utils/previewSlowMode).
 */
export function useWidgetPreview(config, assetUrls, requestedView = null) {
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  // Slow mode as a player sees it: after a sent message, Send waits for chat.slowModeSeconds.
  const slowModeRef = useRef(null);
  const [tab, setTab] = useState('clan');
  const [screen, setScreen] = useState(DEFAULT_PREVIEW_SCREEN);
  const [inClan, setInClan] = useState(isClanScreen(DEFAULT_PREVIEW_SCREEN));
  const [accepted, setAccepted] = useState([]);
  const [declined, setDeclined] = useState([]);
  const [requested, setRequested] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [unblocked, setUnblocked] = useState([]);
  const [sent, setSent] = useState([]);
  const [viewerRoleId, setViewerRoleId] = useState(null);
  const [managedState, setManagedState] = useState({ scope: '', ...NO_CHANGES });
  usePreviewFonts(config);

  // Who is looking, and what they changed. Changes belong to one set of roles and one viewer: edit the
  // roles or switch viewer and the members start again from the mock list.
  const roles = config?.clan?.roles ?? [];
  const viewerRole = roles.some((role) => role.id === viewerRoleId) ? viewerRoleId : roles.at(-1)?.id;
  const scope = `${roles.map((role) => role.id).join(',')}|${viewerRole}`;
  const managed = managedState.scope === scope ? managedState : { scope, ...NO_CHANGES };
  const manage = (change) => setManagedState({ scope, ...change(managed) });
  const joinClan = () => {
    setInClan(true);
    setScreen('home');
  };
  const leaveClan = () => {
    setInClan(false);
    setScreen('discover');
  };

  const data = useMemo(
    () => ({
      ...buildPreviewData({ config, inClan, accepted, declined, removed, blockedIds, unblocked, requested, sent, viewerRole, managed }),
      assets: assetUrls,
      tab,
      screen,
      actions: {
        screenChanged: setScreen,
        tabChanged: setTab,
        join: () => joinClan(),
        create: () => joinClan(),
        leave: () => leaveClan(),
        acceptRequest: (requestId) => setAccepted((ids) => [...ids, requestId]),
        declineRequest: (requestId) => setDeclined((ids) => [...ids, requestId]),
        addFriend: (playerId) => setRequested((ids) => [...ids, playerId]),
        cancelFriendRequest: (playerId) => setRequested((ids) => ids.filter((id) => id !== playerId)),
        removeFriend: (friendId) => setRemoved((ids) => [...ids, friendId]),
        // Blocking also ends the friendship, so in the preview the friend leaves the list and joins the blocked one.
        blockFriend: (friendId) => setBlockedIds((ids) => [...ids, friendId]),
        unblock: (playerId) => setUnblocked((ids) => [...ids, playerId]),
        setRole: (memberId, roleId) => manage((current) => ({ ...current, changes: { ...current.changes, [memberId]: roleId } })),
        kick: (memberId) => manage((current) => ({ ...current, kicked: [...current.kicked, memberId] })),
        sendMessage: (body, { conversation }) => {
          if (slowModeRef.current?.waiting()) return;
          setSent((messages) => [...messages, { id: `sent-${messages.length}`, from: 'You', body, mine: true, conversation }]);
          slowModeRef.current?.start(config?.chat?.slowModeSeconds);
        },
      },
    }),
    [config, assetUrls, tab, screen, inClan, accepted, declined, removed, blockedIds, unblocked, requested, sent, viewerRole, managedState],
  );
  const latest = useRef({ config, data });
  latest.current = { config, data };

  useEffect(() => {
    const handle = render(containerRef.current, latest.current.config, latest.current.data);
    handleRef.current = handle;
    const slowMode = createSlowModePreview(() => containerRef.current?.querySelector('[data-clan-ui]')?.shadowRoot);
    slowModeRef.current = slowMode;
    return () => {
      slowMode.destroy();
      slowModeRef.current = null;
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.update(config, data);
    // The update repainted the composer: put a running wait back on its Send button.
    slowModeRef.current?.decorate();
  }, [config, data]);

  // Picking Home or Members puts the player in the mock clan; Discover or Create, out of it. Opening Discover
  // from the widget's own Find clans button keeps the player in the clan, so membership is its own state.
  const handleSelectView = (viewId) => {
    if (isTabView(viewId)) {
      setTab(viewId);
      return;
    }
    setTab('clan');
    setScreen(viewId);
    setInClan(isClanScreen(viewId));
  };

  // Something outside the preview (the Parts tab) asked to see a view: each request has a new `id`, so asking for the same view again works.
  useEffect(() => {
    if (requestedView) handleSelectView(requestedView.view);
    // Only a new request id matters here, not the other values the handler reads.
  }, [requestedView?.id]);

  return {
    containerRef,
    tab,
    screen,
    // Discover opened from inside the clan is not the "no clan" Discover of the picker.
    selectedView: tab === 'clan' ? (inClan && screen === 'discover' ? null : screen) : tab,
    viewerRole,
    roleOptions: [...roles].reverse().map((role) => ({ value: role.id, label: role.name })),
    handleSelectView,
    handleSelectViewerRole: setViewerRoleId,
  };
}
