# 🎯 Visa Appointment Tracker

Automated visa appointment tracking system with real-time Telegram notifications.

## ✨ Features

- 🔄 Automated appointment monitoring
- 🌍 Multi-city support
- 🇪🇺 Multiple country tracking
- 📱 Real-time Telegram notifications
- ⚡ Configurable check intervals
- 🛡️ Rate limiting protection
- 🔍 Debug mode for troubleshooting
- 🎯 Category-based filtering

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm/yarn/pnpm
- Telegram Bot Token
- Telegram Channel ID

### Setup

1. **Clone and Install**
```bash
git clone <your-repo-url>
cd visa-appointment-tracker
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
```

3. **Set up Telegram Bot**
- Chat with [@BotFather](https://t.me/botfather)
- Create new bot with `/newbot`
- Save the bot token
- Create a channel and add bot as admin
- Get channel ID using: `https://api.telegram.org/bot<TOKEN>/getUpdates`

4. **Update Environment Variables**
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_channel_id
TELEGRAM_RATE_LIMIT=20
TELEGRAM_RETRY_AFTER=5000

# Application
CHECK_INTERVAL=*/5 * * * *
TARGET_COUNTRY=Turkiye

# Filtering
CITIES=Ankara,Istanbul
MISSION_COUNTRY=Netherlands,France
VISA_SUBCATEGORIES=Tourism,Business

# Debug
DEBUG=false
```

5. **Build and Run**
```bash
# Build
npm run build

# Start
npm start

# Development mode
npm run dev
```

## 🔧 Configuration

### Check Intervals
```bash
*/5 * * * *  # Every 5 minutes
0 * * * *    # Every hour
0 9,18 * * * # Twice daily (9 AM and 6 PM)
```

### Filtering Options
- `CITIES`: Target cities (comma-separated)
- `MISSION_COUNTRY`: Target countries
- `VISA_SUBCATEGORIES`: Specific visa types

## 📱 Notification Example

```
🎯 NEW VISA APPOINTMENT FOUND!

🏛️ Consulate: Netherlands VFS Center - Istanbul
📆 Date: 15.03.2024
🛂 Category: Short Term Visa
└ 📋 Type: Tourism
👥 Queue: 12

🔗 Book Now: [Appointment Link]

⏰ Updated: 01.03.2024 10:30
```

## 🛠️ Development

### Project Structure
```
src/
├── config/      # Configuration
├── core/        # Core logic
├── services/    # External services
├── types/       # Type definitions
└── utils/       # Utilities
```

### Key Components
- `AppointmentManager`: Main appointment tracking
- `NotificationManager`: Telegram notifications
- `ApiService`: External API communication
- `CacheService`: Appointment caching

## 📝 License

MIT License - feel free to use and modify

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.
