/**
 * Tag normalization and synonym mapping service
 * Ensures consistent tagging and category matching
 */

// Synonym groups - tags that should be treated as equivalent
const TAG_SYNONYMS = {
  // Payments
  'payments': ['payment', 'payments', 'checkout', 'billing', 'stripe', 'paypal', 'commerce'],

  // Analytics
  'analytics': ['analytics', 'tracking', 'metrics', 'statistics', 'stats', 'insights'],

  // Productivity
  'productivity': ['productivity', 'automation', 'workflow', 'efficiency', 'tools'],

  // AI
  'ai': ['ai', 'artificial-intelligence', 'machine-learning', 'ml', 'llm', 'gpt'],

  // Developer Tools
  'developer': ['developer', 'dev', 'development', 'coding', 'programming', 'api'],

  // Design
  'design': ['design', 'ui', 'ux', 'graphics', 'visual', 'figma'],

  // Marketing
  'marketing': ['marketing', 'seo', 'advertising', 'growth', 'campaigns'],

  // SaaS
  'saas': ['saas', 'software', 'cloud', 'platform', 'service'],

  // Social
  'social': ['social', 'community', 'network', 'collaboration', 'team'],

  // Security
  'security': ['security', 'auth', 'authentication', 'privacy', 'encryption'],
};

// Create reverse mapping for quick lookup
const SYNONYM_TO_CANONICAL = {};
Object.entries(TAG_SYNONYMS).forEach(([canonical, synonyms]) => {
  synonyms.forEach(synonym => {
    if (!SYNONYM_TO_CANONICAL[synonym]) {
      SYNONYM_TO_CANONICAL[synonym] = [];
    }
    SYNONYM_TO_CANONICAL[synonym].push(canonical);
  });
});

class TagNormalizer {
  /**
   * Normalize tags by adding canonical synonyms
   * @param {string[]} tags - Original tags
   * @returns {string[]} - Normalized tags with synonyms added
   */
  normalizeTags(tags) {
    if (!tags || !Array.isArray(tags)) {
      return [];
    }

    const normalizedSet = new Set();

    // Add original tags
    tags.forEach(tag => {
      const normalized = tag.toLowerCase().trim();
      if (normalized) {
        normalizedSet.add(normalized);
      }
    });

    // Add canonical synonyms
    tags.forEach(tag => {
      const normalized = tag.toLowerCase().trim();
      const canonicals = SYNONYM_TO_CANONICAL[normalized];

      if (canonicals) {
        canonicals.forEach(canonical => {
          normalizedSet.add(canonical);
        });
      }
    });

    return Array.from(normalizedSet);
  }

  /**
   * Get all tags that should match a category filter
   * @param {string} category - Category to search for
   * @returns {string[]} - All tags that match this category
   */
  getCategoryTags(category) {
    const normalizedCategory = category.toLowerCase().trim();
    return TAG_SYNONYMS[normalizedCategory] || [normalizedCategory];
  }

  /**
   * Check if a tag belongs to a category
   * @param {string} tag - Tag to check
   * @param {string} category - Category to match against
   * @returns {boolean} - Whether tag matches category
   */
  tagMatchesCategory(tag, category) {
    const normalizedTag = tag.toLowerCase().trim();
    const normalizedCategory = category.toLowerCase().trim();

    // Direct match
    if (normalizedTag === normalizedCategory) {
      return true;
    }

    // Check if tag is in category's synonym list
    const categoryTags = this.getCategoryTags(normalizedCategory);
    return categoryTags.includes(normalizedTag);
  }
}

const tagNormalizer = new TagNormalizer();

export default tagNormalizer;
