/**
 * Secure localStorage wrapper with basic encryption
 */

// Simple encryption key derived from domain and persistent browser fingerprint
const getEncryptionKey = (): string => {
  const domain = window.location.hostname;
  
  // Use a persistent key stored in localStorage (not sessionStorage)
  let persistentKey = localStorage.getItem('jesskey');
  if (!persistentKey) {
    persistentKey = crypto.randomUUID();
    localStorage.setItem('jesskey', persistentKey);
  }
  
  return btoa(domain + persistentKey).slice(0, 32);
};

// Simple XOR encryption (basic obfuscation for local storage)
const encrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const decrypt = (encrypted: string, key: string): string => {
  try {
    const text = atob(encrypted);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
};

export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      const encryptionKey = getEncryptionKey();
      const encrypted = encrypt(value, encryptionKey);
      localStorage.setItem(`jesski_${key}`, encrypted);
    } catch (error) {
      console.warn('Failed to encrypt storage item:', error);
      // Fallback to regular storage
      localStorage.setItem(key, value);
    }
  },

  getItem: (key: string): string | null => {
    try {
      const encryptionKey = getEncryptionKey();
      const encrypted = localStorage.getItem(`jesski_${key}`);
      
      if (!encrypted) {
        // Try fallback to unencrypted key
        return localStorage.getItem(key);
      }
      
      const decrypted = decrypt(encrypted, encryptionKey);
      return decrypted || null;
    } catch (error) {
      console.warn('Failed to decrypt storage item:', error);
      // Fallback to regular storage
      return localStorage.getItem(key);
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(`jesski_${key}`);
    localStorage.removeItem(key); // Clean up legacy keys
  },

  clear: (): void => {
    // Only clear jesski-prefixed items
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('jesski_') || key?.startsWith('jesski-desktop-')) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  }
};
