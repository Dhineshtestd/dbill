// Set current date and time on load
function updateDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    
    const dateTimeString = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    document.getElementById('displayDate').textContent = dateTimeString;
}

// Calculate net quantity
function calculateNetQty() {
    const fullQty = parseFloat(document.getElementById('fullQty').value) || 0;
    const emptyQty = parseFloat(document.getElementById('emptyQty').value) || 0;
    const netQty = (fullQty - emptyQty).toFixed(2);
    document.getElementById('displayNetQty').textContent = netQty + ' MT';
}

// Update preview
function updatePreview() {
    document.getElementById('displayDcRef').textContent = document.getElementById('dcRef').value;
    document.getElementById('displayParty').textContent = document.getElementById('party').value;
    document.getElementById('displayLoading').textContent = document.getElementById('loading').value;
    document.getElementById('displayUnloading').textContent = document.getElementById('unloading').value;
    document.getElementById('displayTransport').textContent = document.getElementById('transport').value;
    document.getElementById('displayTruck').textContent = document.getElementById('truck').value;
    document.getElementById('displayItem').textContent = document.getElementById('item').value;
    document.getElementById('displayHsn').textContent = document.getElementById('hsn').value;
    document.getElementById('displayEmptyQty').textContent = document.getElementById('emptyQty').value + ' MT';
    document.getElementById('displayFullQty').textContent = document.getElementById('fullQty').value + ' MT';
    document.getElementById('displayPaymentMode').textContent = document.getElementById('paymentMode').value;
    
    calculateNetQty();
}

// Form submission
document.getElementById('challanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    updatePreview();
});

// Real-time updates
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updatePreview);
});

// Initialize
updateDateTime();
updatePreview();
setInterval(updateDateTime, 60000); // Update time every minute

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed'));
}

// PWA: Install prompt
let deferredPrompt;
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installPrompt.style.display = 'none';
    }
});

// Bluetooth Printing
document.getElementById('bluetoothPrintBtn').addEventListener('click', async () => {
    try {
        // Generate ESC/POS commands for thermal printer
        const challanText = generateChallanText();
        
        // Check if we're on mobile
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (isMobile && navigator.share) {
            // Create a text file that thermal printer apps can read
            const blob = new Blob([challanText], { type: 'text/plain' });
            const file = new File([blob], 'challan.txt', { type: 'text/plain' });
            
            try {
                await navigator.share({
                    files: [file],
                    title: 'Print Challan',
                    text: 'Open with thermal printer app'
                });
            } catch (shareError) {
                // Fallback: Open in new window for copying
                const printWindow = window.open('', '_blank');
                printWindow.document.write('<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">' + challanText + '</pre>');
                printWindow.document.write('<p>Copy this text and paste in your thermal printer app (Thermal Printer, Raw BT, etc.)</p>');
            }
        } else {
            // Desktop: Show text to copy
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print Challan</title>
                    <style>
                        body { font-family: monospace; padding: 20px; }
                        pre { background: #f5f5f5; padding: 15px; border: 1px solid #ddd; white-space: pre-wrap; }
                        button { padding: 10px 20px; background: #2196F3; color: white; border: none; cursor: pointer; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <h3>Copy and paste this in your thermal printer app:</h3>
                    <button onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent); alert('Copied!')">Copy Text</button>
                    <pre>${challanText}</pre>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Print error:', error);
        alert('Error preparing print. Please try regular print option.');
    }
});

// Generate challan text for thermal printer
function generateChallanText() {
    const dcRef = document.getElementById('displayDcRef').textContent;
    const date = document.getElementById('displayDate').textContent;
    const party = document.getElementById('displayParty').textContent;
    const loading = document.getElementById('displayLoading').textContent;
    const unloading = document.getElementById('displayUnloading').textContent;
    const transport = document.getElementById('displayTransport').textContent;
    const truck = document.getElementById('displayTruck').textContent;
    const item = document.getElementById('displayItem').textContent;
    const hsn = document.getElementById('displayHsn').textContent;
    const emptyQty = document.getElementById('displayEmptyQty').textContent;
    const fullQty = document.getElementById('displayFullQty').textContent;
    const netQty = document.getElementById('displayNetQty').textContent;
    const paymentMode = document.getElementById('displayPaymentMode').textContent;

    // Plain text format for thermal printer apps
    return `
--------------------------------
     Delivery Challan
--------------------------------
Date: ${date}
DC/Ref #: ${dcRef}
--------------------------------
     OUTGOING TRIP
--------------------------------

Party:            ${party}
Loading:          ${loading}
UnLoading:        ${unloading}
Transport:        ${transport}
Truck #:          ${truck}
Item:             ${item}
HSN/SAC:          ${hsn}
Empty Qty:        ${emptyQty}
Full Qty:         ${fullQty}
Net Qty:          ${netQty}
Payment Mode      ${paymentMode}

--------------------------------


`;
}
