import { useMutation, useQueryClient } from '@tanstack/react-query';

import { registerGame } from '../api/gamesApi';
import { GAMES_QUERY_KEYS } from '../config/gamesQueryKeys';

/** Rejects with the `ApiError` so the form can show it; refreshes the games list on success. */
export function useRegisterGameMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values) => registerGame(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GAMES_QUERY_KEYS.all }),
  });

  return { registerGame: mutation.mutateAsync, isPending: mutation.isPending };
}
