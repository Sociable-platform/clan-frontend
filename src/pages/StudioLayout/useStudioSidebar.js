import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { useAuthSession, useLogout } from '@/features/auth';
import { GAME_ROLE_LABELS, useGamesQuery } from '@/features/games';
import { useInvitationsQuery } from '@/features/invitations';

/**
 * What the sidebar shows: the developer's games (for the switcher), the game the address is in
 * (`/games/:gameId/...`), how many invitations wait, and who is signed in. On a narrow screen the
 * sidebar is a menu that opens from a button; going to another page closes it.
 */
export function useStudioSidebar() {
  const { gameId = null } = useParams();
  const { pathname } = useLocation();
  const { games } = useGamesQuery();
  const { invitations } = useInvitationsQuery();
  const { developer } = useAuthSession();
  const logout = useLogout();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // While the list loads, or for an address with a game this account is not on, the game is
  // unknown: the sidebar still shows the game's pages, without a name and without API keys.
  const game = gameId ? (games.find((item) => item.id === gameId) ?? null) : null;

  return {
    games,
    gameId,
    gameName: game?.name ?? null,
    gameRoleLabel: game ? GAME_ROLE_LABELS[game.role] : null,
    isOwner: game?.isOwner ?? false,
    pendingInvitations: invitations.length,
    accountName: developer?.name || developer?.email || null,
    accountEmail: developer?.name ? developer.email : null,
    isMenuOpen,
    handleMenuToggle: () => setIsMenuOpen((open) => !open),
    handleLogout: logout,
  };
}
