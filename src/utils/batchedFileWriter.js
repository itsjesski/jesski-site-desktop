// Reusable batched file I/O utility to reduce disk operations
import fs from 'fs';
import path from 'path';

class BatchedFileWriter {
  constructor(batchDelayMs = 1000) {
    this.batchDelayMs = batchDelayMs;
    this.pendingWrites = new Map(); // filePath -> { data, resolve, reject }
    this.writeTimers = new Map(); // filePath -> timer
  }

  /**
   * Queue a file write operation that will be batched with other writes
   * @param {string} filePath - Absolute path to the file
   * @param {any} data - Data to write (will be JSON.stringified)
   * @param {number} [spaces=2] - Number of spaces for JSON formatting
   * @returns {Promise<void>} - Resolves when the file is written
   */
  writeFile(filePath, data, spaces = 2) {
    return new Promise((resolve, reject) => {
      // Store the pending write
      this.pendingWrites.set(filePath, { data, resolve, reject, spaces });

      // Clear existing timer if there is one
      if (this.writeTimers.has(filePath)) {
        clearTimeout(this.writeTimers.get(filePath));
      }

      // Set a new timer for this file
      const timer = setTimeout(() => {
        this._performWrite(filePath);
      }, this.batchDelayMs);

      this.writeTimers.set(filePath, timer);
    });
  }

  /**
   * Force immediate write of all pending operations for a specific file
   * @param {string} filePath - Path to flush immediately
   */
  flushFile(filePath) {
    if (this.writeTimers.has(filePath)) {
      clearTimeout(this.writeTimers.get(filePath));
      this.writeTimers.delete(filePath);
    }
    
    if (this.pendingWrites.has(filePath)) {
      this._performWrite(filePath);
    }
  }

  /**
   * Force immediate write of all pending operations
   */
  flushAll() {
    const filePaths = Array.from(this.pendingWrites.keys());
    filePaths.forEach(filePath => this.flushFile(filePath));
  }

  /**
   * Clear all pending writes and timers (useful for cleanup)
   */
  clear() {
    // Clear all timers
    for (const timer of this.writeTimers.values()) {
      clearTimeout(timer);
    }
    this.writeTimers.clear();

    // Reject all pending writes
    for (const { reject } of this.pendingWrites.values()) {
      reject(new Error('Write operation cancelled'));
    }
    this.pendingWrites.clear();
  }

  /**
   * Private method to perform the actual write operation
   * @param {string} filePath - Path to write to
   */
  _performWrite(filePath) {
    const writeData = this.pendingWrites.get(filePath);
    if (!writeData) return;

    const { data, resolve, reject, spaces } = writeData;

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the file
      const jsonString = JSON.stringify(data, null, spaces);
      fs.writeFileSync(filePath, jsonString, 'utf-8');

      // Clean up
      this.pendingWrites.delete(filePath);
      this.writeTimers.delete(filePath);

      // Resolve the promise
      resolve();
    } catch (err) {
      // Clean up
      this.pendingWrites.delete(filePath);
      this.writeTimers.delete(filePath);

      // Reject the promise
      reject(err);
    }
  }

  /**
   * Get statistics about pending operations
   */
  getStats() {
    return {
      pendingWrites: this.pendingWrites.size,
      activeTimers: this.writeTimers.size,
      files: Array.from(this.pendingWrites.keys())
    };
  }
}

// Create a default instance for common use
export const defaultBatchWriter = new BatchedFileWriter(1000);

// Export the class for creating custom instances
export { BatchedFileWriter };

// Convenience function for simple use cases
export function batchWriteJSON(filePath, data, spaces = 2) {
  return defaultBatchWriter.writeFile(filePath, data, spaces);
}

// Convenience function to flush all pending writes (useful for graceful shutdown)
export function flushAllWrites() {
  return defaultBatchWriter.flushAll();
}
