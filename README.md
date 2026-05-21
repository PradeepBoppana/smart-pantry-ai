# 🥕 Smart Pantry AI

**Your kitchen memory.** Snap a photo of groceries → AI detects items → tracks expiry → suggests recipes → smart shopping lists.

## Features

- 📸 **Photo Scan** — Take a photo of groceries, AI detects all items instantly
- 🧾 **Receipt Scan** — Upload receipt, OCR extracts every item and price
- ⏰ **Expiry Tracking** — Auto-estimated expiry dates with daily reminders
- 🍳 **Cook With What You Have** — AI suggests recipes from your current pantry
- 🛒 **Smart Shopping Lists** — AI-generated based on your consumption patterns
- 📊 **Fridge Health Score** — Gamified waste tracking (save money, reduce waste)
- 👨‍👩‍👧 **Family Sync** — Shared pantry for the whole household
- 🔔 **Push Notifications** — "Chicken expires tomorrow — try this stir-fry!"

## Tech Stack

- **Backend:** Node.js, Express.js, PostgreSQL, Redis
- **AI:** OpenAI Vision API (food detection), Claude API (recipe generation)
- **Storage:** AWS S3 (images), Firebase (push notifications)
- **Auth:** JWT with bcrypt

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd smart-pantry-ai
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys and database credentials

# 3. Set up PostgreSQL
createdb smart_pantry

# 4. Start the server
npm run dev
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| PUT | `/api/auth/preferences` | Update dietary preferences |
| POST | `/api/auth/join-family` | Join family with invite code |

### Pantry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pantry` | List all items (filter by status, category) |
| GET | `/api/pantry/expiring` | Items expiring within N days |
| POST | `/api/pantry` | Add single item |
| POST | `/api/pantry/bulk` | Add multiple items (from scan) |
| PUT | `/api/pantry/:id` | Update item |
| DELETE | `/api/pantry/:id` | Remove item |
| POST | `/api/pantry/:id/use` | Mark as used (partial or full) |

### Scan
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan/photo` | Scan grocery photo (multipart) |
| POST | `/api/scan/receipt` | Scan receipt image (multipart) |
| POST | `/api/scan/base64` | Scan from base64 (mobile camera) |
| GET | `/api/scan/history` | Past scan sessions |

### Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes/suggest` | AI recipes from current pantry |
| GET | `/api/recipes/detail/:name` | Full recipe with steps |
| POST | `/api/recipes/rescue` | Leftover rescue ideas |
| POST | `/api/recipes/quick` | Quick meal from selected items |

### Shopping
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shopping` | Current shopping list |
| POST | `/api/shopping/generate` | AI-generate smart list |
| POST | `/api/shopping/add` | Add item manually |
| PUT | `/api/shopping/check/:index` | Toggle item checked |
| PUT | `/api/shopping/complete` | Mark trip complete |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/health` | Fridge health score (0-100) |
| GET | `/api/stats/waste` | Waste breakdown by category |
| GET | `/api/stats/patterns` | Consumption patterns |
| GET | `/api/stats/summary` | Dashboard summary |

## Project Structure

```
smart-pantry-ai/
├── package.json
├── .env.example
├── README.md
└── src/
    ├── server.js              # Express app entry point
    ├── config/
    │   └── database.js        # Sequelize PostgreSQL config
    ├── middleware/
    │   └── auth.js            # JWT authentication
    ├── models/
    │   └── index.js           # All Sequelize models
    ├── routes/
    │   ├── auth.js            # Register, login, preferences
    │   ├── pantry.js          # CRUD pantry items
    │   ├── scan.js            # Photo/receipt AI scanning
    │   ├── recipes.js         # AI recipe suggestions
    │   ├── shopping.js        # Smart shopping lists
    │   └── stats.js           # Fridge health analytics
    ├── services/
    │   ├── visionService.js   # OpenAI Vision food detection
    │   ├── recipeService.js   # Claude API recipe generation
    │   └── notificationService.js  # Firebase push + cron
    └── utils/
        └── s3Upload.js        # AWS S3 image uploads
```

## Next Steps (Mobile App)

Build the React Native or Flutter mobile app that connects to this API:
1. Camera integration for photo/receipt scanning
2. Home screen with expiry countdown cards
3. Recipe browser with "Cook Now" action
4. Shopping list with real-time family sync
5. Fridge health dashboard with charts

## License

MIT
