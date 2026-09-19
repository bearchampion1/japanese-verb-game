import CryptoJS from 'crypto-js';

// 使用環境變數作為密鑰，如果沒有則使用預設密鑰
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'japanese-verb-game-super-secret-key-2024';

export const encryptData = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

export const decryptData = (encryptedStr) => {
  try {
    if (!encryptedStr) return null;
    const bytes = CryptoJS.AES.decrypt(encryptedStr, SECRET_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedStr) {
        return null;
    }
    
    return JSON.parse(decryptedStr);
  } catch (error) {
    // 解密失敗時回傳 null
    return null;
  }
};
