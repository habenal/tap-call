// QR Code Generator JavaScript
let currentQRData = null;

// Initialize the QR generator
function initQRGenerator() {
    console.log('🚀 Initializing QR Code Generator...');
    generateQuickTables();
}

async function generateQRCode() {
    const tableId = document.getElementById('tableId').value;
    const tableName = document.getElementById('tableName').value;
    const businessName = document.getElementById('businessName').value;
    const customUrl = document.getElementById('customUrl').value;
    
    if (!tableId || !tableName) {
        alert('Please fill in Table Number and Table Name');
        return;
    }
    
    try {
        console.log('🎯 Generating QR code for table:', tableId);
        
        // Build query parameters
        let url = `/api/qr-dataurl/${tableId}?table_name=${encodeURIComponent(tableName)}&business=${encodeURIComponent(businessName)}`;
        if (customUrl) {
            url += `&custom_url=${encodeURIComponent(customUrl)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {

            // Store useful data for later (download/print)
            currentQRData = {
                tableId,
                tableName,
                dataUrl: data.dataUrl,
                customerUrl: data.customerUrl
            };

            // Display QR
            document.getElementById('qrImage').src = data.dataUrl;
            document.getElementById('qrTableName').textContent = tableName;
            document.getElementById('qrUrl').textContent = data.customerUrl;
            document.getElementById('qrResult').style.display = 'block';
            
            console.log('✅ QR code generated successfully');
            
            testQRUrl(data.customerUrl);
        } else {
            throw new Error(data.error || 'Failed to generate QR code');
        }
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
        alert('Error generating QR code: ' + error.message);
    }
}

// Test if the QR URL is accessible
async function testQRUrl(url) {
    try {
        const response = await fetch(url, { mode: "no-cors" });
        console.log('ℹ️ Tested URL:', url);
    } catch (error) {
        console.warn('⚠️ Unable to test customer URL:', error.message);
    }
}

// ----------- FIXED DOWNLOAD FUNCTION -----------
function downloadQRCode() {
    if (!currentQRData) {
        alert('Please generate a QR code first');
        return;
    }

    const link = document.createElement('a');
    link.href = currentQRData.dataUrl;
    link.download = `table-${currentQRData.tableId}-qrcode.png`;
    link.click();
}
// ----------------------------------------------

// Print QR code
function printQRCode() {
    if (!currentQRData) {
        alert('Please generate a QR code first');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Code - ${currentQRData.tableName}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 40px;
                    }
                    .qr-container { 
                        margin: 20px auto; 
                        max-width: 300px;
                    }
                    img { 
                        max-width: 100%; 
                        border: 1px solid #ddd;
                        padding: 10px;
                    }
                    .info { 
                        margin-top: 20px; 
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <h2>${document.getElementById('businessName').value}</h2>
                <div class="qr-container">
                    <img src="${currentQRData.dataUrl}" alt="QR Code">
                </div>
                <div class="info">
                    <strong>${currentQRData.tableName}</strong><br>
                    <small>Scan to call service</small>
                </div>
                <p><em>Powered by TapCall</em></p>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Generate quick tables grid
function generateQuickTables() {
    const tablesGrid = document.getElementById('tablesGrid');
    const tables = [];
    
    // Generate tables 1-10
    for (let i = 1; i <= 10; i++) {
        tables.push({
            id: i,
            name: `Table ${i}`
        });
    }
    
    // Add room examples
    tables.push(
        { id: 101, name: 'Room 101' },
        { id: 102, name: 'Room 102' },
        { id: 201, name: 'Suite 201' }
    );
    
    tablesGrid.innerHTML = tables.map(table => `
        <div class="table-card">
            <h4>${table.name}</h4>
            <button class="generate-btn" onclick="quickGenerate(${table.id}, '${table.name}')" style="padding: 8px 16px; font-size: 12px;">
                Generate QR
            </button>
        </div>
    `).join('');
}

// Quick generate for a table
function quickGenerate(tableId, tableName) {
    document.getElementById('tableId').value = tableId;
    document.getElementById('tableName').value = tableName;
    generateQRCode();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initQRGenerator);
