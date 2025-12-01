// -----------------------------
// Tap Call Backend - server.js
// -----------------------------

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const qr = require('qr-image');

const app = express();
const server = http.createServer(app);

// -----------------------------
// Temporary cafés for testing
// -----------------------------
const cafes = [
  { id: 'CAFE001', name: 'Kabun' },
  { id: 'CAFE002', name: 'Cafe Two' },
  { id: 'CAFE003', name: 'Cafe Three' },
  { id: 'CAFE004', name: 'Cafe Four' },
  { id: 'CAFE005', name: 'Cafe Five' },
];

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/customer', express.static(path.join(__dirname, '../customer-web')));
app.use('/staff', express.static(path.join(__dirname, '../staff-dashboard')));

// In-memory storage
let requests = [];
let requestId = 1;

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --------------------
// Routes
// --------------------

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ TapCall backend is working!', timestamp: new Date().toISOString(), requests: requests.length });
});

// Create request
app.post('/api/requests', (req, res) => {
  const { table_id, type = 'waiter', cafe_id } = req.body;

  // Validate cafe_id
  const cafe = cafes.find(c => c.id === cafe_id);
  if (!cafe) {
    return res.status(400).json({ success: false, error: 'Invalid cafe_id' });
  }

  const newRequest = {
    id: requestId++,
    table_id: parseInt(table_id),
    type,
    status: 'pending',
    created_at: new Date(),
    table_name: `Table ${table_id}`,
    cafe_id: cafe.id
  };

  requests.push(newRequest);
  io.emit('new-request', newRequest);
  res.json({ success: true, request: newRequest, message: 'Request sent successfully!' });
});

// Get pending requests for a cafe
app.get('/api/requests', (req, res) => {
  const { cafe_id } = req.query;

  if (!cafe_id) {
    return res.status(400).json({ success: false, error: 'cafe_id is required' });
  }

  const pendingRequests = requests.filter(req => req.status === 'pending' && req.cafe_id === cafe_id);
  res.json({ success: true, requests: pendingRequests });
});

// Complete request
app.put('/api/requests/:id/complete', (req, res) => {
  const reqId = parseInt(req.params.id);
  const request = requests.find(r => r.id === reqId);
  if (request) {
    request.status = 'completed';
    request.completed_at = new Date();
    io.emit('request-completed', reqId);
    res.json({ success: true, request });
  } else {
    res.status(404).json({ success: false, error: 'Request not found' });
  }
});

// Cancel request
app.put('/api/requests/:id/cancel', (req, res) => {
  const reqId = parseInt(req.params.id);
  const request = requests.find(r => r.id === reqId);
  if (request) {
    if (request.status === 'pending') {
      request.status = 'cancelled';
      request.completed_at = new Date();
      io.emit('request-cancelled', reqId);
      res.json({ success: true, request, message: 'Request cancelled successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Request cannot be cancelled (already completed or cancelled)' });
    }
  } else {
    res.status(404).json({ success: false, error: 'Request not found' });
  }
});

// QR Code generation (data URL)
app.get('/api/qr-dataurl/:tableId', (req, res) => {
  const tableId = req.params.tableId;
  const tableName = req.query.table_name || `Table ${tableId}`;
  const cafeId = req.query.cafe_id;

  const cafe = cafes.find(c => c.id === cafeId);
  if (!cafe) {
    return res.status(400).json({ success: false, error: 'Invalid cafe_id' });
  }

  const customerUrl = `http://tap-call.onrender.com/customer/index.html?table_id=${tableId}&table_name=${encodeURIComponent(tableName)}&cafe_id=${cafeId}`;

  try {
    const qr_png = qr.imageSync(customerUrl, { type: 'png' });
    const dataUrl = `data:image/png;base64,${qr_png.toString('base64')}`;
    res.json({ success: true, dataUrl, customerUrl, tableId, tableName, cafeId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// QR Code download
app.get('/api/qr-download/:tableId', (req, res) => {
  const tableId = req.params.tableId;
  const tableName = req.query.table_name || `Table ${tableId}`;
  const cafeId = req.query.cafe_id;

  const cafe = cafes.find(c => c.id === cafeId);
  if (!cafe) {
    return res.status(400).json({ success: false, error: 'Invalid cafe_id' });
  }

  const customerUrl = `http://tap-call.onrender.com/customer/index.html?table_id=${tableId}&table_name=${encodeURIComponent(tableName)}&cafe_id=${cafeId}`;

  try {
    const qr_png = qr.image(customerUrl, { type: 'png' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="table-${tableId}-qr.png"`);
    qr_png.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  socket.on('disconnect', () => console.log('❌ User disconnected:', socket.id));
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TapCall Server Started on port ${PORT}`);
});
