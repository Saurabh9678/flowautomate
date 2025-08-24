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
      console.log('🔄 Initializing Elasticsearch...');
      
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
      console.log('✅ Elasticsearch connection successful');

      // Check if index exists, create if not
      await this.ensureIndexExists();
      
      this.isConnected = true;
      console.log('✅ Elasticsearch initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Elasticsearch:', error.message);
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
        console.log(`📋 Creating index: ${this.indexName}`);
        await this.client.indices.create({
          index: this.indexName,
          body: INDEX_MAPPING
        });
        console.log(`✅ Index '${this.indexName}' created successfully`);
      } else {
        console.log(`✅ Index '${this.indexName}' already exists`);
      }
    } catch (error) {
      console.error('❌ Failed to ensure index exists:', error.message);
      throw error;
    }
  }

  /**
   * Transform PDF data to Elasticsearch documents (ETL function)
   * @param {Object} pdfData - Parsed PDF data
   * @param {string} pdfId - PDF identifier
   * @param {string} userId - User identifier
   * @returns {Array} Array of Elasticsearch documents
   */
  transformPdfDataToDocuments(pdfData, pdfId, userId) {
    const documents = [];
    
    // Process each data item from the PDF
    pdfData.data.forEach((item, index) => {
      const baseDoc = {
        pdf_id: pdfId,
        user_id: userId,
        total_pages: pdfData.total_pages || 1,
        page_number: item.page || 1,
        type: item.type
      };

      switch (item.type) {
        case 'paragraph':
          documents.push({
            ...baseDoc,
            title: Array.isArray(item.title) ? item.title.join(' ') : item.title,
            text: item.text
          });
          break;

        case 'table':
          // Create flattened text from table content
          const tableText = item.content.map(row => 
            row.data.join(' | ')
          ).join('\n');

          // Create column-structured table with semantic column names
          const columnStructuredTable = this.transformTableToColumnStructure(item.content);

          documents.push({
            ...baseDoc,
            title: Array.isArray(item.title) ? item.title.join(' ') : item.title,
            text: tableText,
            table_structured: columnStructuredTable
          });
          break;

        case 'image':
          documents.push({
            ...baseDoc,
            title: Array.isArray(item.title) ? item.title.join(' ') : item.title,
            text: item.text || '',
            image: {
              caption: item.text || '',
              imagetext: '', // OCR text would go here
              metadata: {
                width: 0,
                height: 0,
                format: 'unknown'
              }
            }
          });
          break;

        default:
          console.warn(`⚠️ Unknown content type: ${item.type}`);
      }
    });

    return documents;
  }

  /**
   * Transform table data to column-structured format
   * @param {Array} tableContent - Raw table content with rows
   * @returns {Array} Column-structured table data
   */
  transformTableToColumnStructure(tableContent) {
    if (!tableContent || tableContent.length === 0) {
      return [];
    }

    // Extract column headers (first row)
    const headers = tableContent[0]?.data || [];
    const dataRows = tableContent.slice(1); // Skip header row
    
    // Create column-structured table
    const columnStructuredTable = dataRows.map(row => {
      const rowData = row.data;
      const columnObject = {};
      
      // Create column_name: value pairs
      headers.forEach((header, colIndex) => {
        const columnName = this.normalizeColumnName(header);
        const value = rowData[colIndex] || '';
        
        // Store original value
        columnObject[columnName] = value;
        
        // Extract numeric values for numeric columns
        this.extractNumericValues(columnObject, columnName, value, header);
      });
      
      return {
        row_number: row.row,
        row: columnObject
      };
    });
    
    return columnStructuredTable;
  }

  /**
   * Normalize column name to consistent format
   * @param {string} header - Original column header
   * @returns {string} Normalized column name
   */
  normalizeColumnName(header) {
    return header
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, '')     // Remove special characters
      .replace(/^_+|_+$/g, '');       // Remove leading/trailing underscores
  }

  /**
   * Extract numeric values from text values
   * @param {Object} columnObject - Column object to add numeric values to
   * @param {string} columnName - Normalized column name
   * @param {string} value - Original value
   * @param {string} header - Original header for context
   */
  extractNumericValues(columnObject, columnName, value, header) {
    const headerLower = header.toLowerCase();
    
    // Extract growth percentage
    if (headerLower.includes('growth') && value.includes('%')) {
      const numericValue = parseFloat(value.replace('%', ''));
      if (!isNaN(numericValue)) {
        columnObject[`${columnName}_numeric`] = numericValue;
      }
    }
    
    // Extract revenue values
    if (headerLower.includes('revenue') && value.includes('$')) {
      const numericValue = this.parseCurrencyValue(value);
      if (!isNaN(numericValue)) {
        columnObject[`${columnName}_numeric`] = numericValue;
      }
    }
    
    // Extract profit values
    if (headerLower.includes('profit') && value.includes('$')) {
      const numericValue = this.parseCurrencyValue(value);
      if (!isNaN(numericValue)) {
        columnObject[`${columnName}_numeric`] = numericValue;
      }
    }
    
    // Extract budget values
    if (headerLower.includes('budget') && value.includes('$')) {
      const numericValue = this.parseCurrencyValue(value);
      if (!isNaN(numericValue)) {
        columnObject[`${columnName}_numeric`] = numericValue;
      }
    }
    
    // Extract general percentage values
    if (value.includes('%') && !headerLower.includes('growth')) {
      const numericValue = parseFloat(value.replace('%', ''));
      if (!isNaN(numericValue)) {
        columnObject[`${columnName}_numeric`] = numericValue;
      }
    }
    
    // Extract general currency values
    if (value.includes('$') && !headerLower.includes('revenue') && 
        !headerLower.includes('profit') && !headerLower.includes('budget')) {
      const numericValue = this.parseCurrencyValue(value);
      if (!isNaN(numericValue)) {
        columnObject[`${columnName}_numeric`] = numericValue;
      }
    }
  }

  /**
   * Parse currency values to numeric
   * @param {string} value - Currency string (e.g., "$1.2M", "$200K", "$500")
   * @returns {number} Numeric value
   */
  parseCurrencyValue(value) {
    return parseFloat(
      value
        .replace('$', '')
        .replace('M', '000000')
        .replace('K', '000')
        .replace(/,/g, '')
    );
  }

  /**
   * Index PDF content into Elasticsearch
   * @param {Object} pdfData - Parsed PDF data
   * @param {string} pdfId - PDF identifier
   * @param {string} userId - User identifier
   */
  async indexPdfContent(pdfData, pdfId, userId) {
    try {
      if (!this.isConnected) {
        throw new Error('Elasticsearch not connected');
      }

      console.log(`🔄 Indexing PDF content for PDF ID: ${pdfId}`);

      // Use separate ETL function for data transformation
      const documents = this.transformPdfDataToDocuments(pdfData, pdfId, userId);

      // Bulk index all documents
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
          console.error('❌ Some documents failed to index:', errors);
        }

        console.log(`✅ Indexed ${documents.length} documents for PDF ID: ${pdfId}`);
        return {
          success: true,
          indexedCount: documents.length,
          pdfId: pdfId,
          userId: userId
        };
      } else {
        console.warn(`⚠️ No documents to index for PDF ID: ${pdfId}`);
        return {
          success: false,
          indexedCount: 0,
          pdfId: pdfId,
          userId: userId,
          error: 'No documents to index'
        };
      }

    } catch (error) {
      console.error(`❌ Failed to index PDF content for PDF ID ${pdfId}:`, error.message);
      throw error;
    }
  }

  /**
   * Index pre-transformed documents directly
   * @param {Array} documents - Pre-transformed Elasticsearch documents
   * @param {string} pdfId - PDF identifier (for logging)
   */
  async indexDocuments(documents, pdfId = 'unknown') {
    try {
      if (!this.isConnected) {
        throw new Error('Elasticsearch not connected');
      }

      console.log(`🔄 Indexing ${documents.length} documents for PDF ID: ${pdfId}`);

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
          console.error('❌ Some documents failed to index:', errors);
        }

        console.log(`✅ Indexed ${documents.length} documents for PDF ID: ${pdfId}`);
        return {
          success: true,
          indexedCount: documents.length,
          pdfId: pdfId
        };
      } else {
        console.warn(`⚠️ No documents to index for PDF ID: ${pdfId}`);
        return {
          success: false,
          indexedCount: 0,
          pdfId: pdfId,
          error: 'No documents to index'
        };
      }

    } catch (error) {
      console.error(`❌ Failed to index documents for PDF ID ${pdfId}:`, error.message);
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
      console.error('❌ Search failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete PDF content by PDF ID
   * @param {string} pdfId - PDF identifier
   */
  async deletePdfContent(pdfId) {
    try {
      if (!this.isConnected) {
        throw new Error('Elasticsearch not connected');
      }

      const result = await this.client.deleteByQuery({
        index: this.indexName,
        body: {
          query: {
            term: {
              pdf_id: pdfId
            }
          }
        },
        refresh: true
      });

      console.log(`✅ Deleted ${result.deleted} documents for PDF ID: ${pdfId}`);
      return {
        success: true,
        deletedCount: result.deleted,
        pdfId: pdfId
      };

    } catch (error) {
      console.error(`❌ Failed to delete PDF content for PDF ID ${pdfId}:`, error.message);
      throw error;
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
      console.error('❌ Failed to get index stats:', error.message);
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
        console.log('✅ Elasticsearch connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing Elasticsearch connection:', error.message);
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
