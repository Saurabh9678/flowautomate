const { Client } = require('@elastic/elasticsearch');
const { ELASTICSEARCH_CONFIG, INDEX_MAPPING } = require('../config/elasticsearch');

class ElasticsearchService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.indexName = ELASTICSEARCH_CONFIG.index;
  }

  /**
   * Initialize Elasticsearch client and connection
   */
  async initialize() {
    try {
      console.log('Initializing Elasticsearch...');
      
      // Create client with authentication
      this.client = new Client({
        node: ELASTICSEARCH_CONFIG.url,
        auth: ELASTICSEARCH_CONFIG.auth,
        tls: {
          rejectUnauthorized: false // For development, disable SSL verification
        }
      });

      // Test connection
      await this.client.ping();
      console.log('Elasticsearch connection successful');

      // Check if index exists, create if not
      await this.ensureIndexExists();
      
      this.isConnected = true;
      console.log('Elasticsearch initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Elasticsearch:', error.message);
      throw error;
    }
  }

  /**
   * Ensure the index exists with proper mapping
   */
  async ensureIndexExists() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (!indexExists) {
        console.log(`Creating index: ${this.indexName}`);
        await this.client.indices.create({
          index: this.indexName,
          body: INDEX_MAPPING
        });
        console.log(`Index '${this.indexName}' created successfully`);
      } else {
        console.log(`Index '${this.indexName}' already exists`);
      }
    } catch (error) {
      console.error('Failed to ensure index exists:', error.message);
      throw error;
    }
  }



  /**
   * Index pre-transformed documents directly
   * @param {Array} documents - Pre-transformed Elasticsearch documents
   * @param {string} docId - Document identifier
   */
  async indexDocuments(documents, docId = 'unknown') {
    try {
      if (!this.isConnected) {
        throw new Error('Elasticsearch not connected');
      }

      console.log(`Indexing ${documents.length} documents for Document ID: ${docId}`);

      if (documents.length > 0) {
        const operations = documents.flatMap(doc => [
          { index: { _index: this.indexName } },
          doc
        ]);

        const result = await this.client.bulk({
          body: operations,
          refresh: true
        });

        if (result.errors) {
          const errors = result.items.filter(item => item.index?.error);
          console.error('Some documents failed to index:', errors);
        }

        console.log(`Indexed ${documents.length} documents for Document ID: ${docId}`);
        return {
          success: true,
          indexedCount: documents.length,
          docId: docId
        };
      } else {
        console.warn(`No documents to index for Document ID: ${docId}`);
        return {
          success: false,
          indexedCount: 0,
          docId: docId,
          error: 'No documents to index'
        };
      }

    } catch (error) {
      console.error(`Failed to index documents for Document ID ${docId}:`, error.message);
      throw error;
    }
  }

  /**
   * Search PDF content
   * @param {string} query - Search query
   * @param {string} userId - User identifier (optional, for filtering)
   * @param {Object} options - Search options
   */
  async searchPdfContent(query, userId = null, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Elasticsearch not connected');
      }

      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['title^2', 'text'], // title has higher weight
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              }
            ]
          }
        },
        highlight: {
          fields: {
            title: {},
            text: {}
          }
        },
        size: options.size || 10,
        from: options.from || 0
      };

      // Add user filter if provided
      if (userId) {
        searchBody.query.bool.filter = [
          { term: { user_id: userId } }
        ];
      }

      const result = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      return {
        success: true,
        total: result.hits.total.value,
        hits: result.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          source: hit._source,
          highlights: hit.highlight
        }))
      };

    } catch (error) {
      console.error('Search failed:', error.message);
      throw error;
    }
  }

  /**
   * Advanced search with complex queries and aggregations
   * @param {Object} query - Elasticsearch query object
   * @param {Object} aggregations - Aggregation requests
   * @param {Object} options - Search options
   * @returns {Object} Search results with aggregations
   */
  async advancedSearch(query, aggregations = {}, options = {}) {
    if (!this.isConnected) {
      throw new Error('Elasticsearch not connected');
    }

    const {
      size = 20,
      from = 0,
      sort = { _score: { order: 'desc' } }
    } = options;

    try {
      const searchBody = {
        query,
        size,
        from,
        sort,
        highlight: {
          fields: {
            text: {},
            title: {}
          }
        }
      };

      // Add aggregations if provided
      if (Object.keys(aggregations).length > 0) {
        searchBody.aggs = aggregations;
      }

      const result = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      return {
        total: result.hits.total.value,
        hits: result.hits.hits.map(hit => ({
          _id: hit._id,
          _score: hit._score,
          ...hit._source,
          highlight: hit.highlight
        })),
        aggregations: result.aggregations || {}
      };

    } catch (error) {
      console.error('Advanced search error:', error.message);
      throw new Error(`Advanced search failed: ${error.message}`);
    }
  }


  /**
   * Get index statistics
   */
  async getIndexStats() {
    try {
      if (!this.isConnected) {
        throw new Error('Elasticsearch not connected');
      }

      const stats = await this.client.indices.stats({
        index: this.indexName
      });

      return {
        success: true,
        indexName: this.indexName,
        documentCount: stats.indices[this.indexName].total.docs.count,
        storageSize: stats.indices[this.indexName].total.store.size_in_bytes
      };

    } catch (error) {
      console.error('Failed to get index stats:', error.message);
      throw error;
    }
  }

  /**
   * Close Elasticsearch connection
   */
  async close() {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.isConnected = false;
        console.log('Elasticsearch connection closed');
      }
    } catch (error) {
      console.error('Error closing Elasticsearch connection:', error.message);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      hasClient: !!this.client,
      indexName: this.indexName
    };
  }
}

module.exports = ElasticsearchService;
