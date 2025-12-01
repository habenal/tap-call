// Staff Dashboard JavaScript
let currentFilter = 'all';
let socket = null;

// Initialize the staff dashboard
function initStaffDashboard() {
    console.log('🚀 Initializing Staff Dashboard...');
    
    // Connect to Socket.io
    socket = io();
    console.log('🔌 Connected to server via Socket.io');
    
    // Listen for new requests in real-time
    socket.on('new-request', (newRequest) => {
        console.log('📞 New request received via socket:', newRequest);
        showNotification(`New request from ${newRequest.table_name}`);
        
        // Add the new request to the UI immediately
        addRequestToUI(newRequest);
    });
    
    // Listen for request cancellations
    socket.on('request-cancelled', (cancelledRequestId) => {
        console.log('🚫 Request cancelled via socket:', cancelledRequestId);
        showNotification('Request was cancelled by customer');
        
        // Remove the request from UI immediately
        removeRequestFromUI(cancelledRequestId);
    });
    
    // Load initial requests
    loadRequests();
    
    console.log('✅ Staff Dashboard Ready');
}

// Load requests from API
async function loadRequests() {
    console.log('🔄 Loading requests from API...');
    try {
        const response = await fetch('/api/requests');
        console.log('📡 API response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Received data:', data);
        
        if (data.success) {
            console.log(`✅ Loaded ${data.requests.length} requests`);
            displayRequests(data.requests);
        } else {
            throw new Error(data.error || 'Failed to load requests');
        }
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        showNotification('Error loading requests', 'error');
    }
}

// Display requests in the UI
function displayRequests(requests) {
    const requestsList = document.getElementById('requestsList');
    const emptyState = document.getElementById('emptyState');
    
    console.log('🎨 Displaying requests in UI:', requests.length);
    
    if (!requestsList) {
        console.error('❌ requestsList element not found!');
        return;
    }
    
    // Filter requests based on current filter
    const filteredRequests = requests.filter(request => {
        if (currentFilter === 'all') return true;
        return request.type === currentFilter;
    });
    
    console.log(`🔍 Filtered to ${filteredRequests.length} requests (filter: ${currentFilter})`);
    
    if (filteredRequests.length === 0) {
        requestsList.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        console.log('📭 No requests to display');
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    requestsList.innerHTML = filteredRequests.map(request => `
        <div class="request-card" id="request-${request.id}">
            <div class="request-info">
                <div class="table-name">${request.table_name}</div>
                <div class="request-type ${request.type}">
                    ${request.type === 'waiter' ? '👨‍💼 Waiter Call' : '🧾 Bill Request'}
                </div>
                <div class="request-time">
                    ${formatTime(new Date(request.created_at))}
                </div>
            </div>
            <button class="complete-btn" onclick="completeRequest(${request.id})">
                Mark Complete
            </button>
        </div>
    `).join('');
    
    console.log('✅ Requests displayed in UI');
}

// Add a single request to UI (for real-time updates)
function addRequestToUI(request) {
    console.log('➕ Adding request to UI:', request.id);
    
    const requestsList = document.getElementById('requestsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!requestsList) return;
    
    // Hide empty state
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Check if request already exists (to avoid duplicates)
    const existingRequest = document.getElementById(`request-${request.id}`);
    if (existingRequest) {
        console.log('⚠️ Request already in UI, skipping');
        return;
    }
    
    // Create new request element
    const requestElement = document.createElement('div');
    requestElement.className = 'request-card';
    requestElement.id = `request-${request.id}`;
    requestElement.innerHTML = `
        <div class="request-info">
            <div class="table-name">${request.table_name}</div>
            <div class="request-type ${request.type}">
                ${request.type === 'waiter' ? '👨‍💼 Waiter Call' : '🧾 Bill Request'}
            </div>
            <div class="request-time">
                ${formatTime(new Date(request.created_at))}
            </div>
        </div>
        <button class="complete-btn" onclick="completeRequest(${request.id})">
            Mark Complete
        </button>
    `;
    
    // Add with animation
    requestElement.style.opacity = '0';
    requestElement.style.transform = 'translateY(-20px)';
    requestsList.insertBefore(requestElement, requestsList.firstChild);
    
    // Animate in
    setTimeout(() => {
        requestElement.style.transition = 'all 0.3s ease';
        requestElement.style.opacity = '1';
        requestElement.style.transform = 'translateY(0)';
    }, 10);
    
    console.log('✅ Request added to UI with animation');
}

// Remove request from UI (for cancellations)
function removeRequestFromUI(requestId) {
    console.log('➖ Removing request from UI:', requestId);
    
    const requestElement = document.getElementById(`request-${requestId}`);
    if (requestElement) {
        // Animate out
        requestElement.style.transition = 'all 0.3s ease';
        requestElement.style.opacity = '0';
        requestElement.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            requestElement.remove();
            console.log('✅ Request removed from UI');
            
            // Show empty state if no requests left
            const requestsList = document.getElementById('requestsList');
            if (requestsList.children.length === 0) {
                const emptyState = document.getElementById('emptyState');
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
            }
        }, 300);
    } else {
        console.log('⚠️ Request not found in UI for removal:', requestId);
    }
}

// Complete a request
async function completeRequest(requestId) {
    console.log('🎯 Completing request:', requestId);
    
    try {
        const response = await fetch(`/api/requests/${requestId}/complete`, {
            method: 'PUT'
        });
        
        console.log('📡 Complete request response status:', response.status);
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Request completed successfully');
            showNotification('Request completed!');
            
            // Remove from UI with animation
            removeRequestFromUI(requestId);
        } else {
            throw new Error(data.error || 'Failed to complete request');
        }
    } catch (error) {
        console.error('❌ Error completing request:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Set filter and refresh display
function setFilter(filter) {
    console.log('🔍 Setting filter to:', filter);
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadRequests();
}

// Show notification
function showNotification(message, type = 'success') {
    console.log('📢 Notification:', message);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#FF3B30' : '#34C759'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Format time for display
function formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initStaffDashboard);