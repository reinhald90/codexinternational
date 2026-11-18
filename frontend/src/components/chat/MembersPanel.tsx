import { Icon } from '../common/Icon'
import { Avatar } from '../common/Avatar'
import type { User } from '../../types/chat'

interface MembersPanelProps {
  isDm: boolean
  currentDmUser?: User
  people: User[]
  mobileOpen?: boolean
  onOpenDm: (userId: string) => void
  onInvite: () => void
  onNotify: (message: string) => void
}

export function MembersPanel({
  isDm,
  currentDmUser,
  people,
  mobileOpen = false,
  onOpenDm,
  onInvite,
  onNotify,
}: MembersPanelProps) {
  const onlinePeople = people.filter((person) => person.status === 'online')
  const idlePeople = people.filter((person) => person.status === 'idle')
  const visiblePeople = isDm && currentDmUser ? [currentDmUser] : people

  return (
    <aside className={`members-panel ${mobileOpen ? 'mobile-members-open' : ''}`}>
      <div className="members-heading">
        <div>
          <strong>{isDm ? 'Contact' : 'Members'}</strong>
          <span>{visiblePeople.length}</span>
        </div>
        <button onClick={onInvite} title="Invite">
          <Icon name="plus" size={15} />
        </button>
      </div>

      {isDm && currentDmUser ? (
        <div className="member-section">
          <div className="member-label">CONTACT INFO</div>
          <button className="member" onClick={() => onNotify(`You are viewing ${currentDmUser.name}.`)}>
            <Avatar user={currentDmUser} />
            <span><strong>{currentDmUser.name}</strong><small>{currentDmUser.role ?? 'Member'}</small></span>
          </button>
        </div>
      ) : (
        <>
          {onlinePeople.length > 0 && (
            <div className="member-section">
              <div className="member-label">ONLINE — {onlinePeople.length}</div>
              {onlinePeople.map((person) => (
                <button className="member" key={person.id} onClick={() => onOpenDm(person.id)}>
                  <Avatar user={person} />
                  <span><strong>{person.name}</strong><small>{person.role ?? 'Online'}</small></span>
                </button>
              ))}
            </div>
          )}
          {idlePeople.length > 0 && (
            <div className="member-section">
              <div className="member-label">AWAY — {idlePeople.length}</div>
              {idlePeople.map((person) => (
                <button className="member" key={person.id} onClick={() => onOpenDm(person.id)}>
                  <Avatar user={person} />
                  <span><strong>{person.name}</strong><small>Away</small></span>
                </button>
              ))}
            </div>
          )}
          {people.length === 0 && (
            <div className="directory-empty">
              <Icon name="users" size={22} />
              <strong>No members to show</strong>
              <span>Member information will appear when the community API is connected.</span>
            </div>
          )}
        </>
      )}
      <div className="member-footer"><Icon name="shield" size={14} /> Live community members</div>
    </aside>
  )
}
