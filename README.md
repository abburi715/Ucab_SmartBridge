# 🚕 Ucab — Ride Booking Application

> A full-stack MERN web application for booking rides online with real-time tracking, fare calculation, PDF receipts and role-based dashboards for Passengers, Drivers and Admins.

![Made with React](https://img.shields.io/badge/Frontend-React.js-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)

---

## 🎥 Demo Video

👉 [Click here to watch the full demo](https://drive.google.com/file/d/13CmvQdnqDYZKCBsYsbfcjM9_TYPI86wF/view?usp=sharing)

---

## 🚀 Features

### 👤 Passenger
- Register and login securely
- Book rides using interactive Leaflet map
- Select pickup and dropoff by clicking on map
- View fare estimate before booking
- Track ride status live (auto-refreshes every 3 seconds)
- View complete ride history
- Download PDF receipt after ride
- Email receipt to registered email
- OTP-based forgot password

### 🚗 Driver
- Login to dedicated driver dashboard
- View incoming ride requests in real time
- Accept or decline ride requests
- Start and complete rides
- View total earnings and completed rides

### 🛠 Admin
- View and delete all registered users
- Register and verify drivers
- View all rides with status
- View all payments and total revenue
- Full dashboard with stats overview

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Bootstrap 5, Leaflet Maps |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| PDF Generation | PDFKit |
| Email | Nodemailer (Gmail) |
| Maps | Leaflet, OpenStreetMap, Nominatim |

---

## 💰 Fare Structure

| Cab Type | Rate |
|----------|------|
| 🚗 Economy | ₹6 per km |
| 🚙 Comfort | ₹9 per km |
| 🏎️ Premium | ₹14 per km |

---

## 📁 Project Structure

```
Ucab/
├── Client/                  # React Frontend
│   ├── public/
│   └── src/
│       ├── pages/           # All page components
│       ├── components/      # Navbar, PrivateRoute
│       ├── context/         # AuthContext
│       ├── api.js           # Axios instance
│       ├── App.js           # Routes
│       └── index.js         # Entry point
├── Server/                  # Node.js Backend
│   ├── server.js            # All backend code
│   └── .env                 # Environment variables
├── docs/                    # Documentation
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB v6+
- npm v9+

### Step 1 — Clone Repository
```bash
git clone https://github.com/your-username/Ucab.git
cd Ucab
```

### Step 2 — Setup Backend
```bash
cd Server
npm install
npm run dev
```

### Step 3 — Setup Frontend
```bash
cd Client
npm install
npm start
```

### Environment Variables

**Server/.env**
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**Client/.env**
```
DISABLE_ESLINT_PLUGIN=true
```

---

## 🌐 Running the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Database | mongodb://localhost:27017/ucab |

---

## 👤 User Roles

| Role | Access | How to Get |
|------|--------|-----------|
| Passenger | Book rides, track, payments | Register at /register |
| Driver | Accept rides, earnings | Admin registers from dashboard |
| Admin | Full control | Set role to 'admin' in MongoDB |

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| POST | /api/rides/book | Book a ride |
| GET | /api/rides/estimate | Get fare estimate |
| GET | /api/rides/history | Ride history |
| PUT | /api/rides/:id/accept | Accept ride |
| GET | /api/payments | Payment history |
| GET | /api/payments/:id/download | Download PDF |

---

## 👨‍💻 Team

| Name | 
|------|------|
| A. Ramakrishna
| B. Sasi Kumar 
| A. Prasad 
| K. Nagarjuna Reddy 

**Institution:** Seshadri Rao Gudlavalleru Engineering College
**Batch:** 2023 — 2027

---

## 📞 Support

For any issues contact: support@ucab.in

---

© 2026 Ucab — Andhra Pradesh, India
