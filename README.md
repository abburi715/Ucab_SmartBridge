# 🚕 Ucab — Ride Booking Application

A full-stack MERN (MongoDB, Express, React, Node.js) ride-booking web application with Passenger, Driver, and Admin roles.

---

## 🎥 Demo Video

👉 [Click here to watch the demo](https://drive.google.com/file/d/13CmvQdnqDYZKCBsYsbfcjM9_TYPI86wF/view?usp=sharing)

---

## 🚀 Features

- **Passenger** — Register, login, book rides, track rides live, view payment history, download PDF receipts
- **Driver** — Login, accept/decline ride requests, start and complete rides, view earnings
- **Admin** — Manage users, drivers, rides and payments from a dashboard
- **Map Integration** — Leaflet maps with Andhra Pradesh locations, click to set pickup/dropoff
- **Fare Calculator** — Economy ₹6/km, Comfort ₹9/km, Premium ₹14/km
- **PDF Receipts** — Download or email ride receipts
- **Forgot Password** — OTP-based password reset

---

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React.js, Bootstrap 5, Leaflet    |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB (Mongoose)                |
| Auth      | JWT (JSON Web Tokens), bcryptjs   |
| PDF       | PDFKit                            |
| Email     | Nodemailer (Gmail)                |

---

## 📁 Project Structure

```
Ucab/
├── Client/          # React frontend
│   ├── public/
│   └── src/
│       ├── pages/   # All page components
│       ├── components/
│       ├── context/
│       └── api.js
├── Server/          # Node.js backend
│   └── server.js
└── docs/            # Documentation
```

---

## ⚙️ Setup & Run

### Backend
```bash
cd Server
npm install
npm run dev
```

### Frontend
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

## 👤 Default Roles

| Role      | How to Access                        |
|-----------|--------------------------------------|
| Passenger | Register at /register                |
| Driver    | Admin registers driver from dashboard|
| Admin     | Set role to 'admin' in MongoDB       |

---

## 📞 Support

For any issues contact: support@ucab.in

© 2024 Ucab — Andhra Pradesh, India
