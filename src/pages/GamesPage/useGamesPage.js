import { useGamesQuery, useRegisterGameForm } from '@/features/games';

/** Owns the data and form state for the games page; the page itself only renders. */
export function useGamesPage() {
  const { games, isLoading, isError, refetch } = useGamesQuery();
  const form = useRegisterGameForm();

  return {
    games,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && games.length === 0,
    hasGames: games.length > 0,
    form,
    handleRetry: refetch,
  };
}
