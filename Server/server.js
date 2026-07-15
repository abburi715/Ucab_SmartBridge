const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── MODELS ───────────────────────────────────────────────────────────────────

const User = mongoose.model('User', new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  phone:        { type: String },
  role:         { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
  savedPayment: { type: String, default: '' },
}, { timestamps: true }));

const Driver = mongoose.model('Driver', new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  phone:         { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  cabType:       { type: String, enum: ['economy', 'comfort', 'premium'], default: 'economy' },
  isAvailable:   { type: Boolean, default: true },
  isVerified:    { type: Boolean, default: false },
  location:      { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
  rating:        { type: Number, default: 4.5 },
}, { timestamps: true }));

const Ride = mongoose.model('Ride', new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickup:  { type: String, required: true },
  dropoff: { type: String, required: true },
  cabType: { type: String, enum: ['economy', 'comfort', 'premium'], default: 'economy' },
  fare:    { type: Number, default: 0 },
  status:  { type: String, enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  distance:{ type: Number, default: 0 },
  eta:     { type: Number, default: 0 },
}, { timestamps: true }));

const Payment = mongoose.model('Payment', new mongoose.Schema({
  ride:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['card', 'cash', 'wallet'], default: 'cash' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
}, { timestamps: true }));

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── UTILS ────────────────────────────────────────────────────────────────────

function generateReceiptPDF(payment, ride, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const orange = '#f5a623', dark = '#1a1a2e', gray = '#666666';

    doc.rect(0, 0, doc.page.width, 100).fill(dark);
    doc.fill('#ffffff').fontSize(28).font('Helvetica-Bold').text('UCAB', 50, 30);
    doc.fontSize(11).font('Helvetica').text('Your Trusted Ride Partner', 50, 62);
    doc.fill(orange).fontSize(13).font('Helvetica-Bold').text('PAYMENT RECEIPT', 370, 42);

    doc.rect(50, 115, 495, 60).fill('#fff8e1').stroke(orange);
    doc.fill(dark).fontSize(10).font('Helvetica-Bold')
      .text('Receipt No:', 65, 128).text('Date:', 65, 145)
      .text('Status:', 300, 128).text('Payment Method:', 300, 145);
    doc.fill(gray).font('Helvetica')
      .text(`#${payment._id.toString().slice(-8).toUpperCase()}`, 140, 128)
      .text(new Date(payment.createdAt).toLocaleString('en-IN'), 140, 145)
      .text(payment.status.toUpperCase(), 390, 128)
      .text(payment.method.toUpperCase(), 390, 145);

    doc.fill(dark).fontSize(12).font('Helvetica-Bold').text('PASSENGER DETAILS', 50, 195);
    doc.moveTo(50, 210).lineTo(545, 210).stroke(orange);
    doc.fill(dark).fontSize(10).font('Helvetica-Bold').text('Name:', 50, 218);
    doc.fill(gray).font('Helvetica').text(user.name || '-', 150, 218);
    doc.fill(dark).font('Helvetica-Bold').text('Email:', 50, 233);
    doc.fill(gray).font('Helvetica').text(user.email || '-', 150, 233);
    doc.fill(dark).font('Helvetica-Bold').text('Phone:', 50, 248);
    doc.fill(gray).font('Helvetica').text(user.phone || '-', 150, 248);

    doc.fill(dark).fontSize(12).font('Helvetica-Bold').text('TRIP DETAILS', 50, 278);
    doc.moveTo(50, 293).lineTo(545, 293).stroke(orange);

    const tripFields = [
      ['Pickup Location', ride.pickup], ['Drop-off Location', ride.dropoff],
      ['Cab Type', ride.cabType?.toUpperCase()], ['Distance', `${ride.distance} km`],
      ['ETA', `${ride.eta} minutes`], ['Ride Status', ride.status?.toUpperCase()],
      ['Ride Date', new Date(ride.createdAt).toLocaleString('en-IN')],
    ];
    let y = 300;
    tripFields.forEach(([label, value]) => {
      doc.fill(dark).fontSize(10).font('Helvetica-Bold').text(`${label}:`, 50, y);
      doc.fill(gray).font('Helvetica').text(value || '-', 200, y, { width: 345 });
      y += 18;
    });

    y += 10;
    doc.fill(dark).fontSize(12).font('Helvetica-Bold').text('FARE BREAKDOWN', 50, y);
    y += 15;
    doc.moveTo(50, y).lineTo(545, y).stroke(orange);
    y += 10;

    const fareConfig = {
      economy: { perKm: 6 }, comfort: { perKm: 9 }, premium: { perKm: 14 },
    };
    const cfg = fareConfig[ride.cabType] || fareConfig.economy;
    const distCharge = parseFloat((ride.distance * cfg.perKm).toFixed(2));

    [[`Distance Charge (${ride.distance} km x Rs.${cfg.perKm})`, `Rs. ${distCharge.toFixed(2)}`],
    ].forEach(([label, value]) => {
      doc.fill(dark).fontSize(10).font('Helvetica').text(label, 50, y);
      doc.text(value, 450, y, { align: 'right', width: 95 });
      y += 18;
    });

    y += 5;
    doc.rect(50, y, 495, 32).fill(dark);
    doc.fill('#ffffff').fontSize(13).font('Helvetica-Bold')
      .text('TOTAL AMOUNT', 65, y + 9)
      .text(`Rs. ${payment.amount}`, 350, y + 9, { align: 'right', width: 180 });
    y += 50;

    doc.moveTo(50, y).lineTo(545, y).stroke(orange);
    doc.fill(gray).fontSize(9).font('Helvetica')
      .text('Thank you for riding with Ucab!', 50, y + 12, { align: 'center', width: 495 })
      .text('Support: support@ucab.in | Andhra Pradesh, India', 50, y + 26, { align: 'center', width: 495 });

    doc.end();
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendReceiptEmail(toEmail, userName, pdfBuffer, receiptId) {
  await transporter.sendMail({
    from: `"Ucab Rides" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Ucab Ride Receipt #${receiptId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;">
      <div style="background:#1a1a2e;padding:24px;text-align:center;">
        <h1 style="color:#f5a623;margin:0;">🚕 UCAB</h1>
        <p style="color:#fff;margin:6px 0 0;">Your Trusted Ride Partner</p>
      </div>
      <div style="padding:24px;">
        <h2 style="color:#1a1a2e;">Hi ${userName},</h2>
        <p style="color:#555;">Thank you for riding with Ucab! Your receipt is attached.</p>
        <div style="background:#fff8e1;border-left:4px solid #f5a623;padding:12px 16px;border-radius:4px;margin:16px 0;">
          <strong>Receipt No:</strong> #${receiptId}<br/>
          <strong>Status:</strong> Payment Successful ✅
        </div>
        <p style="color:#555;">Contact: <a href="mailto:support@ucab.in" style="color:#f5a623;">support@ucab.in</a></p>
        <p style="color:#999;font-size:12px;">© 2024 Ucab — Andhra Pradesh, India</p>
      </div>
    </div>`,
    attachments: [{ filename: `Ucab_Receipt_${receiptId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const fareConfig = {
  economy: { perKm: 6 },
  comfort: { perKm: 9 },
  premium: { perKm: 14 },
};
const calcFare = (distance, cabType) => {
  const cfg = fareConfig[cabType] || fareConfig.economy;
  return parseFloat((distance * cfg.perKm).toFixed(2));
};

const otpStore = {};

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

const authRouter = require('express').Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone, role });
    if (role === 'driver' && !(await Driver.findOne({ email })))
      await Driver.create({ userId: user._id, name, email, phone: phone || '', licenseNumber: '', cabType: 'economy' });
    res.status(201).json({ token: generateToken(user), user: { id: user._id, name, email, role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    if (user.role === 'driver') {
      const existing = await Driver.findOne({ $or: [{ userId: user._id }, { email }] });
      if (!existing)
        await Driver.create({ userId: user._id, name: user.name, email: user.email, phone: user.phone || '', licenseNumber: '', cabType: 'economy' });
      else if (!existing.userId)
        await Driver.findByIdAndUpdate(existing._id, { userId: user._id });
    }
    res.json({ token: generateToken(user), user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

authRouter.get('/profile', auth, async (req, res) => {
  try { res.json(await User.findById(req.user.id).select('-password')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

authRouter.get('/users', auth, async (req, res) => {
  try { res.json(await User.find().select('-password').sort('-createdAt')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

authRouter.delete('/users/:id', auth, async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'User deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expiry: Date.now() + 10 * 60 * 1000 };
    res.json({ message: 'Reset code sent', otp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

authRouter.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: 'No reset request found' });
    if (Date.now() > record.expiry) return res.status(400).json({ message: 'Reset code expired' });
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid reset code' });
    await User.findOneAndUpdate({ email }, { password: await bcrypt.hash(newPassword, 10) });
    delete otpStore[email];
    res.json({ message: 'Password reset successful' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── DRIVER ROUTES ────────────────────────────────────────────────────────────

const driverRouter = require('express').Router();

driverRouter.post('/register', async (req, res) => {
  try { res.status(201).json(await Driver.create(req.body)); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

driverRouter.get('/', auth, async (req, res) => {
  try { res.json(await Driver.find()); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

driverRouter.put('/:id/verify', auth, async (req, res) => {
  try { res.json(await Driver.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── RIDE ROUTES ──────────────────────────────────────────────────────────────

const rideRouter = require('express').Router();

rideRouter.get('/estimate', auth, (req, res) => {
  const { distance, cabType } = req.query;
  const dist = parseFloat(distance);
  const fare = calcFare(dist, cabType);
  const eta  = Math.ceil((dist / 30) * 60);
  const cfg  = fareConfig[cabType] || fareConfig.economy;
  res.json({ fare, eta, breakdown: { distanceCharge: parseFloat((dist * cfg.perKm).toFixed(2)) } });
});

rideRouter.get('/nearby', auth, async (req, res) => {
  try {
    const { cabType } = req.query;
    const query = { isAvailable: true, isVerified: true };
    if (cabType) query.cabType = cabType;
    res.json(await Driver.find(query).limit(5));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.post('/book', auth, async (req, res) => {
  try {
    const { pickup, dropoff, cabType, distance } = req.body;
    const fare   = calcFare(distance, cabType);
    const eta    = Math.ceil((distance / 30) * 60);
    const driver = await Driver.findOne({ isAvailable: true, isVerified: true, cabType });
    const ride   = await Ride.create({
      user: req.user.id, driver: driver?._id,
      pickup, dropoff, cabType, fare, distance, eta,
      status: driver ? 'accepted' : 'pending',
    });
    if (driver) await Driver.findByIdAndUpdate(driver._id, { isAvailable: false });
    res.status(201).json(await ride.populate(['user', 'driver']));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.get('/history', auth, async (req, res) => {
  try { res.json(await Ride.find({ user: req.user.id }).populate('driver').sort('-createdAt')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.get('/driver/mine', auth, async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    let driverDoc = await Driver.findOne({ userId: req.user.id });
    if (!driverDoc) driverDoc = await Driver.findOne({ email: userDoc.email });
    if (!driverDoc) return res.json([]);
    res.json(await Ride.find({ driver: driverDoc._id }).populate('user', 'name email phone').populate('driver').sort('-createdAt'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.get('/driver/pending', auth, async (req, res) => {
  try { res.json(await Ride.find({ status: 'pending' }).populate('user', 'name email phone').sort('-createdAt')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.put('/:id/accept', auth, async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    let driverDoc = await Driver.findOne({ userId: req.user.id });
    if (!driverDoc) driverDoc = await Driver.findOne({ email: userDoc.email });
    if (!driverDoc)
      driverDoc = await Driver.create({ userId: userDoc._id, name: userDoc.name, email: userDoc.email, phone: userDoc.phone || '', licenseNumber: '', cabType: 'economy' });
    if (!driverDoc.userId) await Driver.findByIdAndUpdate(driverDoc._id, { userId: req.user.id });
    const ride = await Ride.findByIdAndUpdate(req.params.id, { status: 'accepted', driver: driverDoc._id }, { new: true })
      .populate('user', 'name email phone').populate('driver');
    await Driver.findByIdAndUpdate(driverDoc._id, { isAvailable: false });
    res.json(ride);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.get('/all', auth, async (req, res) => {
  try { res.json(await Ride.find().populate('user', 'name email').populate('driver', 'name phone').sort('-createdAt')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.get('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate(['user', 'driver']);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(ride);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('driver');
    if (status === 'completed' && ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver._id, { isAvailable: true });
      if (!(await Payment.findOne({ ride: ride._id })))
        await Payment.create({ ride: ride._id, user: ride.user, amount: ride.fare, method: 'card' });
    }
    res.json(ride);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.put('/:id/cancel', auth, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (ride.driver) await Driver.findByIdAndUpdate(ride.driver, { isAvailable: true });
    res.json(ride);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

rideRouter.delete('/:id', auth, async (req, res) => {
  try { await Ride.findByIdAndDelete(req.params.id); res.json({ message: 'Ride deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PAYMENT ROUTES ───────────────────────────────────────────────────────────

const paymentRouter = require('express').Router();

paymentRouter.get('/', auth, async (req, res) => {
  try { res.json(await Payment.find({ user: req.user.id }).populate('ride').sort('-createdAt')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

paymentRouter.get('/all/admin', auth, async (req, res) => {
  try { res.json(await Payment.find().populate('user', 'name email').populate('ride').sort('-createdAt')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

paymentRouter.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(['ride', 'user']);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

paymentRouter.get('/:id/download', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('ride').populate('user', 'name email phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    const pdfBuffer = await generateReceiptPDF(payment, payment.ride, payment.user);
    const receiptId = payment._id.toString().slice(-8).toUpperCase();
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=Ucab_Receipt_${receiptId}.pdf`, 'Content-Length': pdfBuffer.length });
    res.send(pdfBuffer);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

paymentRouter.post('/:id/email', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('ride').populate('user', 'name email phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    const pdfBuffer = await generateReceiptPDF(payment, payment.ride, payment.user);
    const receiptId = payment._id.toString().slice(-8).toUpperCase();
    await sendReceiptEmail(payment.user.email, payment.user.name, pdfBuffer, receiptId);
    res.json({ message: `Receipt sent to ${payment.user.email}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── MOUNT ROUTES ─────────────────────────────────────────────────────────────

app.use('/api/auth',     authRouter);
app.use('/api/drivers',  driverRouter);
app.use('/api/rides',    rideRouter);
app.use('/api/payments', paymentRouter);

// ─── START ────────────────────────────────────────────────────────────────────

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch(err => console.error(err));
