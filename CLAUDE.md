# Mavro Studio — Notlar

## İkon Kütüphanesi (referans)

- **Iconly Pro** — ücretsiz ikon seti: https://web.iconly.pro/?is_free=1
  - Projede ikon gerektiğinde buradaki ücretsiz ikonları kullan.
  - Kaliteli/çeşitli ikon seçenekleri mevcut.
  - ⚠️ Resmi `react-iconly` paketi React 19 ile **uyumsuz** (`defaultProps` kullanıyor).
    Bu yüzden yeni ikonlar `src/renderer/src/components/icons/iconly.tsx` içinde
    Iconly "Light" stiline sadık **yerel SVG bileşenleri** olarak tutulur.
    Yeni özelliklerde ikon eklerken bu setten içe aktar (gerekirse yenisini bu dosyaya ekle).
  - Mevcut/eski sayfalar `lucide-react` kullanmaya devam ediyor.
