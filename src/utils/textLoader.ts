import type { TextFile } from '../types/text'

// Function to get text file content dynamically from the text folder
export const getTextFile = async (fileName: string): Promise<TextFile | null> => {
  // Additional security: validate filename before dynamic import
  if (!fileName || typeof fileName !== 'string') {
    return null;
  }
  
  // Auto-append .txt if not present (for cleaner URLs)
  const fullFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
  
  // Must be a .txt file with safe characters only
  if (!fullFileName.endsWith('.txt') || !/^[a-zA-Z0-9\-_\s]+\.txt$/.test(fullFileName)) {
    console.warn('Invalid filename for text import:', fullFileName);
    return null;
  }
  
  // Length check
  if (fullFileName.length > 100) {
    console.warn('Filename too long:', fullFileName);
    return null;
  }
  
  try {
    // Fetch from public directory - works in both dev and production
    const response = await fetch(`/text/${fullFileName}`);
    
    if (!response.ok) {
      console.warn(`Text file not found: ${fullFileName}`);
      return null;
    }
    
    const content = await response.text();
    
    return {
      fileName: fullFileName,
      displayName: fileName.replace('.txt', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: content
    }
  } catch (error) {
    // File doesn't exist or can't be loaded
    console.warn(`Text file not found: ${fullFileName}`)
    return null
  }
}

// Function to check if a file exists (uses public directory)
export const textFileExists = async (fileName: string): Promise<boolean> => {
  try {
    // Auto-append .txt if not present
    const fullFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    const response = await fetch(`/text/${fullFileName}`);
    return response.ok;
  } catch {
    return false
  }
}
