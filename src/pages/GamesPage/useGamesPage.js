import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAccountAccess } from '@/features/auth';
import { useGamesQuery, useRegisterGameForm } from '@/features/games';
import { useInvitationsQuery } from '@/features/invitations';
import { GAME_KEYS_PARAM } from '@/shared/config';

/** Owns the data and form state for the games page; the page itself only renders. */
export function useGamesPage() {
  const { games, isLoading, isError, refetch } = useGamesQuery();
  // Invitations other developers sent to this account wait on their own page; the games page only says how many.
  const { invitations } = useInvitationsQuery();
  // "Register game" opens a dialog; a saved game closes it and the list refreshes by itself.
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const form = useRegisterGameForm({ onRegistered: () => setIsRegisterOpen(false) });
  // A suspended account is read-only: registering a game would be refused.
  const { readOnlyMessage } = useAccountAccess();
  // The API keys used to open on this page (?keys=<gameId>); the page redirects such a link.
  const [searchParams] = useSearchParams();
  const legacyKeysGameId = searchParams.get(GAME_KEYS_PARAM);

  // The search box filters the loaded list by name, description or game ID; nothing is requested.
  const query = search.trim().toLowerCase();
  const visibleGames = query
    ? games.filter((game) => [game.name, game.description, game.id].some((text) => text.toLowerCase().includes(query)))
    : games;

  const handleSearchChange = (event) => setSearch(event.target.value);

  const handleRegisterOpen = () => setIsRegisterOpen(true);

  // Closing throws away what was typed, so the next open starts empty. Not while a request runs.
  const handleRegisterClose = () => {
    if (form.isPending) return;
    setIsRegisterOpen(false);
    form.reset();
  };

  return {
    games: visibleGames,
    pendingInvitations: invitations.length,
    search,
    hasNoMatches: games.length > 0 && visibleGames.length === 0,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && games.length === 0,
    hasGames: games.length > 0,
    form,
    readOnlyMessage,
    legacyKeysGameId,
    isRegisterOpen,
    handleRetry: refetch,
    handleSearchChange,
    handleRegisterOpen,
    handleRegisterClose,
  };
}
