import { useState, type FormEvent, type RefObject } from 'react'
import { Icon } from '../common/Icon'
import { MessageItem } from './MessageItem'
import { Composer } from './Composer'
import type { Attachment, Channel, Message, Server, User } from '../../types/chat'

interface ChatPanelProps {
  isDm: boolean
  currentDm?: User
  channel?: Channel
  server?: Server
  feedRef: RefObject<HTMLDivElement | null>
  messageInputRef: RefObject<HTMLInputElement | null>
  messages: Message[]
  pinnedMessageIds: string[]
  composerText: string
  replyTo: Message | null
  editingId: string | null
  attachment: Attachment | null
  onComposerTextChange: (value: string) => void
  onSendMessage: (e?: FormEvent) => void
  onCancelReply: () => void
  onCancelEdit: () => void
  onAttachmentSelect: (file?: File) => void
  onRemoveAttachment: () => void
  onAddEmoji: (emoji: string) => void
  onReact: (messageId: string, emoji: string) => void
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
  onRemove: (message: Message) => void
  onTogglePin: (message: Message) => void
  onOpenPinnedView: () => void
  onInvite: () => void
  onNotify: (text: string) => void
}

export function ChatPanel({
  isDm,
  currentDm,
  channel,
  server,
  feedRef,
  messageInputRef,
  messages,
  pinnedMessageIds,
  composerText,
  replyTo,
  editingId,
  attachment,
  onComposerTextChange,
  onSendMessage,
  onCancelReply,
  onCancelEdit,
  onAttachmentSelect,
  onRemoveAttachment,
  onAddEmoji,
  onReact,
  onReply,
  onEdit,
  onRemove,
  onTogglePin,
  onOpenPinnedView,
  onInvite,
  onNotify,
}: ChatPanelProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  if ((!isDm && !server) || (isDm && !currentDm)) {
    return (
      <div className="directory-empty">
        <Icon name="message" size={26} />
        <strong>No conversation selected</strong>
        <span>Join a community or open a conversation to get started.</span>
      </div>
    )
  }

  const handleStartReply = (message: Message) => {
    onReply(message)
    setActiveMenuId(null)
  }

  const placeholder = isDm
    ? `Message ${currentDm?.name ?? ''}`
    : `Message #${channel?.name ?? ''}`

  return (
    <>
      <div className="messages-scroll" ref={feedRef}>
        <div className="channel-welcome">
          <div className="welcome-icon">
            <Icon name={isDm ? 'message' : 'hash'} size={25} />
          </div>
          <div>
            <span className="eyebrow">{isDm ? 'DIRECT MESSAGE' : 'YOU ARE IN'}</span>
            <h1>{isDm ? currentDm?.name : `#${channel?.name ?? ''}`}</h1>
            <p>
              {isDm
                ? 'This is the beginning of your private conversation.'
                : <>This is the start of <strong>#{channel?.name ?? ''}</strong> in {server?.name}.</>}
            </p>
          </div>
          <div className="welcome-actions">
            <button onClick={() => isDm ? onNotify('Conversation options opened.') : onInvite()}>
              <Icon name={isDm ? 'more' : 'users'} size={15} />
              {isDm ? 'Options' : 'Invite'}
            </button>
            <button onClick={onOpenPinnedView} title="Pinned messages">
              <Icon name="pin" size={15} />
            </button>
          </div>
        </div>

        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isPinned={pinnedMessageIds.includes(message.id)}
            isMenuOpen={activeMenuId === message.id}
            onReact={onReact}
            onReply={handleStartReply}
            onEdit={(item) => { onEdit(item); setActiveMenuId(null) }}
            onRemove={(item) => { onRemove(item); setActiveMenuId(null) }}
            onTogglePin={(item) => { onTogglePin(item); setActiveMenuId(null) }}
            onToggleMenu={(id) => setActiveMenuId((current) => current === id ? null : id)}
            onReplyReferenceClick={(id) => onNotify(`Reply reference: ${id}`)}
          />
        ))}

        {messages.length === 0 && (
          <div className="empty-state">
            <Icon name="message" size={25} />
            <strong>No messages yet</strong>
            <span>Messages will appear here when the conversation starts.</span>
          </div>
        )}
      </div>

      <Composer
        inputRef={messageInputRef}
        value={composerText}
        placeholder={placeholder}
        replyTo={replyTo}
        editingId={editingId}
        attachment={attachment}
        onChange={onComposerTextChange}
        onSubmit={onSendMessage}
        onCancelReply={onCancelReply}
        onCancelEdit={onCancelEdit}
        onAttachmentSelect={onAttachmentSelect}
        onRemoveAttachment={onRemoveAttachment}
        onAddEmoji={onAddEmoji}
      />
    </>
  )
}
