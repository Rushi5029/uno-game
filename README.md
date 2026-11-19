# 🎴 Multiplayer UNO! Online (MERN Stack)

A real-time, online multiplayer **UNO Card Game** built with the **MERN Stack** (MongoDB, Express, React, Node.js) and **Socket.io**. Supports **2 to 10 players** simultaneously (perfect for 5–6 friends), featuring official card rules, username-only login, custom profiles, real-time chat, animated emoji reactions, and a Top 10 Leaderboard with exclusive rank badges.

---

## 🌟 Key Features

### 1. Official 108-Card UNO Rules
- **4 Colors**: Red, Yellow, Green, Blue
- **Numbers (76 cards)**: One `0` card per color, two of each `1–9` per color
- **Action Cards (24 cards)**:
  - 🚫 **Skip**: Next player loses their turn.
  - 🔄 **Reverse**: Changes turn direction (in 2-player mode, acts like a Skip).
  - 💥 **Draw Two (+2)**: Next player draws 2 cards and skips their turn.
- **Wild Cards (8 cards)**:
  - 🌈 **Wild**: Play on any card and choose the active color.
  - 🚀 **Wild Draw Four (+4)**: Choose active color and force next player to draw 4 cards and skip turn.
- **Starting Hand**: 7 cards dealt to each player.
- **Uno Calling & Catching**:
  - When you have 1 card remaining, yell **"UNO!"**!
  - If you forget to yell UNO, any opponent can click **"Catch UNO!"** to penalize you with 2 extra cards!
- **Victory Condition**: First player to empty their hand wins with confetti and victory music!

### 2. Passwordless Username Login
- Just enter a username (no password hassle) so your friends can instantly jump in!
- Remembers your identity in `localStorage`.

### 3. Profile Section & Custom Profile Pictures
- Choose from 8 custom animal/character avatars or paste your own custom profile image URL.
- Live stats: **Total Games Played**, **Wins**, **Losses**, and **Win Rate %**.

### 4. Top 10 Leaderboard & Custom Top-3 Badges
- Dynamic leaderboard ranking players by wins, matches played, and win percentage.
- **1st Rank Badge**: Shining Gold Crown & `1st Rank` badge rendered directly on top of the username.
- **2nd Rank Badge**: Silver Medal & `2nd Rank` badge.
- **3rd Rank Badge**: Bronze Medal & `3rd Rank` badge.
- Badges appear in the Leaderboard, Game Waiting Room, Navigation Bar, and In-Game Seating Area!

### 5. Seamless Multiplayer (2 to 10 Players)
- Easily share a **4-letter Room Code** (e.g. `ABCD`) or one-click invite link with your friends.
- AI Bot support: Host can add bots to test or fill up player seats anytime!
- In-game real-time chat and floating emoji reactions (`🔥`, `😂`, `👑`, `😱`, `💥`, `🃏`).

---

## 🚀 How to Run the Project Locally

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Optional: the app automatically uses local fallback storage if MongoDB is not running, so it works out-of-the-box!)

### Steps:

1. **Open Terminal / PowerShell** in the project directory:
   ```bash
   cd d:\uno-game
   ```

2. **Install all dependencies** (for both server and client):
   ```bash
   npm run install:all
   ```

3. **Build the client**:
   ```bash
   npm run build:client
   ```

4. **Start the game server**:
   ```bash
   npm start
   ```

5. **Open in your browser**:
   Navigate to [http://localhost:5000](http://localhost:5000).

> 💡 **Testing Multiplayer on your own computer**:
> Open [http://localhost:5000](http://localhost:5000) in one browser tab, create a room, copy the 4-letter room code, then open another tab (or Incognito window) and join with a different username!

---

## 🌐 How to Deploy Online (Free) So You & Your Friends Can Play Anywhere

You can deploy the game online for free in less than 5 minutes using **Render.com** (or Railway) and **MongoDB Atlas**.

### Step 1: Set up Free MongoDB Atlas (Cloud Database)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Create a free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user (e.g., username: `unoadmin`, password: `yourpassword123`).
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** -> **Drivers** and copy your connection string:
   ```
   mongodb+srv://unoadmin:<password>@cluster0.mongodb.net/uno_game?retryWrites=true&w=majority
   ```

### Step 2: Push Your Code to GitHub
1. Initialize git and commit:
   ```bash
   cd d:\uno-game
   git init
   git add .
   git commit -m "Initial commit for UNO online game"
   ```
2. Create a new repository on [GitHub](https://github.com) and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/uno-online.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy on Render.com (Free)
1. Sign up / Log in to [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository (`uno-online`).
4. Configure the settings:
   - **Name**: `my-uno-game`
   - **Environment**: `Node`
   - **Build Command**: `npm run install:all && npm run build:client`
   - **Start Command**: `node server/server.js`
5. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `MONGODB_URI`: (Paste your MongoDB Atlas connection string from Step 1)
6. Click **Deploy Web Service**!
7. Render will provide a live URL (e.g. `https://my-uno-game.onrender.com`).
   Share this link with your friends and start playing together instantly!

---

## 📁 Project Structure

```
d:\uno-game/
├── server/
│   ├── config/
│   │   └── db.js            # Dual-mode MongoDB connection & JSON fallback storage
│   ├── models/
│   │   ├── User.js          # User schema (stats, avatar, wins, losses, score)
│   │   └── GameHistory.js   # Game logs & round results
│   ├── game/
│   │   ├── deck.js          # Official 108 UNO card deck generation & Fisher-Yates shuffle
│   │   ├── unoEngine.js     # Full UNO gameplay rules, action cards, wild cards, uno challenges
│   │   └── roomManager.js   # Room codes, player rosters, and in-game chat storage
│   ├── routes/
│   │   ├── authRoutes.js    # Passwordless username login & profile endpoints
│   │   └── leaderboardRoutes.js # Top 10 champions with 1st, 2nd, and 3rd rank badges
│   ├── sockets/
│   │   └── socketHandler.js # Real-time multiplayer Socket.io events
│   ├── server.js            # Express & Socket.io server entry point
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Top navigation, sound toggle, rules, leaderboard, profile pill
│   │   │   ├── LoginModal.jsx   # Username login and avatar picker
│   │   │   ├── ProfileModal.jsx # Avatar selector, custom image URL, and stats viewer
│   │   │   ├── Leaderboard.jsx  # Top 10 ranking table + Top 3 podium & shiny badges
│   │   │   ├── RankBadge.jsx    # 1st (Gold Crown), 2nd (Silver), 3rd (Bronze) badges
│   │   │   ├── Lobby.jsx        # Room creation (2-10 players) & room code entry
│   │   │   ├── GameRoom.jsx     # Main arena: radial seating, draw pile, discard pile, turn halos
│   │   │   ├── Card.jsx         # 3D-styled SVG/CSS UNO cards with official colors & actions
│   │   │   ├── ColorPicker.jsx  # 4-color modal for Wild cards
│   │   │   ├── UnoControls.jsx  # Yell UNO! button, Catch UNO! challenge button, draw/pass
│   │   │   ├── ChatDrawer.jsx   # Real-time game chat & floating emoji reactions
│   │   │   └── WinnerModal.jsx  # Victory celebration with confetti & play again
│   │   ├── utils/
│   │   │   ├── avatars.js       # Avatar definitions & custom image parser
│   │   │   └── soundEffects.js  # Zero-dependency procedural Web Audio sound effects
│   │   ├── App.jsx              # Main React state router
│   │   └── index.css            # Tailwind CSS styling & animations
│   └── package.json
└── README.md
```
