# Search Optimization Guide

## Current Configuration
```javascript
vectorWeight: 0.7
keywordWeight: 1.2
min_score: 1.0
fields: ['name^1.2', 'description^2.5', 'tags^1.5']
fuzziness: 'AUTO'
tagExpansion: { threshold: 0.65, max: 3 }
```

## Optimization Experiments

### Experiment 1: Balanced Approach (Recommended Start)
```javascript
// In searchService.js
vectorWeight: 0.6
keywordWeight: 1.3
fields: ['name^2.0', 'description^2.0', 'tags^2.5']
min_score: 0.8  // More permissive for small datasets
```

**Why:**
- Equal weight to all fields
- Tags boosted (important for indie products)
- Lower min_score for better recall with < 50 products

### Experiment 2: Tag-Focused (For Category Searches)
```javascript
vectorWeight: 0.5
keywordWeight: 1.5
fields: ['name^1.5', 'description^1.5', 'tags^3.0']
min_score: 1.0
```

**Why:**
- Heavy tag weighting (3.0x)
- More keyword-focused
- Best for searches like "waitlist", "analytics", "payments"

### Experiment 3: Semantic-Heavy (For Natural Language)
```javascript
vectorWeight: 0.8
keywordWeight: 1.0
fields: ['name^2.0', 'description^2.5', 'tags^1.5']
min_score: 0.7
```

**Why:**
- Strong semantic matching
- Good for queries like "tool to manage customer feedback"
- Finds conceptually similar products

## Testing Strategy

1. **Index 20+ diverse products**
2. **Create test queries:**
   - Exact: "stripe", "waitlist"
   - Semantic: "payment processing", "pre-launch signups"
   - Category: "saas analytics", "developer tools"

3. **Enable relevance scores:**
   ```
   /results?q=waitlist&showRelevance=1
   ```

4. **Compare results:**
   - Are top 3 results relevant?
   - What scores do they get?
   - Are you missing obvious matches?

5. **Adjust based on patterns:**
   - Low scores (<1.5): Decrease min_score
   - Missing semantic matches: Increase vectorWeight
   - Missing exact matches: Increase keywordWeight

## Quick Tuning Guide

| Problem | Solution |
|---------|----------|
| Missing exact word matches | Increase keywordWeight to 1.5 |
| Missing related products | Increase vectorWeight to 0.8 |
| Too many irrelevant results | Increase min_score to 1.5 |
| No results for good queries | Decrease min_score to 0.7 |
| Tags not matching well | Increase tags boost to ^3.0 |
| Poor semantic understanding | Check tag expansion logs |

## Monitoring

Check production logs for:
```
[SEARCH] OpenSearch response: { maxScore: X }
[SEARCH] Top result: { score: X }
```

- If maxScore < 2.0 regularly → Increase weights or lower min_score
- If many results score 0.5-1.0 → Quality issue, improve tags/descriptions
- If tag expansion shows no matches → Lower similarity threshold

## Advanced: A/B Testing

Track these metrics:
- Click-through rate on top 3 results
- Average relevance score
- Zero-result rate
- User feedback

Adjust weekly based on real usage data.
