// Use environment variable for API URL, fallback to production URL
// Note: Trailing slash is important for proper URL concatenation
const BaseUrl = import.meta.env.VITE_API_URL || 'https://zirakbook.alexandratechlab.com/api/v1/';

export default BaseUrl;