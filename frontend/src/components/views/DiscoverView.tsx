import { Icon } from '../common/Icon'

interface DiscoverViewProps {
  onCreateCommunity: () => void
}

export function DiscoverView({ onCreateCommunity }: DiscoverViewProps) {
  return (
    <div className="page-scroll">
      <div className="discover-heading">
        <div>
          <span className="eyebrow">COMMUNITY DIRECTORY</span>
          <h1>Discover communities</h1>
          <p>Find communities to join. Available communities will appear here.</p>
        </div>
        <button className="primary-action" onClick={onCreateCommunity}>
          <Icon name="plus" size={15} /> Create community
        </button>
      </div>
      <div className="directory-empty">
        <Icon name="compass" size={24} />
        <strong>No communities to discover yet</strong>
        <span>Community listings will appear here when the directory API is connected.</span>
      </div>
    </div>
  )
}
