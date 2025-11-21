// Use environment variable for API URL, fallback to production URL
const BaseUrl = import.meta.env.VITE_API_URL || 'https://zirakbook.alexandratechlab.com/api/v1';

export default BaseUrl;