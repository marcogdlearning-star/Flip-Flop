# FlipFlop Gaming Platform

A gas-free gaming platform featuring Rock-Paper-Scissors with provable fairness, powered by proprietary in-game tokens and Chainlink VRF.

## 🎮 Features

- **Gas-Free Gaming**: All gameplay uses proprietary tokens managed off-chain
- **Provable Fairness**: Chainlink VRF ensures unpredictable, verifiable outcomes
- **Multiple Game Modes**: Play vs House, Internet multiplayer, NFC proximity, Tournaments
- **Real-Time Multiplayer**: Socket.IO powered real-time gaming
- **Tournament System**: Competitive play with prize pools
- **Referral Program**: Earn rewards by inviting friends
- **Upgradeable Contracts**: Future-ready smart contracts on Base

## 🏗️ Architecture

### Smart Contracts (On-Chain Verification)
- **FlipFlopToken**: ERC20 token for future launch
- **UserRegistry**: Player profiles and statistics
- **RandomnessManager**: Chainlink VRF integration
- **GameVerification**: Cryptographic proof of game outcomes
- **TournamentManager**: Tournament prize distribution

### Backend (Token Management)
- **Proprietary Tokens**: Database-managed balances
- **Game Logic**: Rock-Paper-Scissors engine
- **Real-Time Communication**: Socket.IO for multiplayer
- **API**: RESTful endpoints for all operations

### Frontend (User Interface)
- **React**: Modern web application
- **Wallet Integration**: MetaMask, Coinbase Wallet
- **Real-Time Updates**: Live game state and chat

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Hardhat
- SQLite (default) or PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/flipflop.git
   cd flipflop
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Deploy Smart Contracts**
   ```bash
   npx hardhat compile
   npm run deploy
   ```

5. **Start the Backend**
   ```bash
   cd server
   npm run dev
   ```

6. **Start the Frontend**
   ```bash
   cd client
   npm start
   ```

## 🎯 Game Modes

### 1. Play vs House
- **Description**: Classic Rock-Paper-Scissors against the house
- **Wager**: 1-1000 tokens
- **Payout**: 2x wager minus 2% house edge
- **Fairness**: Chainlink VRF + commitment scheme

### 2. Internet Mode
- **Description**: Real-time multiplayer Rock-Paper-Scissors
- **Entry**: Free or paid entry
- **Winner**: Best of 3 rounds
- **Prize**: Split pot among winners

### 3. NFC Mode
- **Description**: Proximity-based gaming using NFC
- **Hardware**: NFC-enabled devices
- **Winner**: Single round Rock-Paper-Scissors
- **Prize**: Configurable rewards

### 4. Tournament Mode
- **Description**: Competitive tournaments with brackets
- **Entry Fee**: Paid entry creates prize pool
- **Format**: Single elimination or round-robin
- **Prizes**: House contribution + entry fees

## 🔐 API Documentation

### Authentication
```bash
POST /api/users/register
POST /api/users/login
GET  /api/users/me
```

### Games
```bash
GET    /api/games              # Game history
GET    /api/games/:id          # Game details
POST   /api/games/play-house   # Start house game
POST   /api/games/:id/reveal   # Reveal and complete game
GET    /api/games/stats/summary # User statistics
GET    /api/games/leaderboard/global # Global leaderboard
```

### Tournaments
```bash
GET    /api/tournaments        # Available tournaments
POST   /api/tournaments        # Create tournament
POST   /api/tournaments/:id/join # Join tournament
GET    /api/tournaments/:id    # Tournament details
```

## 🎲 Game Flow (Gas-Free)

### Play vs House:
```
1. Player commits move + wager (off-chain)
2. Backend validates balance (database)
3. Backend requests randomness (on-chain)
4. Contract generates house move (VRF)
5. Backend calculates winner (off-chain)
6. Backend settles instantly (database)
```

### Key Benefits:
- ✅ **Zero Gas Fees**: Players never pay blockchain fees
- ✅ **Instant Results**: No transaction confirmations
- ✅ **Provable Fairness**: On-chain randomness verification
- ✅ **Scalable**: Thousands of games per minute

## 🔧 Configuration

### Environment Variables
```env
# Server
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key

# Database
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Blockchain
NETWORK=baseTestnet
PRIVATE_KEY=your-private-key

# Game Settings
HOUSE_EDGE_BASIS_POINTS=200
MAX_WAGER=1000
MIN_WAGER=1
```

### Smart Contract Deployment
```bash
# Local development
npx hardhat run scripts/deploy.js --network localhost

# Base Testnet
npx hardhat run scripts/deploy.js --network baseTestnet

# Base Mainnet
npx hardhat run scripts/deploy.js --network base
```

## 🧪 Testing

### Run Tests
```bash
# Smart contracts
npx hardhat test

# Backend (when implemented)
cd server && npm test

# Frontend (when implemented)
cd client && npm test
```

### Local Development
```bash
# Start local blockchain
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Start backend with local contracts
cd server && npm run dev

# Start frontend
cd client && npm start
```

## 📊 Database Schema

### Users
- User profiles, balances, statistics
- Referral relationships
- Game history aggregation

### Games
- Game sessions and outcomes
- Commitment/reveal data
- Blockchain verification status

### Tournaments
- Tournament configuration
- Participant management
- Prize distribution tracking

## 🔒 Security Features

- **Cryptographic Commitments**: Prevent move manipulation
- **Chainlink VRF**: Provably fair randomness
- **Rate Limiting**: Prevent spam and abuse
- **Input Validation**: Comprehensive data validation
- **Anti-Cheat**: Commitment reveal windows

## 🚀 Smart Contract Deployment

### Prerequisites
- ✅ **Private Key**: Wallet with Base Sepolia ETH for gas fees
- ✅ **VRF Subscription**: Chainlink VRF subscription on Base Sepolia
- ✅ **Etherscan API Key**: For contract verification

### Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your values
# PRIVATE_KEY=your-private-key-without-0x-prefix
# ETHERSCAN_API_KEY=your-etherscan-api-key
# VRF_SUBSCRIPTION_ID=your-vrf-subscription-id
```

### Create VRF Subscription
1. Visit [Chainlink VRF](https://vrf.chain.link/base-sepolia)
2. Connect wallet and create subscription
3. Fund subscription with LINK tokens
4. Copy subscription ID to `.env`

### Deploy Contracts
```bash
# Compile contracts
npm run compile

# Deploy to Base Sepolia
npm run deploy

# Verify contracts on Etherscan
npm run verify
```

### Deployment Output
After successful deployment, you'll see:
- 📋 **Contract Addresses**: All deployed contract addresses
- 💾 **deployment.json**: Saved deployment information
- 🔗 **Explorer Links**: Direct links to view contracts

### Contract Verification
Contracts are automatically verified on Base Sepolia explorer, making source code publicly available for transparency and trust.

### Troubleshooting
- **No ETH**: Fund your wallet with Base Sepolia ETH
- **Invalid VRF Subscription**: Ensure subscription exists and has LINK
- **Verification Failed**: Check Etherscan API key and try manual verification

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database backup strategy
- [ ] SSL certificates
- [ ] Monitoring and logging
- [ ] Load balancer configuration
- [ ] CDN for static assets

### Scaling Considerations
- **Database**: PostgreSQL for production
- **Caching**: Redis for session and game state
- **Load Balancing**: Multiple backend instances
- **CDN**: Static asset delivery
- **Monitoring**: Comprehensive logging and alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Discord**: Join our community
- **Email**: support@flipflop.game

---

**Built with ❤️ for the meme coin revolution**
