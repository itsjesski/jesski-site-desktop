import { apiCall } from '../api/client'

export interface AffirmationResponse {
  affirmation: string
  id: number
  timestamp: string
  totalCount: number
}

class AffirmationsService {
  private readonly apiKey = 'desktop-notifications'

  async getRandomAffirmation(): Promise<string> {
    const data = await apiCall('/api/affirmations/random', {
      headers: {
        'x-api-key': this.apiKey
      }
    }) as AffirmationResponse
    
    return data.affirmation
  }
}

export const affirmationsService = new AffirmationsService()
