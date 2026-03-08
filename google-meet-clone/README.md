<h1 align="center">
  <img src="https://www.gstatic.com/meet/google_meet_chrome_extension_icon_192_2x_d9b23b49.png" alt="Google Meet Clone Logo" width="80" height="80">
  <br>
  Google Meet Clone
</h1>

<p align="center">
  <strong>A full-stack, real-time video conferencing application inspired by Google Meet.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#docker-deployment">Docker</a> •
  <a href="#testing">Testing</a>
</p>

<hr>

## ✨ Features

- **🔐 User Authentication**: Secure login and registration using JSON Web Tokens (JWT) and bcrypt password hashing.
- **🎥 WebRTC Video/Audio Calls**: Real-time peer-to-peer media streaming using `simple-peer`.
- **🖥️ Screen Sharing**: Instantly share your presentation or application window with the room using the native browser `getDisplayMedia` API.
- **💬 Real-Time In-Call Chat**: Exchange messages instantly with other connected peers without leaving the room.
- **🔴 Meeting Recording**: Capture meetings locally within your browser and instantly download them as `.webm` files.
- **📱 Responsive UI Grid**: Dynamic participant video grid that mimics Google Meet, adapting layout seamlessly when the chat sidebar opens.

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite)
- **React Router v6** for client-side routing
- **Lucide React** for beautiful SVG icons
- **Simple-Peer** for WebRTC signaling abstraction
- **Socket.io-client** for real-time WebSocket communication

### Backend
- **Node.js & Express** for REST APIs
- **MongoDB** (Mongoose) for modeling Users and Meeting records
- **Socket.io** for real-time room orchestration and chat
- **JSON Web Tokens (JWT)** for route protection

### DevOps & Testing
- **Docker & Docker Compose** for containerization
- **Jest & Supertest** for backend API testing
- **Cypress** for frontend End-to-End (E2E) testing

## 🚀 Getting Started

To run this application locally without Docker, follow these steps:

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `localhost:27017`

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/yourusername/google-meet-clone.git
cd google-meet-clone

# Install dependencies for both Frontend and Backend
npm run install-all
```

### 2. Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/google-meet-clone
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Start Development Servers
Run the concurrent start script from the **root** directory:
```bash
npm run dev
```
- The React Frontend will be available at `http://localhost:3000`
- The Express API/Socket Server will be available at `http://localhost:5000`

## 🐳 Docker Deployment

The fastest way to spin up the entire stack (MongoDB + Backend + Nginx Frontend) is using Docker Compose.

Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

```bash
# Build and run the containers in the background
docker-compose up --build -d
```

- App runs at: `http://localhost:3000`
- View logs: `docker-compose logs -f`
- Shut down: `docker-compose down`

## 🧪 Testing

### Backend API Tests
Backend tests are written with **Jest** and **Supertest** using an in-memory test database.
```bash
cd backend
npm test
```

### Frontend E2E Tests
Frontend flows (Meeting joining, Room generation) are tested visually via **Cypress**.
```bash
# Ensure both dev servers are running first (npm run dev)
cd frontend
npx cypress open
```

## 📈 Scalability Optimizations

If you are planning to deploy this to production for thousands of users, please see the [OPTIMIZATIONS.md](OPTIMIZATIONS.md) file for critical architectural shifts (e.g., Redis, SFUs, and TURN servers).

---

<p align="center">Built with ❤️ using the MERN Stack and WebRTC.</p>
