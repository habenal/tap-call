// Staff Dashboard JS (Multi-Café Ready)
let currentFilter = 'all';
let socket = null;
let selectedCafeId = null;

document.addEventListener('DOMContentLoaded', () => {
    selectedCafeId = document.getElementById('cafeSelect').value;

    // Update selected cafe when dropdown changes
    document.getElementById('cafeSelect').addEventListener('change', () => {
        selectedCafeId = document.getElementById('cafeSelect').value;
        loadRequests();
    });

    // Connect to Socket.io
    socket = io();

    // Listen for new requests
    socket.on('new-request', (newRequest) => {
        if (newRequest.cafe_id !== selectedCafeId) return;
        showNotification(`New request from ${newRequest.table_name}`);
        addRequestToUI(newRequest);
        updatePendingCount();
    });

    // Listen for cancelled requests
    socket.on('request-cancelled', (requestId) => {
        removeRequestFromUI(requestId);
        showNotification('Request cancelled by customer', 'error');
        updatePendingCount();
    });

    // Listen for completed requests (if needed)
    socket.on('request-completed', (requestId) => {
        removeRequestFromUI(requestId);
        updatePendingCount();
    });

    loadRequests();
});

// Load requests from backend
async function loadRequests() {
    if (!selectedCafeId) return;
    try {
        const res = await fetch(`/api/requests?cafe_id=${selectedCafeId}`);
        const data = await res.json();
        if (data.success) {
            displayRequests(data.requests);
            updatePendingCount();
        } else {
            throw new Error(data.error || 'Failed to load requests');
        }
    } catch (err) {
        console.error(err);
        showNotification('Failed to load requests', 'error');
    }
}

// Display list of requests
function displayRequests(requests) {
    const list = document.getElementById('requestsList');
    const emptyState = document.getElementById('emptyState');
    if (!list) return;

    const filtered = requests.filter(r => currentFilter === 'all' || r.type === currentFilter);

    if (filtered.length === 0) {
        list.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    list.innerHTML = filtered.map(r => `
        <div class="request-card" id="request-${r.id}">
            <div class="request-info">
                <div class="table-name">${r.table_name}</div>
                <div class="request-type ${r.type}">${r.type === 'waiter' ? '👨‍💼 Waiter Call' : '🧾 Bill Request'}</div>
                <div class="request-time">${formatTime(new Date(r.created_at))}</div>
            </div>
            <button class="complete-btn" onclick="completeRequest(${r.id})">Mark Complete</button>
        </div>
    `).join('');
}

// Add single request (real-time)
function addRequestToUI(r) {
    const list = document.getElementById('requestsList');
    if (!list) return;
    if (document.getElementById(`request-${r.id}`)) return;

    const elem = document.createElement('div');
    elem.className = 'request-card';
    elem.id = `request-${r.id}`;
    elem.innerHTML = `
        <div class="request-info">
            <div class="table-name">${r.table_name}</div>
            <div class="request-type ${r.type}">${r.type === 'waiter' ? '👨‍💼 Waiter Call' : '🧾 Bill Request'}</div>
            <div class="request-time">${formatTime(new Date(r.created_at))}</div>
        </div>
        <button class="complete-btn" onclick="completeRequest(${r.id})">Mark Complete</button>
    `;
    list.insertBefore(elem, list.firstChild);
}

// Remove request
function removeRequestFromUI(id) {
    const elem = document.getElementById(`request-${id}`);
    if (elem) elem.remove();
}

// Complete request
async function completeRequest(id) {
    try {
        const res = await fetch(`/api/requests/${id}/complete`, { method: 'PUT' });
        const data = await res.json();
        if (data.success) removeRequestFromUI(id);
        updatePendingCount();
    } catch (err) {
        console.error(err);
        showNotification('Failed to complete request', 'error');
    }
}

// Filter buttons
function setFilter(filter, evt) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (evt?.target) evt.target.classList.add('active');
    loadRequests();
}

// Format time
function formatTime(date) {
    const diff = Math.floor((new Date() - date) / 60000);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 minute ago';
    if (diff < 60) return `${diff} minutes ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Notification
function showNotification(msg, type='success') {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: ${type==='error'?'#FF3B30':'#34C759'};
        color: white; padding: 12px 18px; border-radius: 8px; z-index: 1000;
    `;
    document.body.appendChild(n);
    setTimeout(()=>n.remove(), 3000);
}

// Update pending count display
function updatePendingCount() {
    const count = document.querySelectorAll('.request-card').length;
    document.getElementById('pendingCount').textContent = `${count} pending`;
}
