// Enhanced ECC implementation with encryption/decryption

class ECC {
    constructor() {
        this.curve = 'P-256';
        this.curveParams = this.getCurveParameters(this.curve);
    }

    setCurve(curveName) {
        this.curve = curveName;
        this.curveParams = this.getCurveParameters(curveName);
    }

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
                cofactor: '1'
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
                cofactor: '1'
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
                cofactor: '1'
            }
        };
        return params[curveName];
    }

    async generateKeyPair() {
        try {
            // Check if Web Crypto API is available
            if (!window.crypto || !window.crypto.subtle) {
                throw new Error('Web Crypto API requires HTTPS. Please access via HTTPS or deploy to a secure hosting platform (Heroku, Railway, etc.)');
            }

            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDH",
                    namedCurve: this.curve
                },
                true,
                ["deriveKey", "deriveBits"]
            );

            if (!keyPair || !keyPair.privateKey || !keyPair.publicKey) {
                throw new Error('Failed to generate key pair');
            }

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
            throw new Error(`Key generation failed: ${error.message}`);
        }
    }

    async exportPrivateKey(key) {
        try {
            const exported = await window.crypto.subtle.exportKey("jwk", key);
            if (!exported || !exported.d) {
                throw new Error('Failed to export private key');
            }
            return exported.d;
        } catch (error) {
            console.error("Error exporting private key:", error);
            throw new Error(`Private key export failed: ${error.message}`);
        }
    }

    async exportPublicKey(key) {
        try {
            const exported = await window.crypto.subtle.exportKey("jwk", key);
            if (!exported || !exported.x || !exported.y) {
                throw new Error('Failed to export public key');
            }
            return exported;
        } catch (error) {
            console.error("Error exporting public key:", error);
            throw new Error(`Public key export failed: ${error.message}`);
        }
    }
    
    formatPublicKeyForDisplay(publicKeyJwk) {
        if (!publicKeyJwk || !publicKeyJwk.x || !publicKeyJwk.y) {
            return 'N/A';
        }
        return `x: ${publicKeyJwk.x}\ny: ${publicKeyJwk.y}`;
    }

    async importPublicKey(publicKeyJwk) {
        try {
            const importedKey = await window.crypto.subtle.importKey(
                "jwk",
                publicKeyJwk,
                {
                    name: "ECDH",
                    namedCurve: this.curve
                },
                true,
                []
            );
            return importedKey;
        } catch (error) {
            console.error("Error importing public key:", error);
            throw new Error(`Public key import failed: ${error.message}`);
        }
    }

    async deriveSharedSecret(myPrivateKey, theirPublicKey) {
        try {
            const sharedSecret = await window.crypto.subtle.deriveKey(
                {
                    name: "ECDH",
                    public: theirPublicKey
                },
                myPrivateKey,
                {
                    name: "AES-GCM",
                    length: 256
                },
                true,
                ["encrypt", "decrypt"]
            );
            
            return sharedSecret;
        } catch (error) {
            console.error("Error deriving shared secret:", error);
            throw new Error(`Shared secret derivation failed: ${error.message}`);
        }
    }

    async encrypt(message, sharedSecret) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                    tagLength: 128
                },
                sharedSecret,
                data
            );
            
            // Split ciphertext and tag
            const ciphertext = new Uint8Array(encrypted.slice(0, -16));
            const tag = new Uint8Array(encrypted.slice(-16));
            
            return {
                ciphertext: this.arrayBufferToBase64(ciphertext),
                iv: this.arrayBufferToBase64(iv),
                tag: this.arrayBufferToBase64(tag)
            };
        } catch (error) {
            console.error("Encryption error:", error);
            throw error;
        }
    }

    async decrypt(ciphertextB64, sharedSecret, ivB64, tagB64) {
        try {
            const ciphertext = this.base64ToArrayBuffer(ciphertextB64);
            const iv = this.base64ToArrayBuffer(ivB64);
            const tag = this.base64ToArrayBuffer(tagB64);
            
            // Combine ciphertext and tag
            const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
            combined.set(new Uint8Array(ciphertext), 0);
            combined.set(new Uint8Array(tag), ciphertext.byteLength);
            
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                    tagLength: 128
                },
                sharedSecret,
                combined
            );
            
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error("Decryption error:", error);
            throw error;
        }
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    formatKeyForDisplay(key, maxLength = 60) {
        if (!key) {
            return 'N/A';
        }
        if (key.length > maxLength) {
            return key.substring(0, maxLength) + '...';
        }
        return key;
    }

    getCurveDetails() {
        return this.curveParams || {};
    }
}
