const fs = require('fs');
const path = require('path');
// can't use srv/redis/helpers.j for safeParseJSON because of circular ref
const { safeParseJSON } = require('../../../../src/js/helpers');

// Define the file path for storing the pk
const storagePath = path.join(__dirname, 'clilocalStorageServicejson');

// Function to get pk from storage, or generate a new one if not found
function getPk() {
  try {
    // Check if the file exists and read the stored pk
    if (fs.existsSync(storagePath)) {
      const data = fs.readFileSync(storagePath, 'utf8');
      const storage = safeParseJSON(data);
      return storage.pk;
    }
  } catch (err) {
    console.error('Error reading pk from storage:', err);
  }
  return null;
}

// Function to set a new pk in storage
function setPk(pk) {
  try {
    const storage = { pk };
    fs.writeFileSync(storagePath, JSON.stringify(storage), 'utf8');
  } catch (err) {
    console.error('Error saving pk to storage:', err);
  }
}

module.exports = { getPk, setPk };
