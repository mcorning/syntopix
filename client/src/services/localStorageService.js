const CryptoJS = require('crypto-js')

const SECRET_KEY = 'your-secret-key' // Replace with a secure key

const localStorageService = {
  setItem(key, value, sensitive = false) {
    try {
      const data =
        typeof value === 'object' // Check if value is an object (JSON)
          ? JSON.stringify(value)
          : value // Write strings as-is

      const toStore = sensitive ? CryptoJS.AES.encrypt(data, SECRET_KEY).toString() : data

      localStorage.setItem(key, toStore)
    } catch (error) {
      console.error(`Error storing key "${key}" in localStorage:`, error)
    }
  },

  getItem(key, sensitive = false) {
    try {
      const data = localStorage.getItem(key)
      if (!data) return null

      const decrypted = sensitive
        ? CryptoJS.AES.decrypt(data, SECRET_KEY).toString(CryptoJS.enc.Utf8)
        : data

      // If it's JSON, parse it; otherwise, return it as-is
      return /^[{[]/.test(decrypted.trim()) ? JSON.parse(decrypted) : decrypted
    } catch (error) {
      console.error(`Error retrieving or parsing key "${key}" from localStorage:`, error)
      return null
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing key "${key}" from localStorage:`, error)
    }
  },

  clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error(`Error clearing localStorage:`, error)
    }
  },
}

module.exports = localStorageService
