import { defaultData } from '../constants/seedData'
import type { Data } from '../types/chat'
import type { SocialPost } from '../types/social'

const LEGACY_DEMO_KEYS = [
  'community-frontend-state',
  'community-frontend-state-v2',
  'community-social-posts',
  'community-social-posts-v2',
  'community-social-follows',
  'community-social-follows-v2',
]

function clearLegacyDemoContent(): void {
  try {
    for (const key of LEGACY_DEMO_KEYS) localStorage.removeItem(key)
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

export function loadData(): Data {
  clearLegacyDemoContent()
  return defaultData
}

export function saveData(_data: Data): boolean {
  return true
}

export function loadSocialPosts(): SocialPost[] {
  clearLegacyDemoContent()
  return []
}

export function saveSocialPosts(_posts: SocialPost[]): boolean {
  return true
}

export function loadFollowedHandles(): string[] {
  clearLegacyDemoContent()
  return []
}

export function saveFollowedHandles(_handles: string[]): boolean {
  return true
}

export function clearDemoStorage(): void {
  clearLegacyDemoContent()
}
