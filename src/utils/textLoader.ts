import type { TextFile } from '../types/text'

// Registry of available text files with their content
export const textFiles: Record<string, Omit<TextFile, 'content'> & { loader: () => Promise<string> }> = {
  'README.txt': {
    fileName: 'README.txt',
    displayName: 'README.txt',
    loader: async () => {
      const module = await import('../text/README.txt?raw')
      return module.default
    }
  },
  'projects.txt': {
    fileName: 'projects.txt',
    displayName: 'My Projects',
    loader: async () => {
      const module = await import('../text/projects.txt?raw')
      return module.default
    }
  },
  'about.txt': {
    fileName: 'about.txt',
    displayName: 'About Me',
    loader: async () => {
      const module = await import('../text/about.txt?raw')
      return module.default
    }
  },
  'devnotes.txt': {
    fileName: 'devnotes.txt',
    displayName: 'Development Notes',
    loader: async () => {
      const module = await import('../text/devnotes.txt?raw')
      return module.default
    }
  }
}

// Function to get text file content
export const getTextFile = async (fileName: string): Promise<TextFile | null> => {
  const fileInfo = textFiles[fileName]
  if (!fileInfo) {
    return null
  }

  try {
    const content = await fileInfo.loader()
    return {
      fileName: fileInfo.fileName,
      displayName: fileInfo.displayName,
      content
    }
  } catch (error) {
    console.error(`Failed to load text file: ${fileName}`, error)
    return null
  }
}

// Function to get all available text files
export const getAllTextFileInfo = (): Array<Omit<TextFile, 'content'>> => {
  return Object.values(textFiles).map(({ fileName, displayName }) => ({
    fileName,
    displayName
  }))
}

// Function to check if a file exists
export const textFileExists = (fileName: string): boolean => {
  return fileName in textFiles
}
