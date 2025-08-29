# Manulife Investment Portfolio Application

A full-stack investment portfolio management application built with Next.js, FastAPI, and PostgreSQL, featuring real-time market data integration with Alpha Vantage API.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with secure password hashing
- **Portfolio Management** - Add, edit, and delete investments with comprehensive tracking
- **Real-time Market Data** - Live stock prices and market data with intelligent rate limiting
- **Transaction History** - Complete transaction tracking with buy/sell records
- **Interactive Dashboard** - Portfolio overview with charts and performance metrics
- **Responsive Design** - Modern UI built with Tailwind CSS
- **RESTful API** - FastAPI backend with automatic OpenAPI documentation

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL with custom enums and relationships
- **Market Data**: Alpha Vantage API with intelligent rate limiting and caching
- **Charts**: Recharts for portfolio visualization
- **Authentication**: JWT tokens with bcrypt password hashing

## 📋 Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Node.js 18+ and Python 3.11+ for local development

## 🐳 Quick Start with Docker

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Manulife_test
```

### 2. Environment Setup
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
# At minimum, change the SECRET_KEY for production
```

### 3. Run with Docker Compose

**Development Mode:**
```bash
docker-compose up -d
```

**Production Mode:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database Admin**: http://localhost:8080 (Adminer)

## 🔐 Default Credentials

For testing purposes, a default user is created:
- **Username**: testuser
- **Password**: secret
- **Email**: test@example.com

## 🌐 Market Data Integration

The application integrates with Alpha Vantage API for real-time market data:

### Features:
- Real-time stock quotes with 15-second rate limiting
- Intelligent caching to reduce API calls (1-minute cache duration)
- Demo data fallback when API limits are reached
- Support for stocks, ETFs, and major market indices

### Rate Limiting:
- Maximum 5 calls per minute (Alpha Vantage free tier)
- 15-second delays between API calls to prevent quota exhaustion
- Automatic fallback to realistic demo data when limits exceeded
- Visual indicators when demo data is being used

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Investments
- `GET /investments/` - List user's investments
- `POST /investments/` - Add new investment
- `PUT /investments/{id}` - Update investment
- `DELETE /investments/{id}` - Delete investment

### Transactions
- `GET /transactions/` - List user's transactions
- `POST /transactions/` - Add new transaction
- `PUT /transactions/{id}` - Update transaction
- `DELETE /transactions/{id}` - Delete transaction

### Portfolio
- `GET /portfolio/summary` - Portfolio summary with metrics
- `GET /portfolio/performance` - Portfolio performance data

## 🚀 Production Deployment

### Environment Variables
For production, ensure you set:
```bash
SECRET_KEY=<strong-random-key>
POSTGRES_PASSWORD=<secure-password>
ALPHA_VANTAGE_API_KEY=<your-api-key>
```

### Security Considerations
- Change default database credentials
- Use a strong SECRET_KEY (32+ characters)
- Enable HTTPS in production
- Implement proper logging and monitoring
- Regular security updates

## 📁 Project Structure

```
Manulife_test/
├── backend/
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API route handlers
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── database.py     # Database configuration
│   │   └── main.py         # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   └── init.sql           # Database initialization
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── lib/          # Utility functions including market data API
│   │   └── types/        # TypeScript types
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
├── .env.example          # Environment variables template
└── README.md
```

## 🔧 Troubleshooting

### Common Issues

1. **API Rate Limiting**
   - The app automatically handles Alpha Vantage rate limits
   - Demo data is used when limits are exceeded
   - Check console for rate limiting messages
   - Look for "Demo" badges on price components

2. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker ps
   
   # View logs
   docker logs manulife_postgres
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :8000
   
   # Kill the process
   kill -9 <PID>
   ```

## 🧪 Key Features Implemented

### Enhanced Rate Limiting System
- **Intelligent API Management**: 15-second delays between Alpha Vantage API calls
- **Caching Layer**: 1-minute cache for repeated quote requests
- **Graceful Degradation**: Automatic fallback to realistic demo data
- **Visual Feedback**: Demo data indicators in the UI

### Real-time Price Components
- **Live Updates**: Automatic price refreshing every 30 seconds
- **Error Handling**: Comprehensive error management with fallbacks
- **Loading States**: Smooth loading indicators
- **Performance Optimized**: Cached requests and rate limiting

### Portfolio Dashboard
- **Market Overview**: Major indices and popular stocks
- **Investment Cards**: Interactive cards with live price data
- **Performance Charts**: Portfolio visualization with Recharts
- **Transaction Management**: Complete CRUD operations

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
