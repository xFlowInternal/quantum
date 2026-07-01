import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import cryptoService from '../utils/crypto';
import axios from 'axios';

const CryptoContext = createContext(null);

export function CryptoProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [keyPair, setKeyPair] = useState(null);
  const [sharedKeys, setSharedKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize keys on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeKeys();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const initializeKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if keys exist in localStorage
      const storedKeys = cryptoService.getStoredKeys(user.id);

      if (storedKeys.publicKey && storedKeys.privateKey) {
        // Import existing keys
        const publicKey = await cryptoService.importPublicKey(storedKeys.publicKey);
        const privateKey = await crypto.subtle.importKey(
          'pkcs8',
          cryptoService.base64ToArrayBuffer(storedKeys.privateKey),
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );

        setKeyPair({ publicKey, privateKey });
      } else {
        // Generate new keys
        await generateAndStoreKeys();
      }
    } catch (err) {
      console.error('Key initialization error:', err);
      setError('Failed to initialize encryption keys');
    } finally {
      setLoading(false);
    }
  };

  const generateAndStoreKeys = async () => {
    try {
      // Generate new key pair
      const newKeyPair = await cryptoService.generateKeyPair();

      // Export keys
      const publicKeyBase64 = await cryptoService.exportPublicKey(newKeyPair.publicKey);
      const privateKeyExported = await crypto.subtle.exportKey('pkcs8', newKeyPair.privateKey);
      const privateKeyBase64 = cryptoService.arrayBufferToBase64(privateKeyExported);

      // Store locally
      cryptoService.storeKeys(user.id, publicKeyBase64, privateKeyBase64);

      // Upload public key to server
      await axios.put(`/users/${user.id}/keys`, {
        public_key_ecc: publicKeyBase64,
      });

      setKeyPair(newKeyPair);
      return newKeyPair;
    } catch (err) {
      console.error('Key generation error:', err);
      throw new Error('Failed to generate keys');
    }
  };

  const getSharedKey = useCallback(async (otherUserId) => {
    try {
      // Check if we already have a shared key
      if (sharedKeys[otherUserId]) {
        return sharedKeys[otherUserId];
      }

      if (!keyPair) {
        throw new Error('Key pair not initialized');
      }

      // Fetch other user's public key
      const response = await axios.get(`/users/${otherUserId}`);
      const otherPublicKeyBase64 = response.data.user.public_key_ecc;

      if (!otherPublicKeyBase64) {
        throw new Error('Other user has not generated keys yet');
      }

      // Import other user's public key
      const otherPublicKey = await cryptoService.importPublicKey(otherPublicKeyBase64);

      // Derive shared key
      const sharedKey = await cryptoService.deriveSharedKey(keyPair.privateKey, otherPublicKey);

      // Cache the shared key
      setSharedKeys(prev => ({
        ...prev,
        [otherUserId]: sharedKey,
      }));

      return sharedKey;
    } catch (err) {
      console.error('Shared key derivation error:', err);
      throw new Error('Failed to derive shared key');
    }
  }, [keyPair, sharedKeys]);

  const encryptMessage = async (message, recipientId) => {
    try {
      const sharedKey = await getSharedKey(recipientId);
      return await cryptoService.encrypt(message, sharedKey);
    } catch (err) {
      console.error('Message encryption error:', err);
      throw new Error('Failed to encrypt message');
    }
  };

  const decryptMessage = async (ciphertext, iv, senderId) => {
    try {
      const sharedKey = await getSharedKey(senderId);
      return await cryptoService.decrypt(ciphertext, iv, sharedKey);
    } catch (err) {
      console.error('Message decryption error:', err);
      throw new Error('Failed to decrypt message');
    }
  };

  const regenerateKeys = async () => {
    try {
      setLoading(true);
      cryptoService.clearKeys(user.id);
      await generateAndStoreKeys();
      setSharedKeys({}); // Clear cached shared keys
    } catch (err) {
      console.error('Key regeneration error:', err);
      setError('Failed to regenerate keys');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    keyPair,
    loading,
    error,
    encryptMessage,
    decryptMessage,
    regenerateKeys,
    getSharedKey,
  };

  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
}
