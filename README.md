# User Service

This is a NestJS application that can be run either **locally** or using **Docker**.

---

## 🚀 Running the Application

### 🔹 Run Locally

Install dependencies:

```bash
yarn install
# or
npm install
```

Start the development server:

```bash
yarn start:dev
# or
npm run start:dev
```

The app will be available at:
👉 http://localhost:3000

### 🔹 Run with Docker

Build and start the containers:

```bash
docker compose up --build -d
```

Stop containers:

```bash
docker compose down
```

## ⚙️ Environment Variables

Create a .env file in the project root for local development:

```bash
# Application
PORT=3000

# Database (local)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=<your_username>
DB_PASSWORD=<your_password>
DB_NAME=user

# Authentication
JWT_SECRET=<jwt_secret>
JWT_EXPIRE=1h
REFRESH_TOKEN_SECRET=<refresh_token_secret>
REFRESH_TOKEN_EXPIRE=30d
```

For Docker setup, create a .env.docker file:

```bash
# Application
DB_HOST=db
DB_PORT=5432
DB_USERNAME=<your_username>
DB_PASSWORD=<your_password>
DB_NAME=user
```

## ✅ Notes

Ensure you have Docker & Docker Compose installed for containerized setup.

When using Docker, your database service should be named db in docker-compose.yml (as referenced in .env.docker).
