# Mavro Studio — Proje Notları

## Sürüm & Release Politikası (ÖNEMLİ — kullanıcı talebi)
Kullanıcı her zaman release işini Claude'un üstlenmesini istiyor. **Kullanıcıyı uğraştırma.**

> **KURAL:** GitHub'a yeni bir geliştirme/güncelleme push edildiğinde, Claude **otomatik olarak**
> yeni bir GitHub Release yayınlar (installer ekli). Kullanıcının ayrıca onay vermesine veya
> manuel tag atmasına gerek yoktur — bu durdurulması istenmedikçe geçerli kalıcı yetkidir.

### Nasıl yapılır (kanıtlanmış akış)
Bu ortam yalnızca atanmış branch'e push'a izin verir; **`git push` ile tag push'u 403 verir.**
Bu yüzden release şu şekilde yapılır:
1. `package.json` (ve `package-lock.json` root + `packages[""]`) sürümünü yükselt (örn. 1.0.x → 1.0.(x+1)).
2. Değişiklikleri commit'le ve branch'e push'la.
3. Windows installer workflow'unu **workflow_dispatch** ile tetikle:
   - MCP: `mcp__github__actions_run_trigger` → `method: run_workflow`,
     `workflow_id: build-windows.yml`, `ref: <aktif-branch>`, `inputs: { release: "true" }`.
4. Workflow (`.github/workflows/build-windows.yml`) `v<version>` tag'ini + GitHub Release'i
   kendi içinde oluşturur ve `Setup.exe`'yi release'e ekler (`softprops/action-gh-release`).
5. Build'i takip et; başarılıysa kullanıcıya release linkini bildir, başarısızsa düzelt ve tekrar tetikle.

`v*` tag'i gerçekten push edilebiliyorsa (farklı ortam) workflow zaten `on: push: tags: ['v*']`
ile de release üretir.

## Proje Künyesi
- **Tür:** Electron + React 19 + TypeScript masaüstü uygulaması (electron-vite, electron-builder).
- **Tasarım sistemi:** Tek dosya — `src/renderer/src/styles/index.css` (koyu glassmorphism, CSS değişkenleri).
  Tüm bileşenler bu tokenları kullanır; token değiştirmek tüm UI'yı etkiler.
- **Kalıcılık:** `electron-store` → `window.api.getSetting/setSetting` (`src/preload/index.ts`,
  IPC `src/main/index.ts`). İlk açılış için `setupComplete` bayrağı kullanılır.
- **i18n:** `src/renderer/src/i18n/{tr,en}.json`, `useAppStore().t()` (`src/renderer/src/store`).
- **Onboarding:** İlk açılışta premium kurulum sihirbazı (`setupComplete=false` iken). App data
  korunduğu için reinstall'da wizard tekrar görünmez; görmek için app data silinmeli.

## Komutlar
- `npm run dev` — geliştirme; `npm run build` — derleme; `npm run build:win` — yerel Windows installer.
- CI: `.github/workflows/build-windows.yml` (windows-latest) installer build + (tag/dispatch) release.
