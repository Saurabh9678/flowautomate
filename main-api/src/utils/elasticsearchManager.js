const ElasticsearchService = require('../services/ElasticsearchService');

class ElasticsearchManager {
  constructor() {
    this.elasticsearchService = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the Elasticsearch service
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('Elasticsearch already initialized');
      return this.elasticsearchService;
    }

    try {
      this.elasticsearchService = new ElasticsearchService();
      await this.elasticsearchService.initialize();
      this.isInitialized = true;
      console.log('Elasticsearch Manager initialized successfully');
      return this.elasticsearchService;
    } catch (error) {
      console.error('Failed to initialize Elasticsearch Manager:', error.message);
      throw error;
    }
  }

  /**
   * Get the Elasticsearch service instance
   */
  getService() {
    if (!this.elasticsearchService) {
      throw new Error('Elasticsearch not initialized.');
    }
    return this.elasticsearchService;
  }

  /**
   * Index pre-transformed documents (separate ETL workflow)
   * @param {Array} documents - Pre-transformed Elasticsearch documents
   * @param {string} pdfId - PDF identifier (for logging)
   */
  async indexPDFDocuments(documents, pdfId = 'unknown') {
    const service = this.getService();
    return await service.indexDocuments(documents, pdfId);
  }

  /**
   * Search PDF content
   * @param {string} query - Search query
   * @param {string} userId - User identifier (optional, for filtering)
   * @param {Object} options - Search options
   */
  async searchPdfContent(query, userId = null, options = {}) {
    const service = this.getService();
    return await service.searchPdfContent(query, userId, options);
  }

  /**
   * Advanced search with complex queries and aggregations
   * @param {Object} query - Elasticsearch query object
   * @param {Object} aggregations - Aggregation requests
   * @param {Object} options - Search options
   * @returns {Object} Search results with aggregations
   */
  async advancedSearch(query, aggregations = {}, options = {}) {
    const service = this.getService();
    return await service.advancedSearch(query, aggregations, options);
  }

  /**
   * Get index statistics
   */
  async getIndexStats() {
    const service = this.getService();
    return await service.getIndexStats();
  }

  /**
   * Get service status
   */
  getStatus() {
    if (!this.elasticsearchService) {
      return {
        isInitialized: false,
        service: null
      };
    }

    return {
      isInitialized: this.isInitialized,
      service: this.elasticsearchService.getStatus()
    };
  }

  /**
   * Close Elasticsearch connection
   */
  async close() {
    if (this.elasticsearchService) {
      await this.elasticsearchService.close();
      this.elasticsearchService = null;
      this.isInitialized = false;
      console.log('Elasticsearch Manager closed successfully');
    }
  }
}

// Create singleton instance
const elasticsearchManager = new ElasticsearchManager();

module.exports = elasticsearchManager;
