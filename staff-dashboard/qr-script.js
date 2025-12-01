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
            currentQRData = data;

            // Display QR code
            document.getElementById('qrImage').src = data.dataUrl;
            document.getElementById('qrTableName').textContent = tableName;
            document.getElementById('qrUrl').textContent = data.customerUrl;
            document.getElementById('qrResult').style.display = 'block';

            console.log('✅ QR code generated successfully');

            // Test the URL
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
        const response = await fetch(url);
        if (response.ok) {
            console.log('✅ QR URL is accessible:', url);
        } else {
            console.warn('⚠️ QR URL returned status:', response.status);
        }
    } catch (error) {
        console.error('❌ QR URL is not accessible:', error.message);
        // Silent fail
    }
}

// Download QR code as PNG (FIXED)
function downloadQRCode() {
    if (!currentQRData) {
        alert('Please generate a QR code first');
        return;
    }

    const tableId = currentQRData.tableId || currentQRData.table_id;
    const tableName = currentQRData.tableName || currentQRData.table_name;

    const downloadUrl =
        `/api/qr-download/${tableId}?table_name=${encodeURIComponent(tableName)}`;

    window.open(downloadUrl, "_blank");
}

// Print QR code with updated layout (CORRECTED)
function printQRCode() {
    if (!currentQRData) {
        alert('Please generate a QR code first');
        return;
    }

    const tableName = currentQRData.tableName || currentQRData.table_name;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Code - ${tableName}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 40px; 
                    }
                    .table-name {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        text-transform: uppercase;
                    }
                    .qr-container { 
                        margin: 20px auto; 
                        max-width: 300px;
                    }
                    img { 
                        max-width: 100%; 
                        border: 1px solid #ddd;
                        padding: 10px;
                        border-radius: 10px;
                    }
                    .scan-text { 
                        margin-top: 20px; 
                        font-size: 18px;
                        font-weight: 500;
                    }
                    .footer { 
                        margin-top: 30px; 
                        font-size: 14px; 
                        color: #666; 
                    }
                </style>
            </head>
            <body>
                <div class="table-name">${tableName}</div>
                <div class="qr-container">
                    <img src="${currentQRData.dataUrl}" alt="QR Code">
                </div>
                <div class="scan-text">Scan to call waiter</div>
                <div class="footer">Powered by RoG Digitals</div>
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

    // Add some room examples
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
