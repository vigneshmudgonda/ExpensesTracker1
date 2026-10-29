# Expense Tracker — MERN Stack

A full-stack expense tracking application built with MongoDB, Express.js, React, and Node.js.

## Tech Stack

- React.js and Vite
- Node.js and Express.js
- MongoDB Atlas
- JWT authentication
- Axios
- Tailwind CSS

## Features

- User registration and login
- Protected routes
- Track income and expenses
- View transaction history
- Dashboard with financial summaries
- User profile

## Project Structure

```text
ExpensesTracker1/
├── client/
├── server/
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB Atlas account
- Git and GitHub account

## Local Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ExpensesTracker1
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret
CLIENT_URL=http://localhost:5173
```

Start the backend using the script configured in `server/package.json`:

```bash
npm start
```

### 3. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Start the frontend:

```bash
npm run dev
```

## Deployment

### Frontend — Vercel

1. Import the GitHub repository into Vercel.
2. Set the root directory to `client`.
3. Use the Vite framework preset.
4. Set `VITE_API_URL` to the deployed backend URL ending in `/api`.
5. Deploy the application.

### Backend — Render

1. Create a Web Service using the GitHub repository.
2. Set the root directory to `server`.
3. Set the build command to `npm install`.
4. Set the start command to match the backend entry file.
5. Configure the following environment variables:

   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLIENT_URL` — the deployed frontend URL
6. Deploy the service.

### Database — MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Configure database access and network access securely.
3. Add the connection string as `MONGO_URI` in the backend environment variables.

### Production Checklist

- [ ] No real secrets committed to GitHub.
- [ ] `.env` files are included in `.gitignore`.
- [ ] Vercel's `VITE_API_URL` points to the deployed backend.
- [ ] Backend CORS allows the deployed frontend origin.
- [ ] Cookie authentication works over HTTPS.
- [ ] MongoDB Atlas accepts connections from the backend.
- [ ] Login, registration, logout, profile, and transactions tested after deployment.

## Environment Variables

Never commit real credentials or JWT secrets to the repository. Configure production variables in the hosting providers' environment settings.

## License

Add your chosen license here.
