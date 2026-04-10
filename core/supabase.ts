import { createClient } from "@supabase/supabase-js"
import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "local"
})

// Custom storage adapter for Supabase to work with chrome.storage.local via Plasmo Storage
const supabaseStorageAdapter = {
  getItem: async (key: string) => {
    return await storage.get(key)
  },
  setItem: async (key: string, value: string) => {
    await storage.set(key, value)
  },
  removeItem: async (key: string) => {
    await storage.remove(key)
  }
}

const supabaseUrl = "https://vnzohpjqifjcwmkjduac.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuem9ocGpxaWZqY3dta2pkdWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQyNjQsImV4cCI6MjA5MTQyMDI2NH0.ksw2ABif5fRMeMhqZtiLZDaTUHyD1P4-Xv8dCzzzV7M"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
