import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { formatDateTime } from '@/shared/utils';

import { StatusPill } from '../StatusPill';

/** One row per developer. The name (or email) links to the developer's page. */
export function DevelopersTable({ developers, isBusy = false }) {
  return (
    <div className="table-scroll">
      <table className="data-table" aria-busy={isBusy}>
        <caption className="visually-hidden">Developers, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Developer</th>
            <th scope="col">Status</th>
            <th scope="col" className="data-table-number">
              Games
            </th>
            <th scope="col">Created</th>
          </tr>
        </thead>
        <tbody>
          {developers.map((developer) => (
            <tr key={developer.id}>
              <th scope="row">
                <Link to={ROUTES.admin.developer(developer.id)} className="item-title">
                  {developer.name || developer.email}
                </Link>
                {developer.name ? <span className="data-table-sub">{developer.email}</span> : null}
              </th>
              <td>
                <StatusPill status={developer.status} />
              </td>
              <td className="data-table-number">{developer.gameCount}</td>
              <td>{formatDateTime(developer.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
