import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link, NavLink } from 'react-router-dom';

import { GAME_ROLE_LABELS } from '@/features/games';
import wordmarkPositive from '@/shared/assets/brand/xsolla-wordmark-positive.png';
import wordmarkReverse from '@/shared/assets/brand/xsolla-wordmark-reverse.png';
import { DOCS_URL, PRODUCT_NAME, ROUTES } from '@/shared/config';
import { Icon } from '@/shared/ui/Icon';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

import { useStudioSidebar } from './useStudioSidebar';

const navClass = ({ isActive }) => (isActive ? 'studio-nav-link active' : 'studio-nav-link');

/**
 * The sidebar of the signed-in pages. On top, the game switcher: "All games" or the game the
 * address is in. Under it, the pages of what is chosen: Games and Invitations for all games; for
 * one game its widget editor (which opens without the sidebar), its team and, for its owner, its
 * API keys. At the bottom: Docs, Support, who is signed in and Log out.
 */
export function StudioSidebar() {
  const sidebar = useStudioSidebar();
  const inGame = sidebar.gameId !== null;

  return (
    <aside className="studio-sidebar" aria-label="Studio">
      <div className="studio-sidebar-top">
        <Link to={ROUTES.home} className="app-brand">
          <img src={wordmarkPositive} alt="Xsolla" className="app-brand-logo app-brand-logo-light" />
          <img src={wordmarkReverse} alt="Xsolla" className="app-brand-logo app-brand-logo-dark" />
          <span className="app-brand-name">{PRODUCT_NAME}</span>
        </Link>
        <div className="studio-sidebar-top-end">
          <ThemeToggle />
          <button
            type="button"
            className="header-icon-button studio-menu-button"
            aria-label="Menu"
            aria-expanded={sidebar.isMenuOpen}
            aria-controls="studio-sidebar-body"
            onClick={sidebar.handleMenuToggle}
          >
            <Icon name={sidebar.isMenuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      <div id="studio-sidebar-body" className="studio-sidebar-body" data-open={sidebar.isMenuOpen}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="studio-switcher" aria-label="Switch game">
            <span className="studio-switcher-mark">
              <Icon name="grid" />
            </span>
            <span className="studio-switcher-text">
              <span className="studio-switcher-title">{inGame ? (sidebar.gameName ?? 'Game') : 'All games'}</span>
              <span className="studio-switcher-detail">
                {inGame
                  ? (sidebar.gameRoleLabel ?? '')
                  : `${sidebar.games.length} ${sidebar.games.length === 1 ? 'game' : 'games'}`}
              </span>
            </span>
            <Icon name="chevronsUpDown" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" sideOffset={6} className="user-menu studio-switcher-menu">
              <DropdownMenu.Item asChild>
                <Link to={ROUTES.games} className="user-menu-item">
                  <Icon name="grid" />
                  All games
                </Link>
              </DropdownMenu.Item>
              {sidebar.games.length > 0 ? <DropdownMenu.Separator className="user-menu-separator" /> : null}
              {sidebar.games.map((game) => (
                <DropdownMenu.Item key={game.id} asChild>
                  <Link to={ROUTES.game(game.id)} className="user-menu-item studio-switcher-item">
                    <span className="studio-switcher-item-name">{game.name}</span>
                    <span className="studio-switcher-item-role">{GAME_ROLE_LABELS[game.role]}</span>
                  </Link>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {inGame ? (
          <nav aria-label={sidebar.gameName ? `Pages of ${sidebar.gameName}` : 'Pages of this game'} className="studio-nav">
            <Link to={ROUTES.widget(sidebar.gameId)} className="studio-nav-link">
              <Icon name="pencil" />
              Customize widget
              <span className="studio-nav-trail">
                <Icon name="external" />
              </span>
            </Link>
            <NavLink to={ROUTES.team(sidebar.gameId)} className={navClass}>
              <Icon name="users" />
              Team
            </NavLink>
            {sidebar.isOwner ? (
              <NavLink to={ROUTES.gameKeys(sidebar.gameId)} className={navClass}>
                <Icon name="key" />
                API keys
              </NavLink>
            ) : null}
            <hr className="studio-nav-rule" />
            <Link to={ROUTES.games} className="studio-nav-link">
              <Icon name="arrowLeft" />
              All games
            </Link>
          </nav>
        ) : (
          <nav aria-label="Pages" className="studio-nav">
            <NavLink to={ROUTES.games} end className={navClass}>
              <Icon name="grid" />
              Games
            </NavLink>
            <NavLink to={ROUTES.invitations} className={navClass}>
              <Icon name="mail" />
              Invitations
              {sidebar.pendingInvitations > 0 ? (
                <span className="studio-nav-count" aria-label={`${sidebar.pendingInvitations} waiting`}>
                  {sidebar.pendingInvitations}
                </span>
              ) : null}
            </NavLink>
          </nav>
        )}

        <div className="studio-sidebar-end">
          <nav aria-label="Help" className="studio-nav">
            {DOCS_URL ? (
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="studio-nav-link">
                <Icon name="book" />
                Docs
              </a>
            ) : (
              <Link to={ROUTES.docs} className="studio-nav-link">
                <Icon name="book" />
                Docs
              </Link>
            )}
            <Link to={ROUTES.support} className="studio-nav-link">
              <Icon name="help" />
              Support
            </Link>
          </nav>
          {sidebar.accountName ? (
            <p className="studio-account">
              <span className="studio-account-mark" aria-hidden="true">
                {sidebar.accountName.charAt(0).toUpperCase()}
              </span>
              <span className="studio-account-text">
                <span className="studio-account-name">{sidebar.accountName}</span>
                {sidebar.accountEmail ? <span className="studio-account-email">{sidebar.accountEmail}</span> : null}
              </span>
            </p>
          ) : null}
          <button type="button" className="studio-nav-link" onClick={sidebar.handleLogout}>
            <Icon name="logOut" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
