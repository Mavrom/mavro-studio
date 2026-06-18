import { createClient } from '@supabase/supabase-js'

// Bu değerler herkese açık olabilir; veri güvenliği veritabanındaki RLS ile sağlanır.
const SUPABASE_URL = 'https://virnjuqcwrirfpzogftb.supabase.co'
const SUPABASE_KEY = 'sb_publishable_yKWeugfWEHe3LYzSAOg-kw__mhOMaX1'

// Masaüstü (Electron) OAuth geri dönüş adresi — Supabase'de "Redirect URLs" listesine eklenmeli
export const LOOPBACK_REDIRECT = 'http://localhost:8788/callback'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Kodu loopback üzerinden elle işliyoruz; sayfa URL'sinde token aramasın
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
})
