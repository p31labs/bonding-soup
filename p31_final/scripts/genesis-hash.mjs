/**
 * scripts/genesis-hash.mjs
 * Purpose: Verifiable audit trail hashing for the Genesis Block.
 */

import { createHash } from 'crypto';

export const hashRecord = (record, previousHash) => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(record) + previousHash);
  return hash.digest('hex');
};

export const verifyChain = (records) => {
  let previousHash = '0'; // Genesis previous hash
  for (const record of records) {
    const currentHash = hashRecord(record.data, previousHash);
    if (currentHash !== record.hash) return false;
    previousHash = currentHash;
  }
  return true;
};
