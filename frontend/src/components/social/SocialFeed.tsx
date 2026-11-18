import { type FormEvent, type RefObject, useState } from 'react'
import { SocialComposer } from './SocialComposer'
import { SocialPostCard } from './SocialPostCard'
import type { SocialPost, SocialTab } from '../../types/social'

const tabs: { id: SocialTab; label: string }[] = [
  { id: 'for-you', label: 'For you' },
  { id: 'following', label: 'Following' },
  { id: 'latest', label: 'Latest' },
  { id: 'saved', label: 'Saved' },
]

interface SocialFeedProps {
  posts: SocialPost[]
  socialTab: SocialTab
  followedHandles: string[]
  composerRef: RefObject<HTMLTextAreaElement | null>
  draft: string
  onDraftChange: (value: string) => void
  onPublish: (e: FormEvent) => void
  onTabChange: (tab: SocialTab) => void
  onToggleFollow: (handle: string) => void
  onToggleAction: (id: string, action: 'liked' | 'reposted' | 'saved') => void
  onSubmitReply: (e: FormEvent, id: string, text: string) => void
  onShare: (id: string) => void
}

export function SocialFeed({
  posts,
  socialTab,
  followedHandles,
  composerRef,
  draft,
  onDraftChange,
  onPublish,
  onTabChange,
  onToggleFollow,
  onToggleAction,
  onSubmitReply,
  onShare,
}: SocialFeedProps) {
  const [replyForId, setReplyForId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const handleToggleReplyForm = (id: string) => {
    setReplyForId((current) => (current === id ? null : id))
    setReplyDraft('')
  }

  const handleSubmitReply = (e: FormEvent, id: string) => {
    e.preventDefault()
    if (!replyDraft.trim()) return
    onSubmitReply(e, id, replyDraft.trim())
    setReplyDraft('')
    setReplyForId(null)
  }

  return (
    <div className="social-layout">
      <div className="social-feed-column">
        <div className="social-heading">
          <div>
            <span className="social-kicker">A PUBLIC SQUARE FOR YOUR COMMUNITY</span>
            <h1>
              Threads <em>&amp;</em> X
            </h1>
            <p>Quick thoughts, shared interests, and conversations that keep going.</p>
          </div>
          <span className="social-state">
            COMMUNITY FEED <i />
          </span>
        </div>

        <SocialComposer
          inputRef={composerRef}
          draft={draft}
          onChange={onDraftChange}
          onSubmit={onPublish}
        />

        <div className="social-feed-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={socialTab === tab.id ? 'active' : ''}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="social-post-list">
          {posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              isFollowed={followedHandles.includes(post.handle)}
              isReplying={replyForId === post.id}
              replyDraft={replyDraft}
              onToggleFollow={onToggleFollow}
              onToggleAction={onToggleAction}
              onToggleReplyForm={handleToggleReplyForm}
              onReplyDraftChange={setReplyDraft}
              onSubmitReply={handleSubmitReply}
              onShare={onShare}
            />
          ))}

          {posts.length === 0 && (
            <div className="social-empty">
              <span>◎</span>
              <strong>
                {socialTab === 'following'
                  ? 'Your Following feed is quiet.'
                  : socialTab === 'saved'
                    ? 'No saved posts yet.'
                    : 'Nothing here yet.'}
              </strong>
              <p>
                {socialTab === 'following'
                  ? 'Follow a few people to bring their conversations into this feed.'
                  : 'Save posts you want to come back to.'}
              </p>
              <button onClick={() => onTabChange('for-you')}>Explore the timeline</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
