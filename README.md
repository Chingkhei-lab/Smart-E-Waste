website: https://smart-e-waste.vercel.app/
# Smart E-Waste Recycling App (EcoBin)

A gamified, AI-powered mobile web application designed to revolutionize how we recycle electronic waste. By combining object recognition, location services, and gamification, we make e-waste recycling engaging, rewarding, and impactful.

## Key Features

### AI-Powered Scanning
- **Instant Recognition**: Powered by **TensorFlow.js** and the **Coco-SSD** object detection model, the app accurately identifies electronic devices (phones, laptops, accessories) directly in your browser without uploading images to a server.
- **Value Estimation**: Get real-time estimates of points and monetary value for your e-waste based on the detected device type.

### Gamification & Rewards
- **Points System**: Earn 'Green Points' for every recycled item.
- **Daily Challenges**: Complete missions like "Scan 1 device today" or "Recycle 5kg this week" to earn bonus rewards.
- **Leveling Up**: Unlock badges and new tiers (Eco Rookie to Eco Warrior) as you progress.

### Impact Dashboard
- **Visual Analytics**: Interactive charts showing your environmental contribution.
- **Real-world Impact**: Track CO2 emissions saved, trees planted equivalent, and water conserved.
- **Peer Comparison**: See how your recycling habits compare to the average user.

### Community Leaderboard
- **Weekly Competitions**: Compete for top spots to win massive point bonuses (up to +750 pts/week).
- **Global Rankings**: View top recyclers by points or items saved.
- **Podium Support**: Celebrate the top 3 recyclers with special animations and badges.

### Smart Bin Locator
- **Interactive Map**: Find the nearest authorized e-waste collection bins.
- **Navigation**: Get directions to approved disposal facilities.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: Zustand (with persistence)
- **AI/ML**: TensorFlow.js, Coco-SSD
- **Visualization**: Recharts
- **Maps**: React-Leaflet
- **UI Components**: Shadcn UI

## Mobile-First Design
The application is built with a responsive, mobile-first approach, featuring touch-optimized gestures (like pull-to-refresh), smooth transitions, and a layout designed for handheld use.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-ewaste.git
   cd smart-ewaste
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
