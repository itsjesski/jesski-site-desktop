import { API_ENDPOINTS, authApiCall } from './client'

export interface AffirmationResponse {
  affirmation: string
  id: number
  timestamp: string
  totalCount: number
}

export interface MultipleAffirmationsResponse {
  affirmations: Array<{
    affirmation: string
    id: number
  }>
  count: number
  timestamp: string
  totalCount: number
}

class AffirmationsService {
  async getRandomAffirmation(): Promise<string> {
    try {
      const data = await authApiCall(API_ENDPOINTS.affirmations.random) as AffirmationResponse;
      return data.affirmation;
    } catch (error) {
      console.error('Error fetching affirmation:', error);
      return 'You are doing great today!';
    }
  }
  
  async getMultipleAffirmations(count: number = 5): Promise<string[]> {
    try {
      const endpoint = `${API_ENDPOINTS.affirmations.multiple}?count=${count}`;
      const data = await authApiCall(endpoint) as MultipleAffirmationsResponse;
      
      return data.affirmations.map(item => item.affirmation);
    } catch (error) {
      console.error('Error fetching multiple affirmations:', error);
      return ['You are doing great today!'];
    }
  }
}

export const affirmationsService = new AffirmationsService()
