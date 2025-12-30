import embeddingService from './embeddingService.js';

/**
 * AI-powered tag expansion service
 * Uses embeddings to find semantically similar tags
 */

// Reference set of common indie product tags
// These are the canonical tags we want to expand to
const REFERENCE_TAGS = [
  // Payment & Commerce
  'payments', 'payment', 'checkout', 'billing', 'stripe', 'paypal', 'commerce', 'ecommerce', 'subscription', 'invoicing',

  // Analytics & Data
  'analytics', 'tracking', 'metrics', 'statistics', 'stats', 'insights', 'reporting', 'dashboard', 'data', 'visualization',

  // Productivity & Workflow
  'productivity', 'automation', 'workflow', 'efficiency', 'tools', 'task-management', 'project-management', 'collaboration',

  // AI & ML
  'ai', 'artificial-intelligence', 'machine-learning', 'ml', 'llm', 'gpt', 'chatbot', 'nlp', 'deep-learning',

  // Developer Tools
  'developer', 'dev', 'development', 'coding', 'programming', 'api', 'sdk', 'devtools', 'debugging', 'testing',

  // Design
  'design', 'ui', 'ux', 'graphics', 'visual', 'figma', 'prototyping', 'wireframe', 'mockup', 'illustration',

  // Marketing & Growth
  'marketing', 'seo', 'advertising', 'growth', 'campaigns', 'email-marketing', 'social-media', 'content-marketing', 'lead-generation',

  // SaaS & Cloud
  'saas', 'software', 'cloud', 'platform', 'service', 'infrastructure', 'hosting', 'deployment',

  // Social & Communication
  'social', 'community', 'network', 'collaboration', 'team', 'messaging', 'chat', 'video-conferencing', 'communication',

  // Security & Auth
  'security', 'auth', 'authentication', 'privacy', 'encryption', 'authorization', 'access-control', 'compliance',

  // Content & Media
  'content', 'cms', 'blog', 'publishing', 'media', 'video', 'audio', 'podcast', 'streaming',

  // E-learning & Education
  'education', 'learning', 'course', 'training', 'tutorial', 'teaching', 'elearning', 'online-course',

  // Sales & CRM
  'sales', 'crm', 'customer-relationship', 'leads', 'pipeline', 'customer-management', 'sales-automation',

  // Support & Help
  'support', 'customer-support', 'helpdesk', 'tickets', 'chat-support', 'knowledge-base', 'faq',

  // Finance & Accounting
  'finance', 'accounting', 'bookkeeping', 'expenses', 'budgeting', 'tax', 'financial',

  // HR & Recruiting
  'hr', 'human-resources', 'recruiting', 'hiring', 'onboarding', 'talent', 'recruitment',

  // Mobile & Apps
  'mobile', 'ios', 'android', 'app', 'application', 'mobile-app', 'progressive-web-app', 'pwa',

  // Web & Frontend
  'web', 'frontend', 'backend', 'fullstack', 'javascript', 'react', 'vue', 'angular', 'web-development',

  // Database & Storage
  'database', 'storage', 'sql', 'nosql', 'data-storage', 'backup', 'data-management',

  // Monitoring & Observability
  'monitoring', 'observability', 'logging', 'error-tracking', 'performance', 'uptime', 'alerts'
];

// Cache for reference tag embeddings (computed once on first use)
let referenceEmbeddings = null;
let isComputingEmbeddings = false;
const embeddingQueue = [];

class TagExpander {
  /**
   * Compute cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Initialize reference tag embeddings (computed once and cached)
   */
  async initializeReferenceEmbeddings() {
    if (referenceEmbeddings) {
      return referenceEmbeddings;
    }

    // If already computing, wait for it to finish
    if (isComputingEmbeddings) {
      return new Promise((resolve) => {
        embeddingQueue.push(resolve);
      });
    }

    isComputingEmbeddings = true;

    try {
      console.log('Computing reference tag embeddings (one-time setup)...');

      // Generate embeddings for all reference tags
      const embeddings = {};

      // Process in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < REFERENCE_TAGS.length; i += batchSize) {
        const batch = REFERENCE_TAGS.slice(i, i + batchSize);

        // Generate embeddings for batch
        const batchPromises = batch.map(tag =>
          embeddingService.generateEmbedding(tag).then(embedding => ({
            tag,
            embedding
          }))
        );

        const results = await Promise.all(batchPromises);

        results.forEach(({ tag, embedding }) => {
          embeddings[tag] = embedding;
        });

        console.log(`Processed ${Math.min(i + batchSize, REFERENCE_TAGS.length)}/${REFERENCE_TAGS.length} reference tags`);
      }

      referenceEmbeddings = embeddings;

      // Resolve any waiting promises
      embeddingQueue.forEach(resolve => resolve(referenceEmbeddings));
      embeddingQueue.length = 0;

      console.log('Reference tag embeddings computed and cached');
      return referenceEmbeddings;
    } finally {
      isComputingEmbeddings = false;
    }
  }

  /**
   * Expand tags using AI-powered semantic similarity
   * @param {string[]} tags - Original tags to expand
   * @param {number} similarityThreshold - Minimum cosine similarity (0-1)
   * @param {number} maxExpansions - Maximum number of similar tags to add per input tag
   * @returns {Promise<string[]>} - Expanded tags
   */
  async expandTags(tags, similarityThreshold = 0.65, maxExpansions = 3) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      console.log('[TAG_EXPANDER] No tags provided, returning empty array');
      return [];
    }

    try {
      console.log('==================== TAG EXPANSION STARTED ====================');
      console.log('[TAG_EXPANDER] Input tags:', tags);
      console.log('[TAG_EXPANDER] Similarity threshold:', similarityThreshold);
      console.log('[TAG_EXPANDER] Max expansions per tag:', maxExpansions);

      // Initialize reference embeddings if not already done
      console.log('[TAG_EXPANDER] Initializing reference embeddings...');
      await this.initializeReferenceEmbeddings();
      console.log('[TAG_EXPANDER] Reference embeddings ready:', Object.keys(referenceEmbeddings).length, 'tags');

      // Normalize input tags
      const normalizedTags = tags.map(tag => tag.toLowerCase().trim()).filter(tag => tag.length > 0);
      console.log('[TAG_EXPANDER] Normalized tags:', normalizedTags);

      // Start with original tags
      const expandedSet = new Set(normalizedTags);

      // For each input tag, find similar reference tags
      for (const tag of normalizedTags) {
        console.log(`[TAG_EXPANDER] Processing tag: "${tag}"`);

        // Skip if already in reference set
        if (REFERENCE_TAGS.includes(tag)) {
          console.log(`[TAG_EXPANDER]   Tag "${tag}" is already a reference tag, skipping expansion`);
          continue;
        }

        // Generate embedding for input tag
        console.log(`[TAG_EXPANDER]   Generating embedding for "${tag}"...`);
        const tagEmbedding = await embeddingService.generateEmbedding(tag);

        // Find similar reference tags
        const similarities = [];

        for (const [refTag, refEmbedding] of Object.entries(referenceEmbeddings)) {
          const similarity = this.cosineSimilarity(tagEmbedding, refEmbedding);

          if (similarity >= similarityThreshold) {
            similarities.push({ tag: refTag, similarity });
          }
        }

        console.log(`[TAG_EXPANDER]   Found ${similarities.length} similar tags above threshold`);

        // Sort by similarity (highest first) and take top N
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topSimilar = similarities.slice(0, maxExpansions);

        // Add to expanded set
        if (topSimilar.length > 0) {
          console.log(`[TAG_EXPANDER]   Expansions for "${tag}":`);
          topSimilar.forEach(({ tag: similarTag, similarity }) => {
            console.log(`[TAG_EXPANDER]     ✓ "${similarTag}" (similarity: ${similarity.toFixed(3)})`);
            expandedSet.add(similarTag);
          });
        } else {
          console.log(`[TAG_EXPANDER]   No similar tags found for "${tag}"`);
        }
      }

      const result = Array.from(expandedSet);
      console.log('[TAG_EXPANDER] Final expanded tags:', result);
      console.log('[TAG_EXPANDER] Expansion summary:');
      console.log(`[TAG_EXPANDER]   Input: ${normalizedTags.length} tags`);
      console.log(`[TAG_EXPANDER]   Output: ${result.length} tags`);
      console.log(`[TAG_EXPANDER]   Added: ${result.length - normalizedTags.length} tags`);
      console.log('==================== TAG EXPANSION COMPLETED ====================');

      return result;

    } catch (error) {
      console.error('[TAG_EXPANDER] ✗ Error expanding tags:', error);
      console.error('[TAG_EXPANDER] Stack trace:', error.stack);
      // Fallback: return original tags if expansion fails
      console.log('[TAG_EXPANDER] Falling back to original tags');
      return tags.map(tag => tag.toLowerCase().trim());
    }
  }

  /**
   * Get reference tags (useful for debugging)
   */
  getReferenceTags() {
    return REFERENCE_TAGS;
  }
}

const tagExpander = new TagExpander();

export default tagExpander;
