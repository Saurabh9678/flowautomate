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
      console.log('✅ Elasticsearch Manager initialized successfully');
      return this.elasticsearchService;
    } catch (error) {
      console.error('❌ Failed to initialize Elasticsearch Manager:', error.message);
      throw error;
    }
  }

  /**
   * Get the Elasticsearch service instance
   */
  getService() {
    if (!this.elasticsearchService) {
      throw new Error('Elasticsearch not initialized. Call initialize() first.');
    }
    return this.elasticsearchService;
  }

  /**
   * Transform PDF data to Elasticsearch documents (ETL function)
   * @param {Object} pdfData - Parsed PDF data
   * @param {string} pdfId - PDF identifier
   * @param {string} userId - User identifier
   * @returns {Array} Array of Elasticsearch documents
   */
  transformPdfDataToDocuments(pdfData, pdfId, userId) {
    const service = this.getService();
    return service.transformPdfDataToDocuments(pdfData, pdfId, userId);
  }

  /**
   * Index PDF content (with integrated ETL)
   * @param {Object} pdfData - Parsed PDF data
   * @param {string} pdfId - PDF identifier
   * @param {string} userId - User identifier
   */
  async indexPdfContent(pdfData, pdfId, userId) {
    const service = this.getService();
    return await service.indexPdfContent(pdfData, pdfId, userId);
  }

  /**
   * Index pre-transformed documents (separate ETL workflow)
   * @param {Array} documents - Pre-transformed Elasticsearch documents
   * @param {string} pdfId - PDF identifier (for logging)
   */
  async indexDocuments(documents, pdfId = 'unknown') {
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
   * Delete PDF content
   * @param {string} pdfId - PDF identifier
   */
  async deletePdfContent(pdfId) {
    const service = this.getService();
    return await service.deletePdfContent(pdfId);
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
      console.log('✅ Elasticsearch Manager closed successfully');
    }
  }
}

// Create singleton instance
const elasticsearchManager = new ElasticsearchManager();

module.exports = elasticsearchManager;
