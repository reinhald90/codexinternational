interface NotificationsViewProps {
  onOpenChannel?: (channelId: string) => void
  onOpenDm?: (userId: string) => void
}

export function NotificationsView(_props: NotificationsViewProps) {
  return (
    <div className="page-scroll">
      <h1>Activity</h1>
      <p className="page-subtitle">Your notifications will appear here.</p>
      <div className="directory-empty">
        <strong>You're all caught up</strong>
        <span>There are no notifications to show right now.</span>
      </div>
    </div>
  )
}
