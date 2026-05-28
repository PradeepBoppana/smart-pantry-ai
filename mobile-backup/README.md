# Smart Pantry AI — Mobile App

React Native (Expo) mobile app for Smart Pantry AI. Works on iOS and Android.

## 📱 Screens

| Screen | Description |
|--------|-------------|
| **Pantry** | View all items, expiry countdowns, add manually, mark as used |
| **Scan** | Take photo or pick from gallery → AI detects groceries |
| **Cook** | AI-generated recipes from your pantry items |
| **Shop** | Smart shopping list with AI generation |
| **Stats** | Fridge health score, waste rate, savings |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (download from App Store / Play Store)
- Backend running (see root README)

### Setup

```bash
# From the project root
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

### Connect to Backend

1. Find your computer's local IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`

2. Edit `services/api.ts` and update `API_BASE`:
   ```ts
   const API_BASE = 'http://YOUR_IP:3000/api';
   ```

3. Make sure your backend CORS allows requests from your phone's IP.

### Run on Device

1. Scan the QR code with Expo Go (Android) or Camera app (iOS)
2. The app will load on your phone
3. Login with the same credentials as the web app

### Run on Simulator

```bash
# iOS (requires Xcode on Mac)
npx expo start --ios

# Android (requires Android Studio)
npx expo start --android
```

## 🔑 API Keys Required

These go in your backend's `.env` file (not in the mobile app):

- `OPENAI_API_KEY` — For grocery photo/receipt scanning
- `ANTHROPIC_API_KEY` — For AI recipe generation

## 📁 File Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Auth (Login/Register)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigation
│       ├── index.tsx        # Pantry (home)
│       ├── scan.tsx         # Scan groceries
│       ├── recipes.tsx      # AI recipes
│       ├── shopping.tsx     # Shopping list
│       └── stats.tsx        # Fridge health
├── services/
│   └── api.ts               # Backend API client
├── constants/
│   └── theme.ts             # Colors, styles, icons
├── assets/                   # App icons & splash
├── app.json                  # Expo config
├── package.json
└── babel.config.js
```

## 🎨 Design

Matches the web frontend — warm organic kitchen aesthetic:
- Cream background (#FDFAF6)
- Orange accent (#E07B3C)
- Green/amber/red urgency indicators
- Category emoji icons (🥛🥩🥬🍎🌾🥤🍪🧂🧊📦)
