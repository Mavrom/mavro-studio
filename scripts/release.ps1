# Mavro Studio Release Script
# Kullanim: .\scripts\release.ps1
# Otomatik versiyon arttirir, build alir, GitHub'a yukler, eski surumu siler.

param([string]$type = "patch")  # patch | minor | major

Set-Location (Split-Path $PSScriptRoot -Parent)

$env:GH_TOKEN = (gh auth token)

Write-Host "=== Mavro Studio Release ===" -ForegroundColor Cyan

# 1. Mevcut versiyonu kaydet
$oldVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Mevcut versiyon: v$oldVersion" -ForegroundColor Yellow

# 2. Versiyon artir
npm version $type --no-git-tag-version | Out-Null
$newVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Yeni versiyon:   v$newVersion" -ForegroundColor Green

# 3. Build al
Write-Host "`nBuild aliniyor..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build basarisiz!" -ForegroundColor Red; exit 1 }

# 4. Git commit + tag + push
git add package.json package-lock.json
git commit -m "chore: release v$newVersion"
git tag "v$newVersion"
git push origin master
git push origin "v$newVersion"

# 5. GitHub'a yayinla
Write-Host "`nGitHub'a yukleniyor..." -ForegroundColor Cyan
npx electron-builder --win --publish always

if ($LASTEXITCODE -ne 0) { Write-Host "Yayinlama basarisiz!" -ForegroundColor Red; exit 1 }

# 6. latest.yml yukle (electron-builder bazen atliyor)
gh release upload "v$newVersion" "dist\latest.yml" --repo Mavrom/mavro-studio --clobber 2>$null

# 7. Draft duplicate'i sil (electron-builder ikili olusturuyor)
Write-Host "`nDuplicate draft release temizleniyor..." -ForegroundColor Cyan
$releases = gh api repos/Mavrom/mavro-studio/releases | ConvertFrom-Json
foreach ($r in $releases) {
    if ($r.tag_name -eq "v$newVersion" -and $r.draft -eq $true) {
        gh api "repos/Mavrom/mavro-studio/releases/$($r.id)" -X DELETE 2>$null
        Write-Host "Draft silindi: $($r.id)"
    }
}

# 8. Eski surumu sil (yeni surumden farkli tum release + tag'ler)
Write-Host "Eski surumler temizleniyor..." -ForegroundColor Cyan
$releases = gh api repos/Mavrom/mavro-studio/releases | ConvertFrom-Json
foreach ($r in $releases) {
    if ($r.tag_name -ne "v$newVersion") {
        $oldTag = $r.tag_name
        gh api "repos/Mavrom/mavro-studio/releases/$($r.id)" -X DELETE 2>$null
        gh api "repos/Mavrom/mavro-studio/git/refs/tags/$oldTag" -X DELETE 2>$null
        Write-Host "Silindi: $oldTag ($($r.name))"
    }
}

# 9. Release'i yayinla (draft'tan cikar)
Write-Host "`nRelease yayinlaniyor..." -ForegroundColor Cyan
gh release edit "v$newVersion" --repo Mavrom/mavro-studio --draft=false --title "Mavro Studio v$newVersion" --notes "## Mavro Studio v$newVersion

Otomatik yayinlanan surum." 2>$null

Write-Host "`nv$newVersion basariyla yayinlandi!" -ForegroundColor Green
Write-Host "https://github.com/Mavrom/mavro-studio/releases/tag/v$newVersion" -ForegroundColor Cyan
