const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const qr = require('qr-image');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Serve static files
app.use('/customer', express.static(path.join(__dirname, '../customer-web')));
app.use('/staff', express.static(path.join(__dirname, '../staff-dashboard')));

// In-memory requests
let requests = [];
let requestId = 1;

// Socket.io
const io = socketIo(server, { cors: { origin: "*", methods: ["GET","POST"] } });

// --- API Routes ---

app.get('/api/test', (req, res) => {
  res.json({ message: "✅ TapCall backend is working!", requests: requests.length });
});

app.post('/api/requests', (req, res) => {
  const { table_id, type = "waiter" } = req.body;
  const newRequest = { id: requestId++, table_id, type, status: "pending", created_at: new Date(), table_name: `Table ${table_id}` };
  requests.push(newRequest);
  io.emit('new-request', newRequest);
  res.json({ success: true, request: newRequest });
});

app.get('/api/requests', (req, res) => {
  res.json({ success: true, requests: requests.filter(r => r.status === "pending") });
});

app.put('/api/requests/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  const reqObj = requests.find(r => r.id === id);
  if (!reqObj) return res.status(404).json({ success: false, error: "Request not found" });
  reqObj.status = "completed";
  reqObj.completed_at = new Date();
  io.emit('request-completed', id);
  res.json({ success: true, request: reqObj });
});

app.put('/api/requests/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id);
  const reqObj = requests.find(r => r.id === id);
  if (!reqObj) return res.status(404).json({ success: false, error: "Request not found" });
  if (reqObj.status !== "pending") return res.status(400).json({ success: false, error: "Request cannot be cancelled" });
  reqObj.status = "cancelled";
  reqObj.completed_at = new Date();
  io.emit('request-cancelled', id);
  res.json({ success: true, request: reqObj });
});

// --- QR Code DataURL ---
app.get('/api/qr-dataurl/:tableId', async (req, res) => {
  const tableId = req.params.tableId;
  const tableName = req.query.table_name || `Table ${tableId}`;
  const customerUrl = `https://tap-call.onrender.com/customer/index.html?table_id=${tableId}&table_name=${encodeURIComponent(tableName)}`;

  try {
    const qrBuffer = qr.imageSync(customerUrl, { type: 'png' });
    const decoratedDataUrl = await decorateQR(qrBuffer, tableName);
    res.json({ success: true, dataUrl: decoratedDataUrl, tableId, tableName, customerUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// --- QR Download with decoration ---
app.get('/api/qr-download/:tableId', async (req, res) => {
  const tableId = req.params.tableId;
  const tableName = req.query.table_name || `Table ${tableId}`;
  const customerUrl = `https://tap-call.onrender.com/customer/index.html?table_id=${tableId}&table_name=${encodeURIComponent(tableName)}`;

  try {
    const qrBuffer = qr.imageSync(customerUrl, { type: 'png' });
    const decoratedBuffer = await decorateQR(qrBuffer, tableName, true);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="table-${tableId}-qr.png"`);
    res.send(decoratedBuffer);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR download" });
  }
});

// --- QR decoration function ---
async function decorateQR(qrBuffer, tableName, returnBuffer=false) {
  const img = await loadImage(qrBuffer);
  const padding = 40;
  const width = img.width + padding*2;
  const height = img.height + padding*2 + 80; // space for header/footer

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,width,height);

  // Header
  ctx.fillStyle = "#000";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(tableName, width/2, 30);

  // QR image
  ctx.drawImage(img, padding, 50);

  // Footer
  ctx.font = "18px Arial";
  ctx.fillText("Scan to call waiter", width/2, height-30);
  ctx.font = "14px Arial";
  ctx.fillText("Powered by RoG Digitals", width/2, height-10);

  if (returnBuffer) return canvas.toBuffer('image/png');
  return canvas.toDataURL();
}

// --- Socket.io ---
io.on('connection', socket => {
  console.log("🔌 User connected:", socket.id);
  socket.on('disconnect', () => console.log("❌ User disconnected:", socket.id));
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TapCall Server Started on port ${PORT}`);
});
