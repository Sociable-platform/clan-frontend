import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAccountAccess } from '@/features/auth';
import { useGamesQuery, useRegisterGameForm } from '@/features/games';
import { GAME_KEYS_PARAM } from '@/shared/config';

/** Owns the data and form state for the games page; the page itself only renders. */
export function useGamesPage() {
  const { games, isLoading, isError, refetch } = useGamesQuery();
  // "Register game" opens a dialog; a saved game closes it and the list refreshes by itself.
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const form = useRegisterGameForm({ onRegistered: () => setIsRegisterOpen(false) });
  // A suspended account is read-only: registering a game would be refused.
  const { readOnlyMessage } = useAccountAccess();
  // Which game's API keys are open is kept in the address (?keys=<gameId>), so the widget editor
  // and old /games/:gameId links can open the page on a game. One game at a time.
  const [searchParams, setSearchParams] = useSearchParams();
  const openGameId = searchParams.get(GAME_KEYS_PARAM);

  const handleToggleKeys = (gameId) => {
    setSearchParams(openGameId === gameId ? {} : { [GAME_KEYS_PARAM]: gameId }, { replace: true });
  };

  const handleRegisterOpen = () => setIsRegisterOpen(true);

  // Closing throws away what was typed, so the next open starts empty. Not while a request runs.
  const handleRegisterClose = () => {
    if (form.isPending) return;
    setIsRegisterOpen(false);
    form.reset();
  };

  return {
    games,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && games.length === 0,
    hasGames: games.length > 0,
    form,
    readOnlyMessage,
    openGameId,
    isRegisterOpen,
    handleRetry: refetch,
    handleToggleKeys,
    handleRegisterOpen,
    handleRegisterClose,
  };
}
