// ECC implementation for educational purposes
// Demonstrates elliptic curve cryptography concepts

class ECC {
    constructor() {
        this.curve = 'P-256'; // Default NIST P-256 curve
        this.curveParams = this.getCurveParameters(this.curve);
    }

    // Set the curve to use
    setCurve(curveName) {
        this.curve = curveName;
        this.curveParams = this.getCurveParameters(curveName);
    }

    // Get curve parameters for educational display
    getCurveParameters(curveName) {
        const params = {
            'P-256': {
                name: 'P-256 (secp256r1)',
                bits: 256,
                primeField: '2^256 - 2^224 + 2^192 + 2^96 - 1',
                primeFieldHex: 'FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF',
                generatorX: '6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296',
                generatorY: '4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5',
                order: 'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551',
                orderDecimal: '2^256 - 2^224 + 2^192 - 89188191075325690597107910205041859247',
                cofactor: '1',
                equation: 'y² = x³ - 3x + b (mod p)'
            },
            'P-384': {
                name: 'P-384 (secp384r1)',
                bits: 384,
                primeField: '2^384 - 2^128 - 2^96 + 2^32 - 1',
                primeFieldHex: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF',
                generatorX: 'AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7',
                generatorY: '3617DE4A96262C6F5D9E98BF9292DC29F8F41DBD289A147CE9DA3113B5F0B8C00A60B1CE1D7E819D7A431D7C90EA0E5F',
                order: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973',
                orderDecimal: '2^384 - 2^128 - 2^96 + 2^32 - 1317624576693539401658278297106630...',
                cofactor: '1',
                equation: 'y² = x³ - 3x + b (mod p)'
            },
            'P-521': {
                name: 'P-521 (secp521r1)',
                bits: 521,
                primeField: '2^521 - 1',
                primeFieldHex: '01FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
                generatorX: '00C6858E06B70404E9CD9E3ECB662395B4429C648139053FB521F828AF606B4D3DBAA14B5E77EFE75928FE1DC127A2FFA8DE3348B3C1856A429BF97E7E31C2E5BD66',
                generatorY: '011839296A789A3BC0045C8A5FB42C7D1BD998F54449579B446817AFBD17273E662C97EE72995EF42640C550B9013FAD0761353C7086A272C24088BE94769FD16650',
                order: '01FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409',
                orderDecimal: '2^521 - 1 (Mersenne prime)',
                cofactor: '1',
                equation: 'y² = x³ - 3x + b (mod p)'
            }
        };
        return params[curveName];
    }

    // Generate a key pair
    async generateKeyPair() {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDH",
                    namedCurve: this.curve
                },
                true,
                ["deriveKey", "deriveBits"]
            );

            // Export keys to readable format
            const privateKey = await this.exportPrivateKey(keyPair.privateKey);
            const publicKey = await this.exportPublicKey(keyPair.publicKey);

            return {
                privateKey: privateKey,
                publicKey: publicKey,
                privateKeyRaw: keyPair.privateKey,
                publicKeyRaw: keyPair.publicKey
            };
        } catch (error) {
            console.error("Error generating key pair:", error);
            throw error;
        }
    }

    // Export private key to base64url string
    async exportPrivateKey(key) {
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        return exported.d; // Private key component (base64url encoded)
    }

    // Export public key with x and y coordinates
    async exportPublicKey(key) {
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        return `x: ${exported.x}\ny: ${exported.y}`;
    }

    // Format key for display (truncate for readability)
    formatKeyForDisplay(key, maxLength = 60) {
        if (key.length > maxLength) {
            return key.substring(0, maxLength) + '...';
        }
        return key;
    }

    // Get curve details for display
    getCurveDetails() {
        return this.curveParams;
    }
}
