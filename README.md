### Expense Tracker – MERN Stack Web Application
# 1. Introduction
The Expense Tracker is a full-stack web application developed using the MERN stack (MongoDB, Express.js, React.js, and Node.js).
The main purpose of this project is to help users manage their personal finances by recording income and expenses, monitoring their financial balance, and viewing transaction summaries.
The application provides an interactive dashboard where users can track their financial activities, manage transactions, and analyze their spending patterns.
Live Demo: https://expenses-tracker1-xi.vercel.app/
# 2. Objectives of the Project
To provide an easy-to-use platform for managing personal finances.
To record and manage income and expenses.
To calculate total income, total expenses, and available balance.
To help users understand their spending habits.
To display financial information using charts and summaries.
To provide secure user authentication and protected pages.
## 3. Technology Stack
Technology
Purpose
React.js
Building the user interface
Node.js
Backend runtime environment
Express.js
Creating REST APIs
MongoDB
Storing user and transaction data
Mongoose
MongoDB object modeling
JavaScript
Application logic
Tailwind CSS
Styling and responsive design
Axios
Sending HTTP requests
React Router
Navigation between pages
JWT
User authentication
bcrypt
Password hashing
Recharts
Displaying financial charts
Vercel
Frontend deployment
Render
Backend deployment

# Why the MERN Stack?
The MERN stack was selected because:
It uses JavaScript for both frontend and backend development.
React provides reusable components and a dynamic user interface.
Node.js and Express.js make it possible to build REST APIs.
MongoDB provides flexible document-based data storage.
It supports full-stack development and scalable application architecture.
# 4. Use Cases
User
Register a new account.
Log in using registered credentials.
Access a personalized dashboard.
View total income and expenses.
Check the available balance.
Add new income or expense transactions.
View transaction history.
Filter transactions by date, category, and type.
Delete transactions.
View financial information through charts.
Access the profile page.
Log out securely.
# 5. Research and Problem Analysis
Problem Statement
Many individuals find it difficult to maintain records of their daily income and expenses. Manual tracking using notebooks or spreadsheets can become inconvenient and make it difficult to understand overall spending patterns.
Proposed Solution
The Expense Tracker provides a centralized digital platform where users can record financial transactions and monitor their financial activities.
Research and Analysis
The project was planned around the following requirements:
Data management: Store financial transactions in a database.
Authentication: Allow users to access their own accounts.
Financial calculations: Calculate income, expenses, and balance.
Transaction management: Provide options to view, add, and delete transactions.
Data visualization: Use charts to make financial summaries easier to understand.
Accessibility: Make the application accessible through a web browser.


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

# 7. Complete Working of the Project
Step 1: User Registration
A new user enters the required details on the registration page. The frontend sends the information to the backend through an API request.
The backend validates the information, hashes the password, and stores the user details in MongoDB.
Step 2: User Login
The user enters their login credentials.
The backend verifies the credentials and generates a JWT authentication token. The token is stored in an HTTP-only cookie for authenticated requests.
Step 3: Protected Routes
The application uses React Router and authentication context to control access to protected pages.
If the user is not authenticated, the application redirects them to the login page.
Step 4: Dashboard
After login, the user can access the dashboard.
The frontend requests transaction data from the backend. The application calculates financial summaries and displays relevant information.
Step 5: Add Transactions
The user records a transaction by providing details such as:
Transaction title
Amount
Transaction type (income or expense)
Category
Date
The frontend sends the transaction details to the backend API. The backend stores the transaction in MongoDB.
Step 6: View and Filter Transactions
The application retrieves the user's transactions from the database.
Users can filter the records based on date, category, and transaction type.
Step 7: Delete Transactions
When a user deletes a transaction, the frontend sends a DELETE request to the backend. The backend removes the corresponding record from MongoDB.
Step 8: Data Visualization
The application uses Recharts to display financial data through visual charts, helping users understand their income and spending patterns.
Step 9: Logout
When the user logs out, the backend clears the authentication cookie and the application redirects the user to the login page.
## 8. System Architecture
The application follows a client-server architecture.
Frontend (React.js)
Displays the user interface.
Handles navigation and forms.
Sends API requests using Axios.
Displays transaction records and charts.
Backend (Node.js + Express.js)
Handles API requests.
Manages authentication.
Performs transaction operations.
Communicates with MongoDB.
Database (MongoDB)
Stores user information.
Stores transaction records.
Maintains application data.
Application Flow
User → React Frontend → Axios API Request → Express.js Backend → MongoDB Database
The response is returned to the frontend and displayed to the user.
## 9. Deployment
The project is deployed using cloud hosting platforms.
Component
Platform
Frontend
Vercel
Backend
Render
Database
MongoDB Atlas (if used for the deployed database)

## Live Application: https://expenses-tracker1-xi.vercel.app/
# 10. Conclusion
The Expense Tracker project demonstrates the practical implementation of full-stack web development using the MERN stack.
It provides a simple and interactive solution for managing personal income and expenses. Through authentication, transaction management, financial summaries, filtering, and data visualization, users can monitor their financial activities more effectively.
Developing this project helped demonstrate practical knowledge of React.js, Node.js, Express.js, MongoDB, REST API development, authentication, and cloud deployment.
The project can be further enhanced by adding monthly budgets, downloadable financial reports, recurring transactions, and advanced financial analytics.
11. Future Enhancements
Monthly and yearly financial reports.
Export transactions to PDF or Excel.
Monthly budget management.
Recurring income and expense tracking.
Advanced spending analytics.
Improved mobile responsiveness.
Notifications for budget limits.

Developed as a Full Stack MERN Stack Project.



## License

Add your chosen license here.
