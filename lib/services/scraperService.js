import axios from 'axios';
import * as cheerio from 'cheerio';

class ScraperService {
  /**
   * Fetch and parse page content from URL
   * @param {string} url - URL to fetch
   * @returns {Promise<Object>} - Parsed content with title, description, and text
   */
  async fetchPageContent(url) {
    try {
      // Validate URL
      const urlObj = new URL(url);

      // Fetch the page with browser-like headers
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Accept 4xx responses to handle them
      });

      // Check for 403 or other access errors
      if (response.status === 403) {
        throw new Error('Access forbidden - website is blocking automated access');
      }
      if (response.status === 401) {
        throw new Error('Authentication required - website requires login');
      }
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: Unable to access website`);
      }

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract title
      const title = this.extractTitle($);

      // Extract meta description
      const metaDescription = this.extractMetaDescription($);

      // Extract main text content
      const mainText = this.extractMainText($);

      // Extract Open Graph data (often more reliable)
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');

      // Use best available data
      const name = ogTitle || title || 'Untitled';
      const description = ogDescription || metaDescription || mainText.substring(0, 300) || '';

      // Extract tags automatically
      const tags = this.extractTags($, name, description, urlObj);

      return {
        name: name.trim(),
        description: description.trim(),
        fullText: mainText.substring(0, 2000).trim(),
        tags: tags,
        url: url
      };
    } catch (error) {
      console.error('Error fetching page content:', error.message);

      if (error.code === 'ENOTFOUND' || error.code === 'ERR_INVALID_URL') {
        throw new Error('Invalid or unreachable URL');
      }

      throw new Error(`Failed to fetch page: ${error.message}`);
    }
  }

  /**
   * Extract page title
   */
  extractTitle($) {
    return $('title').first().text() ||
           $('h1').first().text() ||
           '';
  }

  /**
   * Extract meta description
   */
  extractMetaDescription($) {
    return $('meta[name="description"]').attr('content') ||
           $('meta[property="description"]').attr('content') ||
           '';
  }

  /**
   * Extract main text content from page
   */
  extractMainText($) {
    // Remove script, style, and other non-content elements
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();

    // Try to find main content area
    let mainContent = $('main').text() ||
                     $('article').text() ||
                     $('[role="main"]').text() ||
                     $('body').text();

    // Clean up whitespace
    mainContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();

    return mainContent;
  }

  /**
   * Extract tags automatically from page metadata and content
   */
  extractTags($, title, description, urlObj) {
    const tags = new Set();

    // 1. Extract meta keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      metaKeywords.split(',').forEach(keyword => {
        const cleaned = keyword.trim().toLowerCase();
        if (cleaned && cleaned.length > 2) {
          tags.add(cleaned);
        }
      });
    }

    // 2. Extract Open Graph tags/categories
    const ogType = $('meta[property="og:type"]').attr('content');
    if (ogType && ogType !== 'website') {
      tags.add(ogType.toLowerCase());
    }

    // 3. Extract from URL domain (e.g., "notion.so" -> "notion")
    const domain = urlObj.hostname.replace('www.', '');
    const domainParts = domain.split('.');
    if (domainParts[0] && domainParts[0].length > 2) {
      tags.add(domainParts[0]);
    }

    // 4. Extract common category keywords from title and description
    const commonKeywords = this.extractKeywords(title + ' ' + description);
    commonKeywords.forEach(keyword => tags.add(keyword));

    // 5. Detect common product categories from content
    const categories = this.detectCategories(title + ' ' + description);
    categories.forEach(category => tags.add(category));

    // Convert to array and limit to top 10 tags
    return Array.from(tags).slice(0, 10);
  }

  /**
   * Extract meaningful keywords from text
   */
  extractKeywords(text) {
    const keywords = new Set();

    // Common stop words to ignore
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
      'can', 'your', 'you', 'we', 'our', 'their', 'this', 'that', 'these', 'those'
    ]);

    // Extract words (2+ chars, letters only)
    const words = text.toLowerCase()
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Count word frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top 5 most frequent words
    const topWords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    topWords.forEach(word => keywords.add(word));

    return Array.from(keywords);
  }

  /**
   * Detect product categories from text
   */
  detectCategories(text) {
    const categories = new Set();
    const lowerText = text.toLowerCase();

    // Category detection patterns
    const categoryPatterns = {
      'saas': /\b(saas|software as a service|cloud software)\b/,
      'productivity': /\b(productivity|task|todo|workflow|organization)\b/,
      'design': /\b(design|ui|ux|interface|figma|sketch)\b/,
      'development': /\b(developer|development|code|coding|programming|api)\b/,
      'analytics': /\b(analytics|tracking|metrics|data|statistics)\b/,
      'collaboration': /\b(collaboration|team|collaborate|share|sharing)\b/,
      'project-management': /\b(project management|project|management|planning)\b/,
      'communication': /\b(communication|chat|messaging|slack|discord)\b/,
      'marketing': /\b(marketing|email|campaign|seo|social media)\b/,
      'ecommerce': /\b(ecommerce|e-commerce|shop|store|shopping|cart)\b/,
      'finance': /\b(finance|accounting|invoice|payment|billing)\b/,
      'crm': /\b(crm|customer|sales|lead)\b/,
      'ai': /\b(ai|artificial intelligence|machine learning|ml|gpt)\b/,
      'automation': /\b(automation|automate|workflow|integration)\b/,
      'no-code': /\b(no-code|low-code|nocode|lowcode)\b/
    };

    Object.entries(categoryPatterns).forEach(([category, pattern]) => {
      if (pattern.test(lowerText)) {
        categories.add(category);
      }
    });

    return Array.from(categories);
  }

  /**
   * Validate and normalize URL
   */
  validateUrl(url) {
    try {
      const urlObj = new URL(url);

      // Only allow http and https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }

      return urlObj.href;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Fetch pricing information from the product's pricing page
   * @param {string} baseUrl - Base URL of the product
   * @returns {Promise<Object>} - Pricing information
   */
  async fetchPricingInfo(baseUrl) {
    try {
      const urlObj = new URL(baseUrl);
      const commonPricingPaths = ['/pricing', '/plans', '/buy', '/purchase', '/pricing-plans', '/price'];
      
      let pricingText = '';
      let pricingFound = false;

      // Try common pricing page URLs
      for (const path of commonPricingPaths) {
        try {
          const pricingUrl = `${urlObj.origin}${path}`;
          const response = await axios.get(pricingUrl, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            },
            validateStatus: (status) => status < 500
          });

          const $ = cheerio.load(response.data);
          
          // Extract pricing information
          const priceElements = $('[class*="price"], [class*="pricing"], [id*="price"], [id*="pricing"]');
          if (priceElements.length > 0) {
            pricingText = priceElements.map((i, el) => $(el).text()).get().join(' ').substring(0, 500);
            pricingFound = true;
            console.log(`Found pricing info at: ${pricingUrl}`);
            break;
          }
        } catch (err) {
          // Continue to next pricing path
          continue;
        }
      }

      return {
        hasPricing: pricingFound,
        pricingInfo: pricingText.trim() || null
      };
    } catch (error) {
      console.log('Could not fetch pricing info:', error.message);
      return {
        hasPricing: false,
        pricingInfo: null
      };
    }
}
}

const scraperService = new ScraperService();

export default scraperService;
