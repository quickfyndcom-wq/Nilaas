import { useCallback, useEffect, useRef, useState } from 'react'
import { auth } from './firebase'

/** Avoid hammering Firebase Identity Toolkit (auth/quota-exceeded). */
const TOKEN_CACHE_MS = 4 * 60 * 1000 // reuse for ~4 minutes (tokens last ~1 hour)

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const cacheRef = useRef({ token: null, at: 0, uid: null })

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      if (!firebaseUser || cacheRef.current.uid !== firebaseUser.uid) {
        cacheRef.current = { token: null, at: 0, uid: firebaseUser?.uid || null }
      }
    })
    return () => unsubscribe()
  }, [])

  const getToken = useCallback(async (forceRefresh = false) => {
    const currentUser = auth.currentUser
    if (!currentUser) return null

    const now = Date.now()
    const cached = cacheRef.current
    if (
      !forceRefresh &&
      cached.token &&
      cached.uid === currentUser.uid &&
      now - cached.at < TOKEN_CACHE_MS
    ) {
      return cached.token
    }

    try {
      // Prefer cached Firebase token unless caller explicitly asks to refresh
      const token = await currentUser.getIdToken(Boolean(forceRefresh))
      cacheRef.current = { token, at: Date.now(), uid: currentUser.uid }
      return token
    } catch (error) {
      const code = error?.code || ''
      console.error('[useAuth] Error getting token:', code || error)

      // Quota / network: never retry with forceRefresh — that makes it worse
      if (
        code === 'auth/quota-exceeded' ||
        code === 'auth/too-many-requests' ||
        String(error?.message || '').includes('quota-exceeded')
      ) {
        if (cached.token && cached.uid === currentUser.uid) {
          return cached.token
        }
        return null
      }

      // Soft fallback: try once without force refresh
      if (forceRefresh) {
        try {
          const token = await currentUser.getIdToken(false)
          cacheRef.current = { token, at: Date.now(), uid: currentUser.uid }
          return token
        } catch (retryError) {
          console.error('[useAuth] Retry without refresh failed:', retryError?.code || retryError)
          return cached.token && cached.uid === currentUser.uid ? cached.token : null
        }
      }

      return cached.token && cached.uid === currentUser.uid ? cached.token : null
    }
  }, [])

  return { user, loading, getToken }
}
