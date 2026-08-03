import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const defaultSession = { user: null, loading: true, error: null }

let initStarted = false

export const useAuthStore = create((set, get) => ({
  ...defaultSession,

  init: async () => {
    if (initStarted) return;
    initStarted = true;
    if (!isSupabaseConfigured) {
      set({ user: null, loading: false, error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env' })
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false, error: null })
    } catch (e) {
      set({ user: null, loading: false, error: e.message })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false, error: null })
    })
  },

  signIn: async (email, password) => {
    set({ error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      set({ user: data.user, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  signUp: async (email, password) => {
    set({ error: null })
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (data.user && !data.session) {
        set({ user: null, loading: false })
        return { ok: true, confirmEmail: true }
      }
      set({ user: data.user ?? null, loading: false })
      return { ok: true, confirmEmail: false }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, loading: false, error: null })
  },

  getAccessToken: () => get().user?.access_token || null,
}))
