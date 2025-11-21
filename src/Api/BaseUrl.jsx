// Use environment variable for API URL, fallback to production URL
// Note: NO trailing slash - paths will include leading slash
const BaseUrl = import.meta.env.VITE_API_URL || 'https://zirakbook.alexandratechlab.com/api/v1';

export default BaseUrl;