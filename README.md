<div align="center">

<img src="build/icon.ico" width="96" alt="Mavro Studio Logo" />

# Mavro Studio

** Premium masaüstü yönetim aracı.**  
Projelerini, notlarını, kişilerini ve güvenliğini tek bir şık arayüzde yönet.

[![Release](https://img.shields.io/github/v/release/Mavrom/mavro-studio?style=flat-square&color=4F8FFF)](https://github.com/Mavrom/mavro-studio/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square)](https://github.com/Mavrom/mavro-studio/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-36-47848F?style=flat-square&logo=electron)](https://electronjs.org)

</div>

---

## ✨ Nedir?

Mavro Studio, Mavro geliştiricileri ve ekip üyeleri için özel olarak geliştirilen bir **masaüstü kontrol panelidir**. Web tabanlı araçlara gerek kalmadan; projelerini takip edebilir, notlarını organize edebilir, kişi rehberini yönetebilir ve güvenlik bilgilerini güvende tutabilirsin — hepsini tek bir uygulama üzerinden.

Tamamen **OLED siyah** tema üzerine kurulu, sıfır dikkat dağıtıcı, odak odaklı bir deneyim sunar.

---

## 🎯 Kime Hitap Ediyor?

| Kullanıcı | Neden Kullanmalı |
|-----------|-----------------|
| **Mavro Geliştiricileri** | Proje takibi, geliştirici notları ve kişi yönetimi tek ekranda |
| **Ekip Liderleri** | Dashboard üzerinden anlık sistem durumu ve hızlı erişim |
| **Operasyon Ekibi** | Takvim alarmları, hatırlatıcılar ve güvenlik kaydı takibi |

---

## 🚀 Özellikler

### 📅 Takvim & Alarm
Aylık takvim görünümü üzerinden istediğin güne not veya alarm ekle. Alarm saati geldiğinde hem masaüstü bildirimi hem de uygulama içi uyarı alırsın.

### 📊 Dashboard
- Gerçek zamanlı **CPU, RAM ve disk** kullanım göstergesi
- Sistem uptime sayacı
- Proje, kişi ve not sayılarına anlık erişim
- Hızlı aksiyon kısayolları

### 📁 Projeler
Mavro projelerini kategori, favori ve arama filtreleriyle listele ve yönet. Her proje için başlık, açıklama, kategori ve son değişiklik tarihini takip et.

### 📝 Notlar
Markdown destekli notlar oluştur. Arama ve kategori filtreleriyle notlarını anında bul.

### 👥 Kişiler
Mavro ekibinin iletişim bilgilerini güvenli şekilde sakla. İsim, kullanıcı adı, telefon numarası ve ek bilgi alanlarıyla kişi rehberi oluştur. **Gizlilik modu** ile hassas bilgiler ekranda maskelenir.

### 🔐 Güvenlik
- Servis bazlı şifre ve token kasası
- İki faktörlü kimlik doğrulama (MFA) yönetimi
- Güvenlik puanı ve aktivite kayıtları

### ⚙️ Ayarlar
- Türkçe / İngilizce dil desteği
- Proxy yapılandırması
- Mavro çalıştırıcı yolu ve başlangıç parametreleri
- Bildirim tercihleri
- Otomatik başlatma ve güncelleme ayarları

---

## 📦 Kurulum

### Hazır Yükleyici (Önerilen)

[**→ Son sürümü indir**](https://github.com/Mavrom/mavro-studio/releases/latest)

`.exe` dosyasına çift tıkla — kurulum sihirbazı olmadan direkt yüklenir ve açılır.

### Kaynak Koddan

```bash
# Depoyu klonla
git clone https://github.com/Mavrom/mavro-studio.git
cd mavro-studio

# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev
```

---

## 🔄 Otomatik Güncelleme

Mavro Studio yeni bir sürüm yayınlandığında otomatik olarak bildirim alırsın. "Güncelle" butonuna bastıktan sonra indirme tamamlanınca tek tıkla sessiz güncelleme yapılır — setup ekranı çıkmaz, uygulama kendiliğinden yeniden başlar.

---

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Çerçeve | [Electron 36](https://electronjs.org) |
| UI | [React 19](https://react.dev) + TypeScript |
| Build | [electron-vite](https://electron-vite.org) |
| Durum Yönetimi | [Zustand](https://zustand-demo.pmnd.rs) |
| Grafikler | [Recharts](https://recharts.org) |
| Paketleme | [electron-builder](https://www.electron.build) |
| Depolama | [electron-store](https://github.com/sindresorhus/electron-store) |
| Güncelleme | [electron-updater](https://www.electron.build/auto-update) |

---

## 📁 Proje Yapısı

```
mavro-studio/
├── src/
│   ├── main/          # Electron ana süreç (IPC, updater, store)
│   ├── preload/       # Güvenli köprü API'si
│   └── renderer/      # React uygulaması
│       ├── components/ # Ortak bileşenler (TitleBar, Sidebar, vb.)
│       ├── pages/      # Sayfa bileşenleri
│       ├── store/      # Zustand global store
│       ├── i18n/       # TR / EN çeviri dosyaları
│       └── styles/     # Global CSS tasarım sistemi
├── build/             # Uygulama ikonları
└── scripts/           # Release otomasyonu
```

---

## 📋 Geliştirici Komutları

```bash
npm run dev          # Geliştirme sunucusunu başlat
npm run build        # Prodüksiyon için derle
npm run build:win    # Windows installer oluştur
```

---

## 🔒 Lisans

MIT © [Mavro Team](https://github.com/Mavrom)
