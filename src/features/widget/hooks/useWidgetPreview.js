import { createMockData, googleFontsHref, render } from '@clan/ui';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_PREVIEW_SCREEN, isClanScreen, isTabView, PREVIEW_FONTS_LINK_ATTRIBUTE } from '../config/widgetPreview';

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

/** Mock data for the draft, plus what the player did in the preview (accepted requests, sent messages, member changes). */
function buildPreviewData({ config, screen, accepted, sent, viewerRole, managed }) {
  const base = createMockData(config, { inClan: isClanScreen(screen), viewerRole });
  const members = base.members
    .filter((member) => !managed.kicked.includes(member.id))
    .map((member) => (managed.changes[member.id] ? { ...member, role: managed.changes[member.id] } : member));
  const addedFriends = base.requests.filter((request) => accepted.includes(request.id)).map((request) => ({ id: request.id, name: request.name, status: 'Just added', online: true }));
  const sentIn = (conversation) => sent.filter((message) => message.conversation === conversation);

  return {
    ...base,
    members,
    clan: base.clan ? { ...base.clan, memberCount: members.length } : null,
    friends: [...base.friends, ...addedFriends],
    requests: base.requests.filter((request) => !accepted.includes(request.id)),
    messages: [...base.messages, ...sentIn('clan')],
    threads: Object.fromEntries(Object.entries(base.threads).map(([id, thread]) => [id, [...thread, ...sentIn(id)]])),
  };
}

/**
 * Mounts the shared widget renderer (`@clan/ui`, the same code the SDK runs) into a container and
 * keeps it showing the draft with mock data and no network. `assetUrls` are the images the developer imported
 * for custom badges and textures (`{ badges, textures }`, by name). The host owns which tab and clan screen
 * are shown: the picker and the widget's own buttons both end up in `tab` and `screen`.
 */
export function useWidgetPreview(config, assetUrls) {
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const [tab, setTab] = useState('clan');
  const [screen, setScreen] = useState(DEFAULT_PREVIEW_SCREEN);
  const [accepted, setAccepted] = useState([]);
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
  const data = useMemo(
    () => ({
      ...buildPreviewData({ config, screen, accepted, sent, viewerRole, managed }),
      assets: assetUrls,
      tab,
      screen,
      open: true,
      actions: {
        screenChanged: setScreen,
        tabChanged: setTab,
        join: () => setScreen('home'),
        create: () => setScreen('home'),
        leave: () => setScreen('discover'),
        acceptRequest: (requestId) => setAccepted((ids) => [...ids, requestId]),
        setRole: (memberId, roleId) => manage((current) => ({ ...current, changes: { ...current.changes, [memberId]: roleId } })),
        kick: (memberId) => manage((current) => ({ ...current, kicked: [...current.kicked, memberId] })),
        sendMessage: (body, { conversation }) =>
          setSent((messages) => [...messages, { id: `sent-${messages.length}`, from: 'You', body, mine: true, conversation }]),
      },
    }),
    [config, assetUrls, tab, screen, accepted, sent, viewerRole, managedState],
  );
  const latest = useRef({ config, data });
  latest.current = { config, data };

  useEffect(() => {
    const handle = render(containerRef.current, latest.current.config, latest.current.data);
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.update(config, data);
  }, [config, data]);

  const handleSelectView = (viewId) => {
    if (isTabView(viewId)) {
      setTab(viewId);
      return;
    }
    setTab('clan');
    setScreen(viewId);
  };

  return {
    containerRef,
    selectedView: tab === 'clan' ? screen : tab,
    viewerRole,
    roleOptions: [...roles].reverse().map((role) => ({ value: role.id, label: role.name })),
    handleSelectView,
    handleSelectViewerRole: setViewerRoleId,
  };
}
