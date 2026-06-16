# Mavro Studio Release Script
# Kullanim: .\scripts\release.ps1
# Otomatik versiyon arttirir, build alir, GitHub'a yukler, eski surumu siler.

param([string]$type = "patch")  # patch | minor | major

Set-Location (Split-Path $PSScriptRoot -Parent)

# Clear potentially invalid token env vars first to allow gh auth token to query keyring
$env:GITHUB_TOKEN = $null
$env:GH_TOKEN = $null
$token = gh auth token
$env:GH_TOKEN = $token
$env:GITHUB_TOKEN = $token

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
git add .
git commit -m "chore: release v$newVersion"
git tag "v$newVersion"
git push origin master
git push origin "v$newVersion"

# 4b. Draft release'i onceden olustur (electron-builder race condition'ini onlemek icin)
Write-Host "`nDraft release onceden olusturuluyor..." -ForegroundColor Cyan
gh release create "v$newVersion" --draft --title "Mavro Studio v$newVersion" --notes "Otomatik yayinlanan surum." --repo Mavrom/mavro-studio
if ($LASTEXITCODE -ne 0) { Write-Host "Draft release olusturulamadi!" -ForegroundColor Red; exit 1 }

# 5. GitHub'a yayinla
Write-Host "`nGitHub'a yukleniyor..." -ForegroundColor Cyan
npx electron-builder --win --publish always

if ($LASTEXITCODE -ne 0) { Write-Host "Yayinlama basarisiz!" -ForegroundColor Red; exit 1 }

# 6. latest.yml'yi MUTLAKA yukle (auto-update icin kritik)
Write-Host "`nlatest.yml yukleniyor (auto-update icin kritik)..." -ForegroundColor Yellow
$latestYml = "dist\latest.yml"
if (Test-Path $latestYml) {
    # 3 deneme yap
    $uploadSuccess = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        Write-Host "  latest.yml yukleme denemesi $attempt/3..." -ForegroundColor Cyan
        gh release upload "v$newVersion" $latestYml --repo Mavrom/mavro-studio --clobber
        if ($LASTEXITCODE -eq 0) {
            $uploadSuccess = $true
            Write-Host "  latest.yml basariyla yuklendi!" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 3
    }
    if (-not $uploadSuccess) {
        Write-Host "  UYARI: latest.yml yuklenemedi! Auto-update calismayacak." -ForegroundColor Red
    }
} else {
    Write-Host "  HATA: latest.yml bulunamadi: $latestYml" -ForegroundColor Red
    exit 1
}

# 7. blockmap dosyasini da yukle (differential update icin)
$blockmap = "dist\Mavro Studio Setup $newVersion.exe.blockmap"
if (Test-Path $blockmap) {
    # Dosya adindaki bosluklari tireye cevir
    $blockmapClean = "dist\Mavro-Studio-Setup-$newVersion.exe.blockmap"
    Copy-Item $blockmap $blockmapClean -Force 2>$null
    gh release upload "v$newVersion" $blockmapClean --repo Mavrom/mavro-studio --clobber
    Write-Host "  blockmap yuklendi." -ForegroundColor Green
}

# 8. Draft duplicate'i sil (Asset'i olan draft'i koru, bos olanlari sil)
Write-Host "`nDuplicate draft release temizleniyor..." -ForegroundColor Cyan
$releases = gh api repos/Mavrom/mavro-studio/releases | ConvertFrom-Json
$myDrafts = $releases | Where-Object { $_.tag_name -eq "v$newVersion" -and $_.draft -eq $true }

$draftToKeep = $null
foreach ($r in $myDrafts) {
    $hasExeAsset = $false
    if ($r.assets) {
        foreach ($a in $r.assets) {
            if ($a.name -like "*.exe") {
                $hasExeAsset = $true
                break
            }
        }
    }
    if ($hasExeAsset) {
        $draftToKeep = $r
        Write-Host "Korumak icin assetli draft secildi: $($r.id)" -ForegroundColor Green
        break
    }
}

if ($null -eq $draftToKeep -and $myDrafts.Count -gt 0) {
    $draftToKeep = $myDrafts[0]
    Write-Host "Assetli draft bulunamadi. Varsayilan olarak ilk draft korunacak: $($draftToKeep.id)" -ForegroundColor Yellow
}

foreach ($r in $myDrafts) {
    if ($draftToKeep -and $r.id -eq $draftToKeep.id) {
        Write-Host "Draft korundu: $($r.id)"
    } else {
        gh api "repos/Mavrom/mavro-studio/releases/$($r.id)" -X DELETE
        Write-Host "Draft silindi: $($r.id)"
    }
}

# 9. Eski surumu sil (yeni surumden farkli tum release + tag'ler)
Write-Host "Eski surumler temizleniyor..." -ForegroundColor Cyan
$releases = gh api repos/Mavrom/mavro-studio/releases | ConvertFrom-Json
foreach ($r in $releases) {
    if ($r.tag_name -ne "v$newVersion") {
        $oldTag = $r.tag_name
        gh api "repos/Mavrom/mavro-studio/releases/$($r.id)" -X DELETE
        gh api "repos/Mavrom/mavro-studio/git/refs/tags/$oldTag" -X DELETE
        Write-Host "Silindi: $oldTag ($($r.name))"
    }
}

# 10. Release'i yayinla (draft'tan cikar)
Write-Host "`nRelease yayinlaniyor..." -ForegroundColor Cyan
gh release edit "v$newVersion" --repo Mavrom/mavro-studio --draft=false --title "Mavro Studio v$newVersion" --notes "## Mavro Studio v$newVersion

Otomatik yayinlanan surum."

# 11. DOGRULAMA: Release asset'lerini kontrol et
Write-Host "`nRelease asset dogrulamasi..." -ForegroundColor Cyan
$assetList = gh release view "v$newVersion" --repo Mavrom/mavro-studio --json assets --jq ".assets[].name"
$hasLatestYml = $assetList -match "latest.yml"
$hasExe = $assetList -match "\.exe$"
if ($hasLatestYml -and $hasExe) {
    Write-Host "  DOGRULANDI: latest.yml + Setup.exe mevcut" -ForegroundColor Green
} else {
    Write-Host "  UYARI: Eksik asset var! Manuel kontrol edin." -ForegroundColor Red
    Write-Host "  Mevcut assetler:`n$assetList" -ForegroundColor Yellow
}

Write-Host "`nv$newVersion basariyla yayinlandi!" -ForegroundColor Green
Write-Host "https://github.com/Mavrom/mavro-studio/releases/tag/v$newVersion" -ForegroundColor Cyan
