// -----------------------------
// Tap Call Backend - server.js
// -----------------------------

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const qr = require('qr-image');

// Setup express + http server
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use('/customer', express.static(path.join(__dirname, '../customer-web')));
app.use('/staff', express.static(path.join(__dirname, '../staff-dashboard')));

// In-memory request system
let requests = [];
let requestId = 1;

// Socket.io
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --------------------
// ROUTES
// --------------------

// API Test
app.get('/api/test', (req, res) => {
  res.json({
    message: "✅ TapCall backend is working!",
    timestamp: new Date().toISOString(),
    requests: requests.length
  });
});

// Create request
app.post('/api/requests', (req, res) => {
  const { table_id, type = "waiter" } = req.body;
  const newRequest = {
    id: requestId++,
    table_id: parseInt(table_id),
    type,
    status: "pending",
    created_at: new Date(),
    table_name: `Table ${table_id}`
  };

  requests.push(newRequest);
  io.emit("new-request", newRequest);

  res.json({ success: true, request: newRequest, message: "Request sent successfully!" });
});

// Get pending requests
app.get('/api/requests', (req, res) => {
  res.json({ success: true, requests: requests.filter(r => r.status === "pending") });
});

// Complete request
app.put('/api/requests/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  const found = requests.find(r => r.id === id);

  if (!found) return res.status(404).json({ success: false, error: "Request not found" });

  found.status = "completed";
  found.completed_at = new Date();
  io.emit("request-completed", id);

  res.json({ success: true, request: found });
});

// Cancel request
app.put('/api/requests/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id);
  const found = requests.find(r => r.id === id);

  if (!found) return res.status(404).json({ success: false, error: "Request not found" });

  if (found.status !== "pending")
    return res.status(400).json({ success: false, error: "Request cannot be cancelled" });

  found.status = "cancelled";
  found.completed_at = new Date();
  io.emit("request-cancelled", id);

  res.json({ success: true, request: found, message: "Request cancelled successfully" });
});


// -----------------------------
// QR CODE GENERATION (DataURL)
// -----------------------------
app.get('/api/qr-dataurl/:tableId', (req, res) => {
  const tableId = req.params.tableId;
  const tableName = req.query.table_name || `Table ${tableId}`;
  const customerUrl = `https://tap-call.onrender.com/customer/index.html?table_id=${tableId}&table_name=${encodeURIComponent(tableName)}`;

  try {
    const qr_png = qr.imageSync(customerUrl, { type: "png" });
    const dataUrl = `data:image/png;base64,${qr_png.toString("base64")}`;

    res.json({
      success: true,
      dataUrl,
      customerUrl,
      tableId,
      tableName
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// -----------------------------
// QR CODE DOWNLOAD (Direct PNG)
// -----------------------------
app.get('/api/qr-download/:tableId', (req, res) => {
  const tableId = req.params.tableId;
  const tableName = req.query.table_name || `Table ${tableId}`;
  const customerUrl = `https://tap-call.onrender.com/customer/index.html?table_id=${tableId}&table_name=${encodeURIComponent(tableName)}`;

  try {
    const qr_png = qr.image(customerUrl, { type: "png" });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="table-${tableId}-qr.png"`);

    qr_png.pipe(res);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// --------------------
// SOCKET.IO CONNECTION
// --------------------
io.on('connection', socket => {
  console.log("🔌 User connected:", socket.id);
  socket.on('disconnect', () => console.log("❌ User disconnected:", socket.id));
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TapCall Server Started on port ${PORT}`);
  console.log(`📱 Customer: http://localhost:${PORT}/customer/index.html`);
  console.log(`👨‍💼 Staff: http://localhost:${PORT}/staff/index.html`);
  console.log(`📷 QR Generator: http://localhost:${PORT}/staff/qr-generator.html`);
});
