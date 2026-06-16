; ================================================================
; Mavro Studio - Custom NSIS Installer Script
; ================================================================

; Mevcut kurulum varsa direkt güncellemeye devam et (diyalog gösterme)
!macro customInit
  ; Sessiz modda veya normal güncelleme sırasında hiçbir diyalog gösterme
  ; autoUpdater.quitAndInstall(true, true) ile sessiz modda çalışır
!macroend
