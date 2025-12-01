// qr-script.js

// Generate QR Code for selected table
function generateQRCode() {
    const tableId = document.getElementById('tableId').value;
    const tableName = document.getElementById('tableName').value || `Table ${tableId}`;
    const cafeId = document.getElementById('cafeSelect').value;
    const businessName = document.getElementById('businessName').value || 'Our Restaurant';

    if (!cafeId) {
        alert('❌ Please select a café');
        return;
    }

    const apiUrl = `/api/qr-dataurl/${tableId}?table_name=${encodeURIComponent(tableName)}&cafe_id=${cafeId}`;

    fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            if (data.success) {
                const qrImg = document.getElementById('qrCardImage');
                const qrCardTableName = document.getElementById('qrCardTableName');

                qrImg.src = data.dataUrl;
                qrCardTableName.textContent = `${businessName} - ${tableName}`;
                document.getElementById('qrResult').style.display = 'block';
            } else {
                alert('❌ Error generating QR code: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('❌ QR generation failed:', err);
            alert('❌ QR generation failed: ' + err.message);
        });
}

// Download QR Code PNG
function downloadQRCode() {
    const tableId = document.getElementById('tableId').value;
    const tableName = document.getElementById('tableName').value || `Table ${tableId}`;
    const cafeId = document.getElementById('cafeSelect').value;

    if (!cafeId) {
        alert('❌ Please select a café');
        return;
    }

    const downloadUrl = `/api/qr-download/${tableId}?table_name=${encodeURIComponent(tableName)}&cafe_id=${cafeId}`;
    window.open(downloadUrl, '_blank');
}

// Print QR Code
function printQRCode() {
    const qrCard = document.getElementById('qrCard');
    if (!qrCard) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print QR Code</title>
            <style>
                body { font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .qr-card { width: 300px; background: white; border: 1px solid #ddd; border-radius: 12px; padding: 20px; text-align: center; }
                .qr-card h2 { font-size: 20px; margin-bottom: 15px; }
                .qr-card img { width: 100%; border-radius: 10px; border: 1px solid #ddd; padding: 10px; }
                .scan-text { margin-top: 15px; font-size: 16px; font-weight: 500; }
                .powered { margin-top: 12px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            ${qrCard.outerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Quick generate multiple tables
function quickGenerateTables(count = 10) {
    const cafeId = document.getElementById('cafeSelect').value;
    if (!cafeId) {
        alert('❌ Please select a café');
        return;
    }

    const tablesGrid = document.getElementById('tablesGrid');
    tablesGrid.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const tableName = `Table ${i}`;
        const apiUrl = `/api/qr-dataurl/${i}?table_name=${encodeURIComponent(tableName)}&cafe_id=${cafeId}`;

        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const card = document.createElement('div');
                    card.className = 'table-card';
                    card.innerHTML = `
                        <h3>${tableName}</h3>
                        <img src="${data.dataUrl}" alt="QR Code" style="max-width: 100%; margin-bottom: 10px;">
                        <button onclick="window.open('/api/qr-download/${i}?table_name=${encodeURIComponent(tableName)}&cafe_id=${cafeId}', '_blank')">
                            Download
                        </button>
                    `;
                    tablesGrid.appendChild(card);
                } else {
                    console.error('Error generating QR for table', i, data.error);
                }
            })
            .catch(err => console.error('QR fetch error:', err));
    }
}

// Event listeners for DOM
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('qrResult').style.display = 'none';
});
