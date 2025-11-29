const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const qr = require('qr-image');

const app = express();
const server = http.createServer(app);


const express = require('express');
const cors = require('cors');

// Allow all origins (for testing purposes)
app.use(cors());
// Optional: allow JSON body parsing
app.use(express.json());

// Simple in-memory storage
let requests = [];
let requestId = 1;

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/customer', express.static(path.join(__dirname, '../customer-web')));
app.use('/staff', express.static(path.join(__dirname, '../staff-dashboard')));

// Test route
app.get('/api/test', (req, res) => {
    console.log('🔧 API Test called');
    res.json({ 
        message: '✅ TapCall backend is working!', 
        timestamp: new Date().toISOString(),
        requests: requests.length
    });
});

// Create a new request
app.post('/api/requests', (req, res) => {
    const { table_id, type = 'waiter' } = req.body;
    
    console.log('📞 Received request:', { table_id, type });
    
    const newRequest = {
        id: requestId++,
        table_id: parseInt(table_id),
        type: type,
        status: 'pending',
        created_at: new Date(),
        table_name: `Table ${table_id}`
    };
    
    requests.push(newRequest);
    console.log('✅ Request stored:', newRequest);
    
    // Notify all connected staff
    console.log('📢 Emitting new-request to staff');
    io.emit('new-request', newRequest);
    
    res.json({ 
        success: true, 
        request: newRequest,
        message: 'Request sent successfully!' 
    });
});

// Get all pending requests
app.get('/api/requests', (req, res) => {
    console.log('📥 Fetching all pending requests');
    const pendingRequests = requests.filter(req => req.status === 'pending');
    console.log(`📤 Sending ${pendingRequests.length} pending requests`);
    res.json({ 
        success: true, 
        requests: pendingRequests 
    });
});

// Mark request as completed
app.put('/api/requests/:id/complete', (req, res) => {
    const requestId = parseInt(req.params.id);
    console.log('✅ Completing request:', requestId);
    
    const request = requests.find(req => req.id === requestId);
    
    if (request) {
        request.status = 'completed';
        request.completed_at = new Date();
        
        console.log('✅ Request marked as completed:', requestId);
        
        // Notify customer
        console.log('📢 Emitting request-completed to customer');
        io.emit('request-completed', requestId);
        
        res.json({ 
            success: true, 
            request: request 
        });
    } else {
        console.log('❌ Request not found for completion:', requestId);
        res.status(404).json({ 
            success: false, 
            error: 'Request not found' 
        });
    }
});
// Cancel request - FIXED VERSION
app.put('/api/requests/:id/cancel', (req, res) => {
    const requestId = parseInt(req.params.id);
    console.log('🚫 Cancelling request:', requestId);
    
    const request = requests.find(req => req.id === requestId);
    
    if (request) {
        if (request.status === 'pending') {
            request.status = 'cancelled';
            request.completed_at = new Date();
            
            console.log('✅ Request cancelled:', requestId);
            
            // Notify staff AND customer about cancellation
            console.log('📢 Emitting request-cancelled to staff and customer');
            io.emit('request-cancelled', requestId);
            
            res.json({ 
                success: true, 
                request: request,
                message: 'Request cancelled successfully'
            });
        } else {
            console.log('❌ Request cannot be cancelled - already:', request.status);
            res.status(400).json({ 
                success: false, 
                error: 'Request cannot be cancelled (already completed or cancelled)' 
            });
        }
    } else {
        console.log('❌ Request not found for cancellation:', requestId);
        res.status(404).json({ 
            success: false, 
            error: 'Request not found' 
        });
    }
});

// QR Code Generation
app.get('/api/qr-dataurl/:tableId', (req, res) => {
    const tableId = req.params.tableId;
    const tableName = req.query.table_name || `Table ${tableId}`;
    
    console.log('📷 Generating QR code for:', tableName);
    
    const networkIP = '192.168.8.134';
    const customerUrl = `http://tap-call.onrender.com/customer/index.html?table_id=${tableId}&table_name=${encodeURIComponent(tableName)}`;
    
    try {
        const qr_png = qr.imageSync(customerUrl, { type: 'png' });
        const dataUrl = `data:image/png;base64,${qr_png.toString('base64')}`;
        
        console.log('✅ QR code generated successfully');
        
        res.json({
            success: true,
            dataUrl: dataUrl,
            customerUrl: customerUrl,
            tableId: tableId,
            tableName: tableName
        });
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
server.listen(PORT, () => {
    console.log('🚀 TapCall Server Started!');
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`📱 Customer: http://localhost:${PORT}/customer/index.html`);
    console.log(`👨‍💼 Staff: http://localhost:${PORT}/staff/index.html`);
    console.log(`📷 QR Generator: http://localhost:${PORT}/staff/qr-generator.html`);
    console.log(`✅ API test: http://localhost:${PORT}/api/test`);
    console.log('');
    console.log('💡 Quick Test:');
    console.log('  1. Open Staff Dashboard in one tab');
    console.log('  2. Open Customer page in another tab');
    console.log('  3. Click "Call Waiter" on customer page');
    console.log('  4. Watch request appear instantly on staff dashboard');
});