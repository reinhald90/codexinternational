import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import '../App.css'
import '../Redesign.css'
import '../styles/adaptive.css'

import type { AuthSession } from '../api/client'
import type { ViewportInfo } from '../hooks/useViewport'
import type { Attachment, View } from '../types/common'
import type { Channel, Data, Message, Server } from '../types/chat'
import type { SocialPost, SocialTab } from '../types/social'

import { people, roomKey } from '../constants/seedData'
import {
  clearDemoStorage,
  loadData,
  loadFollowedHandles,
  loadSocialPosts,
  saveData,
  saveFollowedHandles,
  saveSocialPosts,
} from '../utils/storage'

import { Toast } from '../components/common/Toast'
import { ServerRail } from '../components/layout/ServerRail'
import { ChannelSidebar } from '../components/layout/ChannelSidebar'
import { Topbar } from '../components/layout/Topbar'
import { SearchStrip } from '../components/layout/SearchStrip'
import { MobileTabs, type MobileTab } from '../components/layout/MobileTabs'
import { ActionModal, type ActionModalType } from '../components/modals/ActionModal'
import { CallModal } from '../components/modals/CallModal'

import { ChatPanel } from '../components/chat/ChatPanel'
import { MembersPanel } from '../components/chat/MembersPanel'
import { SocialFeed } from '../components/social/SocialFeed'
import { SocialAside } from '../components/social/SocialAside'
import { ChannelDirectory } from '../components/directories/ChannelDirectory'
import { PeopleDirectory } from '../components/directories/PeopleDirectory'
import { DiscoverView } from '../components/views/DiscoverView'
import { SettingsView } from '../components/views/SettingsView'
import { NotificationsView } from '../components/views/NotificationsView'
import { PinnedView } from '../components/views/PinnedView'
import { BotsView } from '../components/views/BotsView'

interface WorkspacePageProps {
  session: AuthSession
  viewport: ViewportInfo
  onLogout: () => Promise<void>
}

export function WorkspacePage({ session, viewport, onLogout }: WorkspacePageProps) {
  const { isMobile, isDesktop } = viewport
  const [data, setData] = useState<Data>(() => {
    const initial = loadData()
    return {
      ...initial,
      displayName: session.user.display_name || session.user.username || initial.displayName,
    }
  })
  const [view, setView] = useState<View>('channel')
  const [serverId, setServerId] = useState('studio')
  const [channelId, setChannelId] = useState('general')
  const [dmId, setDmId] = useState('mika')
  const [membersOpen, setMembersOpen] = useState(isDesktop)
  const [channelSidebarOpen, setChannelSidebarOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat')
  const [composer, setComposer] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ActionModalType | 'call' | null>(null)
  const [modalValue, setModalValue] = useState('')
  const [toast, setToast] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [deafened, setDeafened] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [profileMenu, setProfileMenu] = useState(false)
  const [notificationRead, setNotificationRead] = useState(false)
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(loadSocialPosts)
  const [socialDraft, setSocialDraft] = useState('')
  const [socialTab, setSocialTab] = useState<SocialTab>('for-you')
  const [followedHandles, setFollowedHandles] = useState<string[]>(loadFollowedHandles)

  const messageInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const socialInputRef = useRef<HTMLTextAreaElement>(null)

  const notify = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast((curr) => (curr === text ? '' : curr)), 2600)
  }, [])

  useEffect(() => {
    const ok = saveData(data)
    if (!ok) {
      window.setTimeout(
        () => setToast('Browser storage is full. Remove large attachments to continue saving.'),
        0,
      )
    }
  }, [data])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [view, serverId, channelId, dmId])

  useEffect(() => {
    const ok = saveSocialPosts(socialPosts)
    if (!ok) {
      window.setTimeout(
        () => notify('Social timeline is full. Remove large media to continue saving.'),
        0,
      )
    }
  }, [socialPosts, notify])

  useEffect(() => {
    saveFollowedHandles(followedHandles)
  }, [followedHandles])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setModal(null)
        setDrawerOpen(false)
        setSearchOpen(false)
        setProfileMenu(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const server = data.servers.find((s) => s.id === serverId) ?? data.servers[0]
  const channels = useMemo(
    () => data.channels[server?.id ?? ''] ?? [],
    [data.channels, server?.id],
  )
  const channel = channels.find((c) => c.id === channelId && c.type === 'text') ?? channels[0]
  const currentDm = people.find((p) => p.id === dmId) ?? people[0]
  const key = view === 'dm' ? `dm:${dmId}` : roomKey(server?.id ?? 'studio', channel?.id ?? 'general')
  const currentMessages = useMemo(() => {
    const allMessages = view === 'dm' ? (data.dmMessages[dmId] ?? []) : (data.messages[key] ?? [])
    const query = search.trim().toLowerCase()
    return allMessages.filter(
      (m) => !query || `${m.text} ${m.author}`.toLowerCase().includes(query),
    )
  }, [data.dmMessages, data.messages, dmId, key, search, view])

  const pinnedMessages = useMemo(
    () =>
      Object.entries(data.pins).flatMap(([scope, ids]) => {
        const list = scope.startsWith('dm:')
          ? (data.dmMessages[scope.slice(3)] ?? [])
          : (data.messages[scope] ?? [])
        return ids
          .map((id) => list.find((m) => m.id === id))
          .filter((m): m is Message => Boolean(m))
          .map((message) => ({ scope, message }))
      }),
    [data.pins, data.dmMessages, data.messages],
  )

  const title =
    view === 'channel'
      ? channel?.name ?? 'general'
      : view === 'dm'
        ? currentDm?.name ?? 'Direct messages'
        : view === 'social'
          ? 'Social feed'
          : view === 'bots'
            ? 'Bot Portal'
            : view === 'channels'
              ? 'Channels'
              : view === 'people'
                ? 'People'
                : view === 'discover'
                  ? 'Discover communities'
                  : view === 'notifications'
                    ? 'Activity'
                    : view === 'pinned'
                      ? 'Pinned messages'
                      : 'Settings'

  const initials = data.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ME'

  const sendMessage = (e?: FormEvent) => {
    e?.preventDefault()
    const clean = composer.trim()
    if (!clean && !attachment) return

    if (editingId) {
      setData((prev) => {
        const list = view === 'dm' ? (prev.dmMessages[dmId] ?? []) : (prev.messages[key] ?? [])
        const nextList = list.map((m) =>
          m.id === editingId ? { ...m, text: clean, edited: true } : m,
        )
        return view === 'dm'
          ? { ...prev, dmMessages: { ...prev.dmMessages, [dmId]: nextList } }
          : { ...prev, messages: { ...prev.messages, [key]: nextList } }
      })
      setEditingId(null)
      setComposer('')
      return
    }

    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const nextMessage: Message = {
      id: `m${Date.now()}`,
      authorId: 'self',
      author: data.displayName,
      initials,
      tone: 'self',
      time,
      text: clean || `Shared ${attachment?.name ?? 'attachment'}`,
      reactions: {},
      replyTo: replyTo?.id,
      attachment: attachment ?? undefined,
    }

    setData((prev) => {
      if (view === 'dm') {
        const existing = prev.conversations.some((c) => c.userId === dmId)
        const nextConvs = existing
          ? prev.conversations.map((c) =>
              c.userId === dmId ? { ...c, lastMessage: nextMessage.text, unread: 0 } : c,
            )
          : [...prev.conversations, { id: `c${dmId}`, userId: dmId, lastMessage: nextMessage.text, unread: 0 }]
        return {
          ...prev,
          conversations: nextConvs,
          dmMessages: { ...prev.dmMessages, [dmId]: [...(prev.dmMessages[dmId] ?? []), nextMessage] },
        }
      }
      return {
        ...prev,
        messages: { ...prev.messages, [key]: [...(prev.messages[key] ?? []), nextMessage] },
      }
    })

    setComposer('')
    setReplyTo(null)
    setAttachment(null)
  }

  const pickServer = (id: string) => {
    setServerId(id)
    const first = (data.channels[id] ?? []).find((c) => c.type === 'text') ?? data.channels[id]?.[0]
    if (first) setChannelId(first.id)
    setView('channel')
    setMobileTab('chat')
    setDrawerOpen(false)
  }

  const pickChannel = (c: Channel) => {
    if (c.type === 'voice') {
      setVoiceId(c.id)
      notify(`Connected to ${c.name} voice preview`)
      setDrawerOpen(false)
      return
    }
    setChannelId(c.id)
    setView('channel')
    setMobileTab('chat')
    setDrawerOpen(false)
  }

  const openDm = (uid: string) => {
    setDmId(uid)
    setView('dm')
    setMobileTab('chat')
    setDrawerOpen(false)
    setData((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) => (c.userId === uid ? { ...c, unread: 0 } : c)),
    }))
  }

  const navigateView = (nextView: View) => {
    setView(nextView)
    if (nextView === 'social') setMobileTab('social')
    else if (nextView === 'channels') setMobileTab('channels')
    else if (nextView === 'people') setMobileTab('people')
    else if (nextView === 'bots') setMobileTab('bots')
    setDrawerOpen(false)
  }

  const showMembersPanel = (view === 'channel' || view === 'dm') && membersOpen

  return (
    <div
      className={`app-shell theme-${data.theme} ${isMobile ? 'viewport-mobile' : 'viewport-desktop'} ${
        drawerOpen ? 'drawer-open' : ''
      } ${!channelSidebarOpen ? 'channels-hidden' : ''} view-${view}`}
    >
      <button
        className="drawer-scrim"
        aria-label="Close navigation"
        onClick={() => setDrawerOpen(false)}
      />

      <ServerRail
        servers={data.servers}
        activeServerId={serverId}
        activeView={view}
        onSelectHome={() => {
          setView('channel')
          setMobileTab('chat')
        }}
        onSelectServer={pickServer}
        onCreateServer={() => {
          setModal('server')
          setModalValue('')
        }}
        onNavigateView={navigateView}
      />

      <ChannelSidebar
        view={view}
        server={server}
        channels={channels}
        channelId={channel?.id ?? ''}
        dmId={dmId}
        conversations={data.conversations}
        people={people}
        displayName={data.displayName}
        theme={data.theme}
        socialTab={socialTab}
        voiceId={voiceId}
        muted={muted}
        deafened={deafened}
        profileMenuOpen={profileMenu}
        onToggleProfileMenu={() => setProfileMenu((v) => !v)}
        onSelectSocialTab={setSocialTab}
        onOpenQuickSearch={() => setSearchOpen(true)}
        onSelectChannel={pickChannel}
        onOpenDm={openDm}
        onCreateChannelModal={() => {
          setModal('channel')
          setModalValue('')
        }}
        onNewDmModal={() => {
          setModal('dm')
          setModalValue(people[0]?.id ?? 'mika')
        }}
        onVoiceChannelNotice={() => notify('Select any voice channel below to preview audio.')}
        onToggleMute={() => setMuted((v) => !v)}
        onToggleDeafen={() => setDeafened((v) => !v)}
        onDisconnectVoice={() => setVoiceId(null)}
        onNavigateSettings={() => navigateView('settings')}
        onToggleTheme={() =>
          setData((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))
        }
        onOpenBots={() => navigateView('bots')}
        onLogout={() => void onLogout()}
      />

      <main className="workspace">
        <Topbar
          view={view}
          title={title}
          channel={channel}
          isMobile={isMobile}
          membersOpen={membersOpen}
          searchOpen={searchOpen}
          notificationRead={notificationRead}
          unreadCount={data.conversations.reduce((acc, c) => acc + c.unread, 0)}
          onOpenDrawer={() => setDrawerOpen(true)}
          onToggleSidebar={() => setChannelSidebarOpen((v) => !v)}
          onFocusSocialComposer={() => socialInputRef.current?.focus()}
          onVoiceCallModal={() => setModal('call')}
          onVideoCallModal={() => setModal('call')}
          onOpenPinned={() => navigateView('pinned')}
          onToggleMembers={() => setMembersOpen((v) => !v)}
          onToggleSearch={() => setSearchOpen((v) => !v)}
          onOpenNotifications={() => {
            setNotificationRead(true)
            navigateView('notifications')
          }}
          onOpenInbox={() => navigateView('dm')}
          onOpenSettings={() => navigateView('settings')}
        />

        {searchOpen && (
          <SearchStrip
            inputRef={searchInputRef}
            value={search}
            onChange={setSearch}
            onClose={() => {
              setSearchOpen(false)
              setSearch('')
            }}
          />
        )}

        <div className="workspace-body">
          <section className="chat-panel">
            {view === 'social' ? (
              <SocialFeed
                posts={socialPosts}
                socialTab={socialTab}
                followedHandles={followedHandles}
                composerRef={socialInputRef}
                draft={socialDraft}
                onDraftChange={setSocialDraft}
                onPublish={(e) => {
                  e.preventDefault()
                  const text = socialDraft.trim()
                  if (!text) return
                  setSocialPosts((prev) => [
                    {
                      id: `p${Date.now()}`,
                      author: data.displayName,
                      handle: session.user.username,
                      initials,
                      tone: 'self',
                      time: 'Just now',
                      createdAt: Date.now(),
                      text,
                      likes: 0,
                      reposts: 0,
                      replies: [],
                      liked: false,
                      reposted: false,
                      saved: false,
                    },
                    ...prev,
                  ])
                  setSocialDraft('')
                }}
                onTabChange={setSocialTab}
                onToggleFollow={(handle) =>
                  setFollowedHandles((prev) =>
                    prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle],
                  )
                }
                onToggleAction={(id, action) =>
                  setSocialPosts((prev) =>
                    prev.map((p) => {
                      if (p.id !== id) return p
                      if (action === 'liked') {
                        return { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
                      }
                      if (action === 'reposted') {
                        return { ...p, reposted: !p.reposted, reposts: p.reposts + (p.reposted ? -1 : 1) }
                      }
                      return { ...p, saved: !p.saved }
                    }),
                  )
                }
                onSubmitReply={(_e, postId, text) => {
                  setSocialPosts((prev) =>
                    prev.map((p) =>
                      p.id === postId
                        ? {
                            ...p,
                            replies: [
                              ...p.replies,
                              {
                                id: `r${Date.now()}`,
                                author: data.displayName,
                                handle: session.user.username,
                                text,
                                time: 'Just now',
                              },
                            ],
                          }
                        : p,
                    ),
                  )
                }}
                onShare={(postId) => {
                  const found = socialPosts.find((p) => p.id === postId)
                  if (found) {
                    void navigator.clipboard?.writeText(found.text)
                    notify('Post text copied')
                  }
                }}
              />
            ) : view === 'bots' ? (
              <BotsView currentUser={session.user} isMobile={isMobile} onNotify={notify} />
            ) : view === 'channels' ? (
              <ChannelDirectory
                servers={data.servers}
                channels={data.channels}
                onSelectChannel={(ch, srvId) => {
                  setServerId(srvId)
                  pickChannel(ch)
                }}
                onCreateChannel={(srvId) => {
                  if (srvId) setServerId(srvId)
                  setModal('channel')
                  setModalValue('')
                }}
              />
            ) : view === 'people' ? (
              <PeopleDirectory
                people={people}
                onOpenDm={openDm}
                onInvite={() => {
                  setModal('invite')
                  setModalValue('')
                }}
              />
            ) : view === 'settings' ? (
              <SettingsView
                authUser={session.user}
                displayName={data.displayName}
                theme={data.theme}
                onDisplayNameChange={(name) => setData((prev) => ({ ...prev, displayName: name }))}
                onToggleTheme={() =>
                  setData((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))
                }
                onOpenBots={() => navigateView('bots')}
                onLogout={() => void onLogout()}
                onResetData={() => {
                  clearDemoStorage()
                  setData({
                    ...loadData(),
                    displayName: session.user.display_name || session.user.username,
                  })
                  notify('Local preview cache cleared')
                }}
              />
            ) : view === 'discover' ? (
              <DiscoverView
                onCreateCommunity={() => {
                  setModal('server')
                  setModalValue('')
                }}
                onJoinCommunity={(s) => {
                  if (!data.servers.some((x) => x.id === s.id)) {
                    setData((prev) => ({
                      ...prev,
                      servers: [...prev.servers, s],
                      channels: { ...prev.channels, [s.id]: [{ id: 'general', name: 'general', type: 'text' }] },
                    }))
                  }
                  pickServer(s.id)
                  notify(`Joined ${s.name}`)
                }}
              />
            ) : view === 'notifications' ? (
              <NotificationsView
                onOpenChannel={(cid) => {
                  setView('channel')
                  setChannelId(cid)
                }}
                onOpenDm={openDm}
              />
            ) : view === 'pinned' ? (
              <PinnedView
                pinnedMessages={pinnedMessages}
                onOpenConversation={(scope) => {
                  if (scope.startsWith('dm:')) {
                    openDm(scope.slice(3))
                  } else {
                    const [srv, ch] = scope.split(':')
                    if (srv && ch) {
                      setServerId(srv)
                      setChannelId(ch)
                      setView('channel')
                    }
                  }
                }}
              />
            ) : (
              <ChatPanel
                isDm={view === 'dm'}
                currentDm={currentDm}
                channel={channel}
                server={server}
                feedRef={feedRef}
                messageInputRef={messageInputRef}
                messages={currentMessages}
                pinnedMessageIds={data.pins[key] ?? []}
                composerText={composer}
                replyTo={replyTo}
                editingId={editingId}
                attachment={attachment}
                onComposerTextChange={setComposer}
                onSendMessage={sendMessage}
                onCancelReply={() => setReplyTo(null)}
                onCancelEdit={() => {
                  setEditingId(null)
                  setComposer('')
                }}
                onAttachmentSelect={(file) => {
                  if (!file) return
                  setAttachment({ name: file.name, type: file.type, url: URL.createObjectURL(file) })
                }}
                onRemoveAttachment={() => setAttachment(null)}
                onAddEmoji={(emoji) => setComposer((v) => `${v} ${emoji}`)}
                onReact={(id, emoji) => {
                  setData((prev) => {
                    const list = view === 'dm' ? (prev.dmMessages[dmId] ?? []) : (prev.messages[key] ?? [])
                    const nextList = list.map((m) => {
                      if (m.id !== id) return m
                      const users = m.reactions[emoji] ?? []
                      const nextUsers = users.includes('self')
                        ? users.filter((u) => u !== 'self')
                        : [...users, 'self']
                      const nextReactions = { ...m.reactions, [emoji]: nextUsers }
                      if (nextUsers.length === 0) delete nextReactions[emoji]
                      return { ...m, reactions: nextReactions }
                    })
                    return view === 'dm'
                      ? { ...prev, dmMessages: { ...prev.dmMessages, [dmId]: nextList } }
                      : { ...prev, messages: { ...prev.messages, [key]: nextList } }
                  })
                }}
                onReply={setReplyTo}
                onEdit={(m) => {
                  setEditingId(m.id)
                  setComposer(m.text)
                  messageInputRef.current?.focus()
                }}
                onRemove={(m) => {
                  setData((prev) => {
                    const list = view === 'dm' ? (prev.dmMessages[dmId] ?? []) : (prev.messages[key] ?? [])
                    const nextList = list.filter((x) => x.id !== m.id)
                    return view === 'dm'
                      ? { ...prev, dmMessages: { ...prev.dmMessages, [dmId]: nextList } }
                      : { ...prev, messages: { ...prev.messages, [key]: nextList } }
                  })
                }}
                onTogglePin={(m) => {
                  setData((prev) => {
                    const current = prev.pins[key] ?? []
                    const next = current.includes(m.id)
                      ? current.filter((x) => x !== m.id)
                      : [...current, m.id]
                    return { ...prev, pins: { ...prev.pins, [key]: next } }
                  })
                }}
                onOpenPinnedView={() => navigateView('pinned')}
                onInvite={() => setModal('invite')}
                onNotify={notify}
              />
            )}
          </section>

          {!isMobile && view === 'social' && (
            <SocialAside
              followedHandles={followedHandles}
              onFocusComposer={() => socialInputRef.current?.focus()}
              onToggleFollow={(handle) =>
                setFollowedHandles((prev) =>
                  prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle],
                )
              }
              onSelectTopic={(topic) => {
                setSocialDraft((d) => (d ? `${d} ${topic}` : topic))
                socialInputRef.current?.focus()
              }}
            />
          )}

          {showMembersPanel && (
            <MembersPanel
              isDm={view === 'dm'}
              currentDmUser={currentDm}
              people={people}
              mobileOpen={isMobile && membersOpen}
              onOpenDm={openDm}
              onInvite={() => setModal('invite')}
              onNotify={notify}
            />
          )}
        </div>

        {isMobile && (
          <MobileTabs
            activeTab={mobileTab}
            onSelectTab={(tab) => {
              setMobileTab(tab)
              if (tab === 'chat') setView('channel')
              if (tab === 'social') {
                setView('social')
                setSocialTab('for-you')
              }
              if (tab === 'channels') setView('channels')
              if (tab === 'people') setView('people')
              if (tab === 'bots') setView('bots')
              setDrawerOpen(false)
            }}
          />
        )}
      </main>

      {modal === 'call' && (
        <CallModal
          muted={muted}
          cameraOn={cameraOn}
          screenSharing={screenSharing}
          onToggleMute={() => setMuted((v) => !v)}
          onToggleCamera={() => setCameraOn((v) => !v)}
          onToggleScreenShare={() => setScreenSharing((v) => !v)}
          onClose={() => {
            setMuted(false)
            setCameraOn(false)
            setScreenSharing(false)
            setModal(null)
          }}
        />
      )}

      {modal && modal !== 'call' && (
        <ActionModal
          type={modal}
          value={modalValue}
          people={people}
          onChangeValue={setModalValue}
          onSubmit={(e) => {
            e.preventDefault()
            if (modal === 'invite') {
              notify('Invite links will be available when the invite API is connected.')
              setModal(null)
              return
            }
            if (modal === 'dm') {
              if (modalValue) openDm(modalValue)
              setModal(null)
              return
            }
            const trimmed = modalValue.trim()
            if (!trimmed) return
            if (modal === 'server') {
              const id = `srv-${Date.now()}`
              const newServer: Server = {
                id,
                name: trimmed,
                abbr: trimmed.slice(0, 2).toUpperCase(),
                tone: 'blue',
              }
              setData((prev) => ({
                ...prev,
                servers: [...prev.servers, newServer],
                channels: { ...prev.channels, [id]: [{ id: 'general', name: 'general', type: 'text' }] },
              }))
              pickServer(id)
            } else {
              const id = trimmed.toLowerCase().replace(/\s+/g, '-')
              setData((prev) => ({
                ...prev,
                channels: {
                  ...prev.channels,
                  [serverId]: [...(prev.channels[serverId] ?? []), { id, name: id, type: 'text' }],
                },
              }))
              setChannelId(id)
              setView('channel')
            }
            setModal(null)
            setModalValue('')
          }}
          onClose={() => {
            setModal(null)
            setModalValue('')
          }}
        />
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
