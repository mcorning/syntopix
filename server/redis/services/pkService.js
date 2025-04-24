// src/js/pkManager.js

import RedisService  from "./redisService.js"

const PK_STREAM_KEY = "syntopix"; // Concise key for PKs

/**
 * Retrieve an existing PK or generate a new one if none exists.
 * @returns {Promise<string>} - The existing or newly generated PK.
 */
function createPk() {
  console.log(`Generating new PK...`);
  return RedisService.addToStream(PK_STREAM_KEY, "*", "creator", Date.now()).then((newPk) => {
    console.log(`New PK created: ${newPk}`);
    return newPk;
  });
};

export { createPk };
