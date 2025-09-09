let apiKey;

export async function getApiKey() {
  if (!apiKey) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/apikey`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch API key: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.secret) {
        throw new Error('API key not found in response');
      }
      apiKey = data.secret;
    } catch (error) {
      console.error('Error fetching API key:', error);
      throw error;
    }
  }
  return apiKey;
}
