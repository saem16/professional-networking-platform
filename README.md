# Professional Network Platform

A modern, full-stack professional networking platform built with React, Node.js, and MongoDB. This project enables professionals to connect, share content, find job opportunities, and build their professional network.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure sign-up/sign-in with JWT tokens
- **Professional Profiles** - Customizable user profiles with skills, experience, and education
- **Social Networking** - Connect with professionals, follow users, and build networks
- **Content Sharing** - Create and share posts with images and documents
- **Job Board** - Browse open positions, apply for jobs, and manage applications
- **Real-time Messaging** - Direct messaging with file attachments
- **Notifications** - Real-time notifications for connections, messages, and activities
- **Search & Discovery** - Find users, jobs, and content across the platform

### User Types
- **Individual Professionals** - Job seekers and networkers
- **Companies** - Post jobs, manage applications, and build company presence
- **Universities** - Educational institution profiles and connections

### Advanced Features
- **Dashboard Analytics** - User engagement and profile statistics
- **Job Management** - Create, edit, and manage job postings (for companies)
- **Application Tracking** - Track job applications and their status
- **File Uploads** - Profile pictures, resumes, and message attachments
- **Real-time Updates** - Socket.IO powered live updates
- **Responsive Design** - Mobile-first, responsive UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **Axios** - HTTP client for API requests
- **Socket.IO Client** - Real-time communication
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Yizus_Project
```

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

**Important**: Replace the MongoDB URI with your own database connection string.

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3000
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
cd backend
npm run dev
```
The backend server will start on `http://localhost:3000`

2. **Start the Frontend Development Server**:
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

### Production Mode

1. **Build the Frontend**:
```bash
cd frontend
npm run build
```

2. **Start the Backend**:
```bash
cd backend
npm start
```

## 📁 Project Structure

```
Yizus_Project/
├── backend/
│   ├── middleware/          # Authentication middleware
│   ├── models/             # MongoDB schemas
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Job.js
│   │   ├── Connection.js
│   │   └── ...
│   ├── routes/             # API routes
│   │   ├── authRoute.js
│   │   ├── postRoute.js
│   │   ├── jobRoute.js
│   │   └── ...
│   ├── services/           # Business logic services
│   ├── uploads/            # File storage
│   ├── utils/              # Utility functions
│   ├── .env               # Environment variables
│   ├── server.js          # Main server file
│   └── package.json
├── frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   ├── .env              # Environment variables
│   ├── vite.config.js    # Vite configuration
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `PORT` - Server port (default: 3000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
- `BACKEND_URL` - Backend URL

#### Frontend (.env)
- `VITE_API_URL` - Backend API URL

### Database Setup

1. **MongoDB Atlas** (Recommended):
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string
   - Replace the `MONGO_URI` in your backend `.env` file

2. **Local MongoDB**:
   - Install MongoDB locally
   - Start MongoDB service
   - Use `mongodb://localhost:27017/mongoDB` as your `MONGO_URI`

## 📱 Key Features Guide

### User Registration & Authentication
- Users can sign up as individuals or companies
- Secure JWT-based authentication
- Profile setup with skills, education, and experience

### Professional Networking
- Send and accept connection requests
- Follow other professionals
- View network statistics and suggestions

### Job Management
- **For Companies**: Create and manage job postings
- **For Professionals**: Browse jobs, apply, and track applications
- Save jobs for later viewing

### Content & Communication
- Create posts with text and media
- Comment and engage with content
- Real-time direct messaging
- File sharing in messages

### Notifications
- Real-time notifications for all activities
- Connection requests, messages, job applications
- Customizable notification preferences

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- File upload validation and size limits
- CORS protection
- Input validation and sanitization
- Secure file storage

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set up environment variables on your hosting platform
2. Deploy the backend code
3. Ensure MongoDB connection is configured

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables
4. Update CORS settings in backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 API Documentation

### Authentication Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `GET /auth/verify` - Verify JWT token

### User Endpoints
- `GET /users/profile/:username` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/search` - Search users

### Job Endpoints
- `GET /jobs` - Get all jobs
- `POST /jobs` - Create job (companies only)
- `GET /jobs/:id` - Get job details
- `POST /jobs/:id/apply` - Apply for job

### Social Endpoints
- `POST /connection/request` - Send connection request
- `POST /connection/accept` - Accept connection
- `GET /connection/suggestions` - Get connection suggestions

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Check your MongoDB URI
   - Ensure network access is configured in MongoDB Atlas
   - Verify username/password

2. **CORS Errors**:
   - Check `FRONTEND_URL` in backend `.env`
   - Ensure frontend is running on the correct port

3. **File Upload Issues**:
   - Check file size limits (10MB max)
   - Ensure uploads directory has write permissions

4. **Socket.IO Connection Issues**:
   - Verify both frontend and backend are running
   - Check for firewall blocking WebSocket connections
