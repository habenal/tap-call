let currentQRData = null;

function initQRGenerator() {
    generateQuickTables();
}

async function generateQRCode() {
    const tableId = document.getElementById('tableId').value.trim();
    const tableName = document.getElementById('tableName').value.trim();
    const businessName = document.getElementById('businessName').value.trim() || 'Our Restaurant';
    const customUrl = document.getElementById('customUrl').value.trim();

    if (!tableId || !tableName) return alert("Please fill in Table Number and Table Name");

    try {
        let url = `/api/qr-dataurl/${tableId}?table_name=${encodeURIComponent(tableName)}&business=${encodeURIComponent(businessName)}`;
        if (customUrl) url += `&custom_url=${encodeURIComponent(customUrl)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.success) throw new Error(data.error || "Failed to generate QR code");

        currentQRData = data;

        // Render QR image with decoration
        const qrImg = document.getElementById('qrImage');
        qrImg.src = await createDecoratedQR(data.dataUrl, tableName);

        document.getElementById('qrResult').style.display = 'block';

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    }
}

async function createDecoratedQR(dataUrl, tableName) {
    return new Promise(resolve => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const padding = 40;
            canvas.width = img.width + padding * 2;
            canvas.height = img.height + padding * 2 + 80; // header/footer space

            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Header
            ctx.fillStyle = "#000";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText(tableName, canvas.width / 2, 30);

            // QR
            ctx.drawImage(img, padding, 50);

            // Footer
            ctx.font = "18px Arial";
            ctx.fillText("Scan to call waiter", canvas.width / 2, canvas.height - 30);
            ctx.font = "14px Arial";
            ctx.fillText("Powered by RoG Digitals", canvas.width / 2, canvas.height - 10);

            resolve(canvas.toDataURL());
        }
    });
}

function downloadQRCode() {
    if (!currentQRData) return alert("Generate QR first");

    const link = document.createElement('a');
    link.href = `/api/qr-download/${currentQRData.tableId}?table_name=${encodeURIComponent(currentQRData.tableName)}`;
    link.download = `table-${currentQRData.tableId}-qr.png`;
    link.click();
}

function printQRCode() {
    if (!currentQRData) return alert("Generate QR first");

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>${currentQRData.tableName} - QR Code</title>
                <style>
                    body { font-family: Arial,sans-serif; text-align: center; padding: 40px; }
                    .table-name { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                    .qr-container { margin: 20px auto; max-width: 300px; }
                    img { max-width: 100%; border: 1px solid #ddd; padding: 10px; border-radius: 10px; background:#fff; }
                    .scan-text { margin-top: 20px; font-size: 18px; font-weight: 500; }
                    .footer { margin-top: 30px; font-size: 14px; color: #666; }
                </style>
            </head>
            <body>
                <div class="table-name">${currentQRData.tableName}</div>
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

function generateQuickTables() {
    const tables = [];
    for (let i=1;i<=10;i++) tables.push({id:i, name:`Table ${i}`});
    tables.push({id:101,name:"Room 101"},{id:102,name:"Room 102"},{id:201,name:"Suite 201"});

    const grid = document.getElementById('tablesGrid');
    grid.innerHTML = tables.map(t => `
        <div class="table-card">
            <h4>${t.name}</h4>
            <button class="generate-btn" onclick="quickGenerate(${t.id},'${t.name}')">Generate QR</button>
        </div>
    `).join('');
}

function quickGenerate(id,name) {
    document.getElementById('tableId').value = id;
    document.getElementById('tableName').value = name;
    generateQRCode();
}

document.addEventListener('DOMContentLoaded', initQRGenerator);
