; ================================================================
; Mavro Studio - Custom NSIS Installer Script
; ================================================================

; Mevcut kurulum kontrolü: Repair / Kaldır / İptal
!macro customInit
  ; Önce kullanıcı başına (HKCU) kurulumu kontrol et
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  ${If} $R0 == ""
    ; Tüm kullanıcılar (HKLM) kurulumunu kontrol et
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  ${EndIf}

  ${If} $R0 != ""
    MessageBox MB_YESNOCANCEL|MB_ICONQUESTION \
      "Mavro Studio zaten bilgisayarınızda yüklü!$\n$\n\
Ne yapmak istersiniz?$\n$\n\
  Evet   → Onar / Yeniden Yükle$\n\
  Hayır  → Uygulamayı Kaldır$\n\
  İptal  → Kurulumdan Çık" \
      IDYES continueInstall IDNO doUninstall
    Abort
    doUninstall:
      ExecWait '$R0'
      Abort
    continueInstall:
  ${EndIf}
!macroend
