import { Icon } from '../common/Icon'

interface SocialAsideProps {
  onFocusComposer: () => void
}

export function SocialAside({ onFocusComposer }: SocialAsideProps) {
  return (
    <aside className="social-right-panel">
      <section className="social-aside-section social-now">
        <span className="social-aside-kicker">YOUR COMMUNITY</span>
        <h2>Start a conversation.</h2>
        <p>Share an update with people in your community.</p>
        <button onClick={onFocusComposer}>
          Write a post <Icon name="arrowUp" size={14} />
        </button>
      </section>
      <section className="social-aside-section">
        <div className="social-aside-heading">
          <strong>Community activity</strong>
        </div>
        <div className="social-empty">
          <strong>No activity yet</strong>
          <p>Posts and community trends will appear here when live data is available.</p>
        </div>
      </section>
    </aside>
  )
}
