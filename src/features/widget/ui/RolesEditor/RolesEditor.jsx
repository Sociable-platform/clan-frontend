import { useState } from 'react';

import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';
import { SwitchField } from '@/shared/ui/SwitchField';
import { TextField } from '@/shared/ui/TextField';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { ROLE_MESSAGES } from '../../config/widgetRoles';
import { addRole, handlesRequests, moveRole, removeRole, reorderRole, roleNameProblem, setRolePower } from '../../utils/widgetRoles';

/** What a role may do, in a few words for its row. */
function powersOf(role, isOwner) {
  if (isOwner) return ['Every power'];
  return [role.canPromote ? 'Promote' : null, role.canKick ? 'Kick' : null, handlesRequests(role) ? 'Accept requests' : null].filter(Boolean);
}

/**
 * The selected role: its title, whether it may kick or promote the roles below it and answer join requests, and
 * ways to move or remove it without dragging (for keyboards and touch screens).
 */
function RoleDetail({ bind, roles, index, onChangeRoles, onRemoved }) {
  const role = roles[index];
  const isOwner = index === roles.length - 1;
  const isLowest = index === 0;
  const isMiddle = !isOwner && !isLowest;
  const name = bind(`/clan/roles/${index}/name`);
  const canPromote = bind(`/clan/roles/${index}/canPromote`);
  const canKick = bind(`/clan/roles/${index}/canKick`);
  const canHandleRequests = bind(`/clan/roles/${index}/canHandleRequests`);
  // Any role but the owner's may answer join requests, the lowest one too: an answer acts on nobody below it.
  const requestsSwitch = (
    <SwitchField
      label="Can accept join requests"
      description="Accept or decline players who ask to join a closed clan"
      checked={handlesRequests(role)}
      onCheckedChange={(value) => onChangeRoles(setRolePower(roles, index, 'canHandleRequests', value))}
      error={canHandleRequests.error}
    />
  );

  return (
    <section className="role-detail" aria-label={`Edit ${role.name}`}>
      <TextField
        label="Title"
        value={name.value ?? ''}
        maxLength={WIDGET_LIMITS.ROLE_NAME_MAX}
        autoComplete="off"
        error={name.error}
        onChange={(event) => name.onValueChange(event.target.value)}
      />
      {isOwner ? <p className="form-group-description">{ROLE_MESSAGES.OWNER_NOTE}</p> : null}
      {isLowest ? (
        <>
          <p className="form-group-description">{ROLE_MESSAGES.LOWEST_NOTE}</p>
          {requestsSwitch}
        </>
      ) : null}
      {isMiddle ? (
        <>
          <SwitchField
            label="Can kick roles below it"
            description="Remove members whose role is lower"
            checked={role.canKick === true}
            onCheckedChange={(value) => onChangeRoles(setRolePower(roles, index, 'canKick', value))}
            error={canKick.error}
          />
          <SwitchField
            label="Can promote and demote roles below it"
            description="Promote one step up, never to its own role. Demote one step down"
            checked={role.canPromote === true}
            onCheckedChange={(value) => onChangeRoles(setRolePower(roles, index, 'canPromote', value))}
            error={canPromote.error}
          />
          {requestsSwitch}
          <div className="role-detail-actions">
            <button type="button" className="button button-secondary" onClick={() => onChangeRoles(moveRole(roles, index, 1))}>
              Move up
            </button>
            <button type="button" className="button button-secondary" onClick={() => onChangeRoles(moveRole(roles, index, -1))}>
              Move down
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                onChangeRoles(removeRole(roles, index));
                onRemoved();
              }}
            >
              Remove role
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

/**
 * The titles a clan member can hold, as a list with the strongest first. Drag a role to change its power
 * (the owner role stays on top and the lowest role at the bottom), click one to edit it: its title and
 * whether it may kick or promote the roles below it. A role can only act on roles lower in the list.
 */
export function RolesEditor({ bind }) {
  const roles = bind('/clan/roles');
  const list = roles.value ?? [];
  const [selectedId, setSelectedId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [newName, setNewName] = useState('');
  const [problem, setProblem] = useState(null);

  const selectedIndex = list.findIndex((role) => role.id === selectedId);
  const isFull = list.length >= WIDGET_LIMITS.ROLES.MAX;
  const lastIndex = list.length - 1;
  const strongestFirst = list.map((_, index) => index).reverse();
  const isMovable = (index) => index > 0 && index < lastIndex;

  const handleDrop = (event, targetIndex) => {
    event.preventDefault();
    if (dragIndex !== null) roles.onValueChange(reorderRole(list, dragIndex, targetIndex));
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleAdd = (event) => {
    event.preventDefault();
    const found = roleNameProblem(newName);
    setProblem(found);
    if (found) return;
    const next = addRole(list, newName);
    roles.onValueChange(next);
    setSelectedId(next[next.length - 2].id);
    setNewName('');
  };

  return (
    <FormGroup
      title="Roles"
      aside={`${list.length} of ${WIDGET_LIMITS.ROLES.MAX}`}
      description="The titles a clan member can hold. Drag to order them, strongest on top: a member can act only on roles below their own."
    >
      <ol className="role-list" aria-label="Clan roles, strongest first">
        {strongestFirst.map((index) => {
          const role = list[index];
          const isOwner = index === lastIndex;
          const powers = powersOf(role, isOwner);
          const hasError = [`name`, `canPromote`, `canKick`, `canHandleRequests`].some((field) => bind(`/clan/roles/${index}/${field}`).error);
          const classes = ['role-item', role.id === selectedId && 'role-item-selected', dragIndex === index && 'role-item-dragging', dragIndex !== null && overIndex === index && dragIndex !== index && 'role-item-over']
            .filter(Boolean)
            .join(' ');

          return (
            <li
              key={role.id}
              className={classes}
              draggable={isMovable(index)}
              onDragStart={(event) => {
                event.dataTransfer?.setData('text/plain', role.id);
                if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
                setDragIndex(index);
              }}
              onDragOver={(event) => {
                if (dragIndex === null) return;
                event.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
            >
              <span aria-hidden="true" className="role-item-handle" data-movable={isMovable(index)}>
                {isMovable(index) ? '⋮⋮' : ''}
              </span>
              <button type="button" className="role-item-main" aria-pressed={role.id === selectedId} onClick={() => setSelectedId(role.id === selectedId ? null : role.id)}>
                <span className="role-item-name">{role.name}</span>{' '}
                <span className="role-item-powers">{powers.length > 0 ? powers.join(' · ') : 'No powers'}</span>
                {hasError ? (
                  <>
                    {' '}
                    <span className="role-item-error">Needs attention</span>
                  </>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      {selectedIndex >= 0 ? (
        <RoleDetail bind={bind} roles={list} index={selectedIndex} onChangeRoles={roles.onValueChange} onRemoved={() => setSelectedId(null)} />
      ) : (
        <p className="form-group-description">Click a role to edit its title and what it may do.</p>
      )}

      <form className="role-add" onSubmit={handleAdd}>
        <TextField
          label="New role title"
          className="role-add-title"
          value={newName}
          maxLength={WIDGET_LIMITS.ROLE_NAME_MAX}
          autoComplete="off"
          error={problem}
          onChange={(event) => setNewName(event.target.value)}
        />
        <button type="submit" className="button button-secondary" disabled={isFull}>
          Add role
        </button>
      </form>
      <p className="form-group-description">
        {isFull ? ROLE_MESSAGES.TOO_MANY(WIDGET_LIMITS.ROLES.MAX) : `New roles go just below the owner role. ${ROLE_MESSAGES.REMOVE_NOTE}`}
      </p>
      <FieldError id="roles-error">{roles.error}</FieldError>
    </FormGroup>
  );
}
