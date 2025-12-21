# TutorsOnHenry v1.2

A full-stack Node.js application for managing tutoring services, featuring user authentication, order management, and file uploads.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)

## Features

- User authentication and session management
- User profile management
- Order placement and tracking
- File upload support
- Secure password hashing with bcrypt
- MongoDB database integration

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Templating**: Nunjucks
- **Session Management**: express-session with MongoDB store
- **File Upload**: Multer
- **Security**: bcrypt for password hashing
- **Development**: Nodemon for auto-reload

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sameduTM/tutorsonhenry-v1.2.git
cd tutorsonhenry-v1.2
```

2. Install dependencies:
```bash
npm install
```

## Setup

1. Create a `.env` file in the project root with the following variables:
```env
PORT=3000
SESSION_SECRET=your_session_secret_here
MONGODB_URI=your_mongodb_connection_string
```

2. Ensure MongoDB is running and accessible

## Running the Application

Start the development server:
```bash
npm start
```

The server will run on `http://localhost:3000` (or your configured PORT)

## Project Structure

```
├── config/              # Database configuration
├── controllers/         # Request handlers
├── middlewares/         # Custom middleware (file uploads)
├── models/             # Mongoose schemas (User, Orders)
├── routes/             # API route definitions
├── services/           # Business logic
├── uploads/            # Uploaded files directory
├── views/              # HTML templates and static files
├── server.js           # Main application entry point
└── package.json        # Project dependencies
```

## API Routes

### User Routes (`/routes/userRoute.js`)
- User profile and management endpoints

### Auth Routes (`/routes/authRoute.js`)
- Authentication endpoints (login, sign-up, logout)

### Order Routes (`/routes/orderRoute.js`)
- Order placement and tracking endpoints

## License

ISC