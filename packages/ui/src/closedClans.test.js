import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { normalizeRoles } from './data/roles.js';
import { loadExample, mount } from './testUtils.js';

// Closed clans: a player asks to join a closed clan and a leader of that clan answers. The host (clan-sdk) says which clans are
// closed (`joinPolicy`), which one the player asked (`requested`), who asked the player's own clan (`clanRequests`, only for the
// leaders who may decide) and gives the actions. The panel draws it.

const arena = () => loadExample('valid/arena.json');
const wolves = { id: 'clan-w', name: 'Wolves', badge: 'star', description: 'Closed raids', memberCount: 5, joinPolicy: 'closed' };
const foxes = { id: 'clan-f', name: 'Foxes', badge: 'moon', description: 'Anyone', memberCount: 4, joinPolicy: 'open' };

afterEach(() => {
  document.body.innerHTML = '';
});

/** The player has no clan and looks at the clans (Discover), with the given actions. */
function discover(clans, actions = {}) {
  const config = arena();
  const data = { ...createMockData(config, { inClan: false }), clans, screen: 'discover', tab: 'clan', actions };
  return mount(config, data);
}

const buttonOf = (root, name) => [...root().querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent) === name || b.textContent === name);

describe('Discover: a closed clan takes a request', () => {
  it('says Request and Closed on a closed clan and Join on an open one', () => {
    const { root } = discover([wolves, foxes]);
    const rows = [...root().querySelectorAll('.sk-row')];

    expect(rows[0].textContent).toContain('Wolves');
    expect(rows[0].textContent).toContain('Closed');
    expect(rows[0].querySelector('button')).toHaveTextContent('Request');
    expect(rows[0].querySelector('button')).toHaveAccessibleName('Ask to join Wolves');
    expect(rows[1].textContent).not.toContain('Closed');
    expect(rows[1].querySelector('button')).toHaveTextContent('Join');
  });

  it('asks the host to join, which sends the request for a closed clan', () => {
    const join = vi.fn();
    const { root } = discover([wolves, foxes], { join });

    buttonOf(root, 'Ask to join Wolves').click();
    expect(join).toHaveBeenCalledWith('clan-w');
  });

  it('shows Requested once asked, and a click takes the request back', () => {
    const cancelJoinRequest = vi.fn();
    const join = vi.fn();
    const { root } = discover([{ ...wolves, requested: true }, foxes], { join, cancelJoinRequest });
    const requested = root().querySelector('.sk-row button');

    expect(requested).toHaveTextContent('Requested');
    expect(requested).not.toBeDisabled();
    expect(requested).toHaveAccessibleName('Requested to join Wolves. Take the request back');
    requested.click();
    expect(cancelJoinRequest).toHaveBeenCalledWith('clan-w');
    expect(join).not.toHaveBeenCalled();
  });

  it('keeps a full closed clan off, and a clan with no policy (an older host) as an open one', () => {
    const config = arena();
    const max = config.clan.maxMembers;
    const { root } = discover([{ ...wolves, memberCount: max }, { id: 'old', name: 'Old Timers', memberCount: 2 }]);
    const [full, old] = [...root().querySelectorAll('.sk-row button')];

    expect(full).toBeDisabled();
    expect(old).toHaveTextContent('Join');
    expect(old.getAttribute('aria-label')).toBeNull();
  });

  it('is off for a player who is in a clan already', () => {
    const config = arena();
    const data = { ...createMockData(config), clans: [wolves], screen: 'discover', tab: 'clan', actions: { cancelJoinRequest: vi.fn() } };
    const { root } = mount(config, data);

    expect(root().querySelector('.sk-row button')).toBeDisabled();
  });
});

describe('Create: who can join', () => {
  const create = (actions) => {
    const config = arena();
    const data = { ...createMockData(config, { inClan: false }), screen: 'create', tab: 'clan', actions };
    return mount(config, data);
  };
  const typeName = (root, name) => {
    const input = root().querySelector('[data-key="name"]');
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('offers Open and Closed to a host that knows closed clans, Open first', () => {
    const { root } = create({ setJoinPolicy: vi.fn() });
    const group = root().querySelector('[role="radiogroup"]');

    expect(group).toHaveAccessibleName('Who can join');
    expect([...group.querySelectorAll('[role="radio"]')].map((b) => [b.textContent, b.getAttribute('aria-checked')])).toEqual([
      ['Open', 'true'],
      ['Closed', 'false'],
    ]);
    expect(root().textContent).toContain('Anyone can join right away.');
  });

  it('sends the choice with the clan', () => {
    const createAction = vi.fn();
    const { root } = create({ setJoinPolicy: vi.fn(), create: createAction });

    root().querySelector('[data-key="policy-closed"]').click();
    expect(root().querySelector('[data-key="policy-closed"]')).toHaveAttribute('aria-checked', 'true');
    expect(root().querySelector('[data-key="policy-open"]')).toHaveAttribute('aria-checked', 'false');
    expect(root().textContent).toContain('Players ask to join; you and your leaders accept them.');

    typeName(root, 'Wolves');
    root().querySelector('.sk-spacer.sk-actions button:last-child').click();
    expect(createAction).toHaveBeenCalledTimes(1);
    expect(createAction.mock.calls[0][0]).toMatchObject({ name: 'Wolves', joinPolicy: 'closed' });
  });

  it('sends Open when nothing was changed', () => {
    const createAction = vi.fn();
    const { root } = create({ setJoinPolicy: vi.fn(), create: createAction });
    typeName(root, 'Foxes');
    root().querySelector('.sk-spacer.sk-actions button:last-child').click();

    expect(createAction.mock.calls[0][0].joinPolicy).toBe('open');
  });

  it('shows nothing and sends no policy when the host does not know closed clans', () => {
    const createAction = vi.fn();
    const { root } = create({ create: createAction });

    expect(root().querySelector('[role="radiogroup"]')).toBeNull();
    typeName(root, 'Foxes');
    root().querySelector('.sk-spacer.sk-actions button:last-child').click();
    expect('joinPolicy' in createAction.mock.calls[0][0]).toBe(false);
  });
});

describe('Members: the requests and who can join', () => {
  const asked = [
    { id: 'r1', playerId: 'p1', name: 'Rashad' },
    { id: 'r2', playerId: 'p2', name: 'Leyla' },
  ];
  const members = (overrides = {}, { role } = {}) => {
    const config = arena();
    const top = normalizeRoles(config).at(-1).id;
    const base = createMockData(config, { viewerRole: role ?? top });
    return mount(config, { ...base, clan: { ...base.clan, joinPolicy: 'closed' }, screen: 'members', tab: 'clan', clanRequests: [], actions: {}, ...overrides });
  };

  it('lists who asked with Accept and Decline, and tells the host which one', () => {
    const acceptJoinRequest = vi.fn();
    const declineJoinRequest = vi.fn();
    const { root } = members({ clanRequests: asked, actions: { acceptJoinRequest, declineJoinRequest, setJoinPolicy: vi.fn() } });
    const section = root().querySelector('[data-key="join-requests"]');

    expect(section).toHaveAccessibleName('Join requests');
    expect(section.textContent).toContain('Join requests · 2');
    expect([...section.querySelectorAll('[data-key^="request-"]')].map((row) => row.querySelector('.sk-name').textContent)).toEqual(['Rashad', 'Leyla']);

    buttonOf(root, 'Accept Rashad into the clan').click();
    expect(acceptJoinRequest).toHaveBeenCalledWith('r1');
    buttonOf(root, 'Decline Leyla').click();
    expect(declineJoinRequest).toHaveBeenCalledWith('r2');
  });

  it('turns both buttons off while one request is being answered', () => {
    const { root } = members({ clanRequests: asked, clanRequestPending: { action: 'accept', id: 'r1' }, actions: {} });

    expect([...root().querySelectorAll('[data-key^="request-"] button')].every((b) => b.disabled)).toBe(true);
  });

  it('says why a request could not be answered, and shows nothing at all when there is nothing to show', () => {
    const withError = members({ clanRequests: [], clanRequestError: 'This join request does not exist any more' });
    expect(withError.root().querySelector('[role="alert"]')).toHaveTextContent('This join request does not exist any more');

    const none = members({ clanRequests: [] });
    expect(none.root().querySelector('[data-key="join-requests"]')).toBeNull();
  });

  it('draws only what the host sent: a member the host sent no requests sees no section', () => {
    const { root } = members({ clanRequests: undefined }, { role: normalizeRoles(arena())[0].id });

    expect(root().querySelector('[data-key="join-requests"]')).toBeNull();
  });

  it('lets the owner open and close the clan, and shows the current choice', () => {
    const setJoinPolicy = vi.fn();
    const { root } = members({ actions: { setJoinPolicy } });

    expect(root().querySelector('[data-key="policy-closed"]')).toHaveAttribute('aria-checked', 'true');
    root().querySelector('[data-key="policy-open"]').click();
    expect(setJoinPolicy).toHaveBeenCalledWith('open');
    // The current choice is not a change.
    setJoinPolicy.mockClear();
    root().querySelector('[data-key="policy-closed"]').click();
    expect(setJoinPolicy).not.toHaveBeenCalled();
  });

  it('shows the choice to the owner only, and only on a host that knows closed clans', () => {
    const lowest = normalizeRoles(arena())[0].id;
    expect(members({ actions: { setJoinPolicy: vi.fn() } }, { role: lowest }).root().querySelector('[role="radiogroup"]')).toBeNull();
    expect(members({ actions: {} }).root().querySelector('[role="radiogroup"]')).toBeNull();
    // A clan from a Social that does not say: nothing to switch.
    const config = arena();
    const base = createMockData(config);
    const { root } = mount(config, { ...base, clan: { ...base.clan, joinPolicy: undefined }, screen: 'members', tab: 'clan', actions: { setJoinPolicy: vi.fn() } });
    expect(root().querySelector('[role="radiogroup"]')).toBeNull();
  });
});

describe('Home: a leader is told that players asked', () => {
  const home = (clanRequests, config = arena()) => {
    const navigate = vi.fn();
    const data = { ...createMockData(config), screen: 'home', tab: 'clan', clanRequests, actions: { screenChanged: navigate } };
    return { ...mount(config, data), navigate };
  };

  it('says how many, and one tap opens them on Members', () => {
    const { root, navigate } = home([{ id: 'r1', name: 'Rashad' }]);
    const notice = root().querySelector('[data-key="requests-notice"]');

    expect(notice).toHaveTextContent('1 player wants to join');
    expect(notice).toHaveAccessibleName('1 player wants to join. Review the requests');
    notice.click();
    expect(navigate).toHaveBeenCalledWith('members');
  });

  it('counts several', () => {
    const { root } = home([{ id: 'r1', name: 'Rashad' }, { id: 'r2', name: 'Leyla' }, { id: 'r3', name: 'Aysel' }]);

    expect(root().querySelector('[data-key="requests-notice"]')).toHaveTextContent('3 players want to join');
  });

  it('shows nothing without requests, or when the game switched Members off', () => {
    expect(home([]).root().querySelector('[data-key="requests-notice"]')).toBeNull();
    expect(home(undefined).root().querySelector('[data-key="requests-notice"]')).toBeNull();
    const config = arena();
    config.clan.screens.members.enabled = false;
    expect(home([{ id: 'r1', name: 'Rashad' }], config).root().querySelector('[data-key="requests-notice"]')).toBeNull();
  });
});
