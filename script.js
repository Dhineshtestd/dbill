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
        // Request Bluetooth device
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

        // Generate ESC/POS commands for thermal printer
        const challanText = generateChallanText();
        const encoder = new TextEncoder();
        const data = encoder.encode(challanText);

        await characteristic.writeValue(data);
        alert('Printed successfully!');
    } catch (error) {
        console.error('Bluetooth print error:', error);
        alert('Bluetooth printing failed. Make sure your printer is paired and supports Bluetooth printing.\n\nError: ' + error.message);
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

    // ESC/POS formatting
    const ESC = '\x1B';
    const INIT = ESC + '@';
    const CENTER = ESC + 'a' + '\x01';
    const LEFT = ESC + 'a' + '\x00';
    const BOLD_ON = ESC + 'E' + '\x01';
    const BOLD_OFF = ESC + 'E' + '\x00';
    const CUT = ESC + 'i';
    const LINE = '--------------------------------\n';

    return INIT +
        LINE +
        CENTER + 'Delivery Challan\n' +
        LEFT + 'Date: ' + date + '\n' +
        'DC/Ref #: ' + dcRef + '\n' +
        LINE +
        CENTER + BOLD_ON + 'OUTGOING TRIP\n' + BOLD_OFF +
        LEFT +
        'Party:            ' + party + '\n' +
        'Loading:          ' + loading + '\n' +
        'UnLoading:        ' + unloading + '\n' +
        'Transport:        ' + transport + '\n' +
        'Truck #:          ' + truck + '\n' +
        'Item:             ' + item + '\n' +
        'HSN/SAC:          ' + hsn + '\n' +
        'Empty Qty:        ' + emptyQty + '\n' +
        'Full Qty:         ' + fullQty + '\n' +
        'Net Qty:          ' + netQty + '\n' +
        'Payment Mode      ' + paymentMode + '\n' +
        LINE +
        '\n\n\n' +
        CUT;
}
