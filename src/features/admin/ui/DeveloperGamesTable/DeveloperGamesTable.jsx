import { formatDateTime } from '@/shared/utils';

import { REASON_LABELS } from '../../config/adminConfig';
import { StatusPill } from '../StatusPill';
import { StatusSwitch } from '../StatusSwitch';

/**
 * Every game the developer owns, newest first, with its own status. A game of a suspended developer
 * can show Active here: it is only served when both it and its developer are active.
 */
export function DeveloperGamesTable({ games, onSuspendGame, onResumeGame }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="visually-hidden">Games owned by this developer, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Game</th>
            <th scope="col">Status</th>
            <th scope="col">Reason</th>
            <th scope="col">Created</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              <th scope="row">
                <span className="item-title">{game.name}</span>
                {game.description ? <span className="data-table-sub">{game.description}</span> : null}
              </th>
              <td>
                <StatusPill status={game.status} />
              </td>
              <td>{game.isSuspended && game.statusReason ? (REASON_LABELS[game.statusReason] ?? game.statusReason) : '—'}</td>
              <td>{formatDateTime(game.createdAt)}</td>
              <td className="data-table-number">
                <StatusSwitch
                  isSuspended={game.isSuspended}
                  subjectName={game.name}
                  onSuspend={() => onSuspendGame(game)}
                  onResume={() => onResumeGame(game)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
