// Get URL parameters for table info
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        tableId: params.get('table_id') || 1,
        tableName: params.get('table_name') || 'Table 1'
    };
}

// Global variables
let currentRequestId = null;
let socket = null;
let isCancelling = false;

// Initialize the app
function initApp() {
    const params = getUrlParams();
    
    // Update page content
    document.getElementById('tableInfo').innerHTML = `
        <div class="table-number">${params.tableName}</div>
    `;
    
    // Connect to Socket.io
    socket = io();
    console.log('🔌 Connected to server');
    
    // Listen for request completion
    socket.on('request-completed', (requestId) => {
        console.log('✅ Received completion for request:', requestId);
        if (requestId === currentRequestId) {
            showCompletionMessage();
        }
    });
    
    // Listen for request cancellation confirmation
    socket.on('request-cancelled', (requestId) => {
        console.log('🚫 Received cancellation for request:', requestId);
        if (requestId === currentRequestId) {
            showCancellationMessage();
        }
    });
    
    console.log('Customer App Initialized for:', params.tableName);
}

// Call waiter function
async function callWaiter() {
    if (currentRequestId) {
        console.log('⚠️ Already have active request:', currentRequestId);
        return;
    }
    
    const params = getUrlParams();
    showLoadingState('Waiter is coming...', true);
    isCancelling = false;
    
    try {
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                table_id: params.tableId,
                type: 'waiter'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentRequestId = data.request.id;
            console.log('✅ Waiter called successfully. Request ID:', currentRequestId);
        } else {
            throw new Error(data.error || 'Failed to call waiter');
        }
    } catch (error) {
        console.error('❌ Error calling waiter:', error);
        if (!isCancelling) {
            showErrorState('Failed to call waiter. Please try again.');
        }
    }
}

// Request bill function
async function requestBill() {
    if (currentRequestId) {
        console.log('⚠️ Already have active request:', currentRequestId);
        return;
    }
    
    const params = getUrlParams();
    showLoadingState('Bill is being prepared...', true);
    isCancelling = false;
    
    try {
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                table_id: params.tableId,
                type: 'bill'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentRequestId = data.request.id;
            console.log('✅ Bill requested successfully. Request ID:', currentRequestId);
        } else {
            throw new Error(data.error || 'Failed to request bill');
        }
    } catch (error) {
        console.error('❌ Error requesting bill:', error);
        if (!isCancelling) {
            showErrorState('Failed to request bill. Please try again.');
        }
    }
}

// Cancel request function
async function cancelRequest() {
    if (!currentRequestId) {
        console.log('⚠️ No request to cancel');
        return;
    }
    
    console.log('🚫 Attempting to cancel request:', currentRequestId);
    isCancelling = true;
    showLoadingState('Cancelling request...', false);
    
    try {
        const response = await fetch(`/api/requests/${currentRequestId}/cancel`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Cancel request sent successfully');
            // Wait for socket confirmation to update UI
        } else {
            throw new Error(data.error || 'Failed to cancel request');
        }
    } catch (error) {
        console.error('❌ Error cancelling request:', error);
        showErrorState('Failed to cancel request. Please try again.');
        isCancelling = false;
    }
}

// Show loading state
function showLoadingState(message, showCancelButton = false) {
    console.log('🔄 Loading state:', message);
    document.getElementById('requestSection').style.display = 'none';
    document.getElementById('statusSection').style.display = 'block';
    document.getElementById('completedSection').style.display = 'none';
    
    document.getElementById('statusMessage').textContent = message;
    document.getElementById('statusMessage').className = 'status-message';
    
    if (showCancelButton) {
        document.getElementById('cancelBtn').style.display = 'block';
    } else {
        document.getElementById('cancelBtn').style.display = 'none';
    }
}

// Show completion message
function showCompletionMessage() {
    console.log('🎉 Showing completion message');
    document.getElementById('statusSection').style.display = 'none';
    document.getElementById('completedSection').style.display = 'block';
    
    document.querySelector('.completed-message').innerHTML = `
        <span class="icon">✅</span>
        <span class="text">Request Completed!</span>
    `;
    
    setTimeout(() => {
        resetToInitialState();
    }, 3000);
    
    currentRequestId = null;
    isCancelling = false;
}

// Show cancellation message
function showCancellationMessage() {
    console.log('🛑 Showing cancellation message');
    document.getElementById('statusSection').style.display = 'none';
    document.getElementById('completedSection').style.display = 'block';
    
    document.querySelector('.completed-message').innerHTML = `
        <span class="icon">🚫</span>
        <span class="text">Request Cancelled</span>
    `;
    
    setTimeout(() => {
        resetToInitialState();
    }, 3000);
    
    currentRequestId = null;
    isCancelling = false;
}

// Show error state
function showErrorState(message) {
    console.log('❌ Error state:', message);
    document.getElementById('statusMessage').textContent = message;
    document.getElementById('statusMessage').style.color = '#FF3B30';
    document.querySelector('.loading-dots').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    
    setTimeout(() => {
        resetToInitialState();
    }, 3000);
}

// Reset to initial state
function resetToInitialState() {
    console.log('🔄 Resetting to initial state');
    document.getElementById('statusSection').style.display = 'none';
    document.getElementById('completedSection').style.display = 'none';
    document.getElementById('requestSection').style.display = 'block';
    document.querySelector('.loading-dots').style.display = 'flex';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('statusMessage').style.color = '';
    document.getElementById('statusMessage').className = 'status-message';
    
    currentRequestId = null;
    isCancelling = false;
}

// Initialize app
document.addEventListener('DOMContentLoaded', initApp);