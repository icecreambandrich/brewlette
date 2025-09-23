# Brewlette ☕🎲

**Spin the wheel, find your perfect coffee!**

Brewlette is a fun web app that helps you discover amazing coffee shops in London. Simply share your location, choose how far you're willing to walk, and spin to get a random coffee shop recommendation weighted by rating.

## ✨ Features

- 🎯 **Location-based discovery** - Uses your current location or manual input
- 🚶 **Walking distance options** - Choose 5 or 10 minute walks (400m or 800m radius)
- ⭐ **Rating-weighted selection** - Higher rated shops have better chances
- 📱 **Mobile-friendly design** - Optimized for on-the-go coffee hunting
- 🗺️ **Google Maps integration** - One-click directions to your coffee destination
- 💾 **Recent discoveries** - Saves your last 5 spins locally
- 🎨 **Beautiful UI** - Clean, minimal design with coffee-themed colors

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database and import coffee shop data:**
   ```bash
   npm run setup
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** SQLite with Prisma ORM
- **Data:** 2,500+ London coffee shops with ratings
- **Location:** Browser Geolocation API
- **Maps:** Google Maps integration

## 📊 Database Schema

The app uses a simple SQLite database with coffee shop data:

```sql
coffee_shops (
  id INTEGER PRIMARY KEY,
  name TEXT,
  address TEXT,
  postcode TEXT,
  lat REAL,
  lng REAL,
  borough TEXT,
  rating REAL,
  created_at DATETIME,
  updated_at DATETIME
)
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup` - Initialize database and import data
- `npm run db:reset` - Reset database and reimport data
- `npm run lint` - Run ESLint

## 🗺️ How It Works

1. **Location Detection:** App requests your current location or allows manual input
2. **Distance Selection:** Choose your preferred walking distance (5 or 10 minutes)
3. **Radius Calculation:** Converts walking time to meters (80m/minute average walking speed)
4. **Shop Discovery:** Uses Haversine formula to find coffee shops within radius
5. **Weighted Selection:** Randomly selects a shop with higher-rated shops having better odds
6. **Result Display:** Shows shop details with Google Maps integration

## 📱 Mobile Experience

Brewlette is designed mobile-first with:
- Touch-friendly buttons and controls
- Responsive design that works on all screen sizes
- Fast loading with optimized images and code splitting
- Offline-friendly with local storage for recent discoveries

## 🎯 Future Enhancements

- [ ] Daily spin mode with special recommendations
- [ ] User accounts and favorites
- [ ] Coffee shop reviews and photos
- [ ] Opening hours integration
- [ ] Push notifications for nearby discoveries
- [ ] Social sharing of discoveries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy coffee hunting! ☕** 

*Made with ❤️ for London's coffee lovers*
