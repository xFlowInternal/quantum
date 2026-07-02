// Application logic for ECC Chat Demo

// Initialize ECC instance
const ecc = new ECC();

// Store user keys
let user1KeyPair = null;
let user2KeyPair = null;

// DOM Elements
const curveSelect = document.getElementById('curveSelect');
const showCurveDetailsBtn = document.getElementById('showCurveDetails');
const curveDetailsDiv = document.getElementById('curveDetails');

const generateUser1Btn = document.getElementById('generateUser1');
const generateUser2Btn = document.getElementById('generateUser2');
const shareUser1Btn = document.getElementById('shareUser1');
const shareUser2Btn = document.getElementById('shareUser2');

// Curve selection handler
curveSelect.addEventListener('change', (e) => {
    ecc.setCurve(e.target.value);
    curveDetailsDiv.classList.add('hidden');
    showCurveDetailsBtn.textContent = 'Show Curve Details';
    
    // Reset keys if curve changes
    if (user1KeyPair || user2KeyPair) {
        if (confirm('Changing the curve will reset all keys. Continue?')) {
            resetAll();
        } else {
            curveSelect.value = ecc.curve;
        }
    }
});

// Show/hide curve details
showCurveDetailsBtn.addEventListener('click', () => {
    if (curveDetailsDiv.classList.contains('hidden')) {
        displayCurveDetails();
        curveDetailsDiv.classList.remove('hidden');
        showCurveDetailsBtn.textContent = 'Hide Curve Details';
    } else {
        curveDetailsDiv.classList.add('hidden');
        showCurveDetailsBtn.textContent = 'Show Curve Details';
    }
});

// Display curve parameters
function displayCurveDetails() {
    const params = ecc.getCurveDetails();
    
    document.getElementById('primeField').textContent = params.primeField;
    document.getElementById('generatorPoint').innerHTML = 
        `G = (Gx, Gy)<br>Gx = ${params.generatorX}<br>Gy = ${params.generatorY}`;
    document.getElementById('groupOrder').textContent = 
        `n = ${params.orderDecimal}\nHex: ${params.order}`;
    document.getElementById('cofactor').textContent = params.cofactor;
}

// Generate keys for User 1
generateUser1Btn.addEventListener('click', async () => {
    generateUser1Btn.disabled = true;
    generateUser1Btn.textContent = 'Generating...';
    
    try {
        user1KeyPair = await ecc.generateKeyPair();
        displayUser1Keys();
        shareUser1Btn.disabled = false;
        generateUser1Btn.textContent = '✓ Keys Generated';
        generateUser1Btn.style.background = '#48bb78';
        
        updateInfoText('User 1 keys generated! Now generate keys for User 2.');
    } catch (error) {
        alert('Error generating keys: ' + error.message);
        generateUser1Btn.disabled = false;
        generateUser1Btn.textContent = 'Generate Keys';
    }
});

// Generate keys for User 2
generateUser2Btn.addEventListener('click', async () => {
    generateUser2Btn.disabled = true;
    generateUser2Btn.textContent = 'Generating...';
    
    try {
        user2KeyPair = await ecc.generateKeyPair();
        displayUser2Keys();
        shareUser2Btn.disabled = false;
        generateUser2Btn.textContent = '✓ Keys Generated';
        generateUser2Btn.style.background = '#48bb78';
        
        updateInfoText('Both users have generated their keys! Now share public keys.');
    } catch (error) {
        alert('Error generating keys: ' + error.message);
        generateUser2Btn.disabled = false;
        generateUser2Btn.textContent = 'Generate Keys';
    }
});

// Display User 1 keys
function displayUser1Keys() {
    const keysDiv = document.getElementById('user1Keys');
    keysDiv.classList.remove('hidden');
    
    document.getElementById('user1PrivateKey').textContent = 
        ecc.formatKeyForDisplay(user1KeyPair.privateKey);
    document.getElementById('user1PublicKey').textContent = 
        user1KeyPair.publicKey;
}

// Display User 2 keys
function displayUser2Keys() {
    const keysDiv = document.getElementById('user2Keys');
    keysDiv.classList.remove('hidden');
    
    document.getElementById('user2PrivateKey').textContent = 
        ecc.formatKeyForDisplay(user2KeyPair.privateKey);
    document.getElementById('user2PublicKey').textContent = 
        user2KeyPair.publicKey;
}

// Share User 1's public key to User 2
shareUser1Btn.addEventListener('click', () => {
    if (!user1KeyPair) {
        alert('Please generate keys first!');
        return;
    }
    
    // Simulate sending public key
    shareUser1Btn.disabled = true;
    shareUser1Btn.textContent = 'Sending...';
    
    setTimeout(() => {
        document.getElementById('user1Sent').classList.remove('hidden');
        shareUser1Btn.textContent = '✓ Sent';
        
        // User 2 receives the key
        setTimeout(() => {
            receiveKeyUser2(user1KeyPair.publicKey);
        }, 500);
    }, 1000);
});

// Share User 2's public key to User 1
shareUser2Btn.addEventListener('click', () => {
    if (!user2KeyPair) {
        alert('Please generate keys first!');
        return;
    }
    
    // Simulate sending public key
    shareUser2Btn.disabled = true;
    shareUser2Btn.textContent = 'Sending...';
    
    setTimeout(() => {
        document.getElementById('user2Sent').classList.remove('hidden');
        shareUser2Btn.textContent = '✓ Sent';
        
        // User 1 receives the key
        setTimeout(() => {
            receiveKeyUser1(user2KeyPair.publicKey);
        }, 500);
    }, 1000);
});

// User 1 receives User 2's public key
function receiveKeyUser1(publicKey) {
    const receivedDiv = document.getElementById('user1Received');
    receivedDiv.classList.remove('hidden');
    document.getElementById('user1ReceivedKey').textContent = publicKey;
    
    checkBothKeysExchanged();
}

// User 2 receives User 1's public key
function receiveKeyUser2(publicKey) {
    const receivedDiv = document.getElementById('user2Received');
    receivedDiv.classList.remove('hidden');
    document.getElementById('user2ReceivedKey').textContent = publicKey;
    
    checkBothKeysExchanged();
}

// Check if both users have exchanged keys
function checkBothKeysExchanged() {
    const user1Received = !document.getElementById('user1Received').classList.contains('hidden');
    const user2Received = !document.getElementById('user2Received').classList.contains('hidden');
    
    if (user1Received && user2Received) {
        updateInfoText('✓ Key exchange complete! Both users have each other\'s public keys. Ready for encryption!');
    }
}

// Update info text
function updateInfoText(text) {
    document.getElementById('infoText').innerHTML = `<p>${text}</p>`;
}

// Reset all
function resetAll() {
    user1KeyPair = null;
    user2KeyPair = null;
    
    // Reset User 1
    document.getElementById('user1Keys').classList.add('hidden');
    document.getElementById('user1Sent').classList.add('hidden');
    document.getElementById('user1Received').classList.add('hidden');
    generateUser1Btn.disabled = false;
    generateUser1Btn.textContent = 'Generate Keys';
    generateUser1Btn.style.background = '#667eea';
    shareUser1Btn.disabled = true;
    shareUser1Btn.textContent = 'Send Public Key to User 2';
    
    // Reset User 2
    document.getElementById('user2Keys').classList.add('hidden');
    document.getElementById('user2Sent').classList.add('hidden');
    document.getElementById('user2Received').classList.add('hidden');
    generateUser2Btn.disabled = false;
    generateUser2Btn.textContent = 'Generate Keys';
    generateUser2Btn.style.background = '#667eea';
    shareUser2Btn.disabled = true;
    shareUser2Btn.textContent = 'Send Public Key to User 1';
    
    updateInfoText('<p><strong>Step 1:</strong> Click "Generate Keys" for both users to create their ECC key pairs.</p><p><strong>Step 2:</strong> Share public keys between users (private keys stay secret!).</p><p><strong>Step 3:</strong> Both users receive each other\'s public keys.</p>');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    displayCurveDetails();
});
