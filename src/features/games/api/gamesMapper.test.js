import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { mapGame, mapGameList } from './gamesMapper';

const RAW_GAME = {
  id: '0d6f2c0e-5b1a-4f5e-8f55-2f4f0c7a9b11',
  name: 'Space Raiders',
  description: '',
  createdAt: '2026-11-07T09:30:00Z',
};

describe('gamesMapper', () => {
  it('maps a raw game to the UI shape, with the developer\'s role', () => {
    expect(mapGame({ ...RAW_GAME, role: 'owner' })).toEqual({ ...RAW_GAME, role: 'owner', isOwner: true });
  });

  it('maps a member: not an owner', () => {
    expect(mapGame({ ...RAW_GAME, role: 'member' })).toMatchObject({ role: 'member', isOwner: false });
  });

  it('treats a game without a role as the developer\'s own (a server from before teams)', () => {
    expect(mapGame(RAW_GAME)).toMatchObject({ role: 'owner', isOwner: true });
  });

  it('never makes an unknown role an owner', () => {
    expect(mapGame({ ...RAW_GAME, role: 'admin' })).toMatchObject({ role: 'member', isOwner: false });
  });

  it('unwraps the list envelope into a plain array', () => {
    expect(mapGameList({ games: [{ ...RAW_GAME, role: 'member' }] })).toEqual([
      { ...RAW_GAME, role: 'member', isOwner: false },
    ]);
  });

  it('maps an empty list to an empty array', () => {
    expect(mapGameList({ games: [] })).toEqual([]);
  });

  it('rejects a response that is not a game list', () => {
    expect(() => mapGameList({})).toThrow(ApiError);
    expect(() => mapGame({ name: 'No id' })).toThrow(ApiError);
  });
});
