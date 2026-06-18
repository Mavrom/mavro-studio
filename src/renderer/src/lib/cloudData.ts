import { supabase } from './supabase'

export type DataKey = 'notes' | 'contacts' | 'projects'

// Buluttan bir koleksiyonu (dizi) yükler. RLS sayesinde yalnızca kendi verisi döner.
export async function loadData<T = unknown>(key: DataKey): Promise<T[]> {
  const { data, error } = await supabase
    .from('app_data')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (error) {
    console.error('cloudData.loadData', key, error.message)
    return []
  }
  return ((data?.value as T[]) ?? [])
}

// Bir koleksiyonu buluta kaydeder (upsert: user_id + key benzersiz).
export async function saveData(key: DataKey, value: unknown): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return
  const { error } = await supabase
    .from('app_data')
    .upsert({ user_id: uid, key, value }, { onConflict: 'user_id,key' })
  if (error) console.error('cloudData.saveData', key, error.message)
}

// İlk girişte: bulut boşsa ve bu cihazda yerel veri varsa, yerel veriyi buluta taşır.
// Böylece mevcut notlar/kişiler/projeler kaybolmaz.
export async function migrateLocalIfNeeded(): Promise<void> {
  const keys: DataKey[] = ['notes', 'contacts', 'projects']
  for (const key of keys) {
    try {
      const cloud = await loadData(key)
      if (cloud.length > 0) continue
      if (!window.api) continue
      const local = (await window.api.getData(key)) as unknown[]
      if (Array.isArray(local) && local.length > 0) {
        await saveData(key, local)
      }
    } catch (e) {
      console.error('cloudData.migrate', key, e)
    }
  }
}
