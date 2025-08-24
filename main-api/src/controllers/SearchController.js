const elasticsearchManager = require('../utils/elasticsearchManager');
const PdfService = require('../services/PdfService');
const { ValidationError } = require('../utils/CustomError');

class SearchController {
  constructor() {
    this.pdfService = new PdfService();
  }

  /**
   * Search PDF content with various filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchPdfContent(req, res) {
    const { 
      query,           // Search query text
      pdf_filename,    // PDF filename to filter by
      type,           // Content type filter (paragraph, table, image)
      page_number,    // Page number filter
      total_pages,    // Total pages filter
      sort_by,        // Sort field
      sort_order,     // Sort order (asc, desc)
      size = 20,      // Number of results
      from = 0        // Pagination offset
    } = req.query;

    const userId = req.user.userId;

    try {
      // Validate required parameters
      if (!query && !pdf_filename && !type && !page_number && !total_pages) {
        throw new ValidationError('At least one search parameter is required');
      }

      // Build search query
      const searchQuery = await this.buildSearchQuery({
        query,
        pdf_filename,
        type,
        page_number,
        total_pages,
        userId
      });

      // Build search options
      const searchOptions = {
        size: parseInt(size),
        from: parseInt(from),
        sort: this.buildSortOptions(sort_by, sort_order)
      };

      // Execute search
      const searchResult = await elasticsearchManager.searchPdfContent(
        searchQuery,
        userId,
        searchOptions
      );

      // Format response
      const formattedResults = await this.formatSearchResults(searchResult, userId);

      res.json({
        success: true,
        data: {
          total: searchResult.total,
          hits: formattedResults,
          pagination: {
            from: parseInt(from),
            size: parseInt(size),
            total: searchResult.total
          }
        }
      });

    } catch (error) {
      console.error('Search error:', error.message);
      throw error;
    }
  }

  /**
   * Build Elasticsearch query based on search parameters
   * @param {Object} params - Search parameters
   * @returns {Promise<string>} Elasticsearch query string
   */
  async buildSearchQuery(params) {
    const { query, pdf_filename, type, page_number, total_pages, userId } = params;
    const queryParts = [];

    // Base user filter
    queryParts.push(`user_id:${userId}`);

    // PDF filename filter - get PDF ID from database
    if (pdf_filename) {
      const pdfId = await this.getPdfIdByFilename(pdf_filename, userId);
      if (pdfId) {
        queryParts.push(`pdf_id:${pdfId}`);
      }
    }

    // Content type filter
    if (type) {
      queryParts.push(`type:${type}`);
    }

    // Page number filter
    if (page_number) {
      queryParts.push(`page_number:${page_number}`);
    }

    // Total pages filter
    if (total_pages) {
      queryParts.push(`total_pages:${total_pages}`);
    }

    // Text query - determine if it's structured or flattened
    if (query) {
      const queryType = this.determineQueryType(query);
      
      if (queryType === 'structured') {
        // Structured query (numeric comparisons, field-specific)
        queryParts.push(query);
      } else {
        // Flattened text search across all text fields
        queryParts.push(`text:*${query}* OR title:*${query}*`);
      }
    }

    return queryParts.join(' AND ');
  }

  /**
   * Determine if query is structured (numeric, field-specific) or flattened (text)
   * @param {string} query - Search query
   * @returns {string} 'structured' or 'flattened'
   */
  determineQueryType(query) {
    // Check for numeric comparisons
    const numericPatterns = [
      /[<>]=?\s*\d+/,                    // >, <, >=, <= followed by numbers
      /:\s*[<>]=?\s*\d+/,               // field: > 10
      /_numeric\s*[<>]=?\s*\d+/,        // field_numeric > 10
      /\[.*\s+TO\s+.*\]/,               // range queries [10 TO 20]
      /table_structured\.row\..*:/,     // nested field queries
      /AND|OR|NOT/,                     // boolean operators
      /\(.*\)/                          // parentheses for complex queries
    ];

    // Check for field-specific queries
    const fieldPatterns = [
      /^\w+:/,                          // field:value
      /table_structured\.row\./,        // nested field access
      /type:|pdf_id:|user_id:|page_number:|total_pages:/  // specific fields
    ];

    // If query contains any structured patterns, treat as structured
    const hasNumericPattern = numericPatterns.some(pattern => pattern.test(query));
    const hasFieldPattern = fieldPatterns.some(pattern => pattern.test(query));

    if (hasNumericPattern || hasFieldPattern) {
      return 'structured';
    }

    return 'flattened';
  }

  /**
   * Get PDF ID by filename from database
   * @param {string} filename - PDF filename
   * @param {string} userId - User ID
   * @returns {string|null} PDF ID or null if not found
   */
  async getPdfIdByFilename(filename, userId) {
    try {
      // Extract filename without path
      const cleanFilename = filename.replace(/^.*[\\\/]/, '');
      
      // Search for PDF in database
      const pdfs = await this.pdfService.findPdfsByUserId(userId);
      const pdf = pdfs.find(p => {
        const pdfFilename = p.pdf_path.replace(/^.*[\\\/]/, '');
        return pdfFilename === cleanFilename;
      });

      return pdf ? pdf.id : null;
    } catch (error) {
      console.error('Error getting PDF ID by filename:', error.message);
      return null;
    }
  }

  /**
   * Build sort options for Elasticsearch
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order (asc, desc)
   * @returns {Object} Sort options
   */
  buildSortOptions(sortBy, sortOrder) {
    if (!sortBy) {
      return { _score: { order: 'desc' } }; // Default: sort by relevance
    }

    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    // Handle different sort fields
    switch (sortBy) {
      case 'relevance':
        return { _score: { order: 'desc' } };
      case 'page_number':
        return { page_number: { order } };
      case 'total_pages':
        return { total_pages: { order } };
      case 'type':
        return { type: { order } };
      case 'title':
        return { title: { order } };
      default:
        return { _score: { order: 'desc' } };
    }
  }

  /**
   * Format search results with additional metadata
   * @param {Object} searchResult - Raw search result from Elasticsearch
   * @param {string} userId - User ID
   * @returns {Array} Formatted results
   */
  async formatSearchResults(searchResult, userId) {
    if (!searchResult.hits || searchResult.hits.length === 0) {
      return [];
    }

    const formattedResults = searchResult.hits.map(hit => {
      const result = {
        id: hit._id,
        score: hit._score,
        pdf_id: hit.pdf_id,
        user_id: hit.user_id,
        type: hit.type,
        title: hit.title,
        page_number: hit.page_number,
        total_pages: hit.total_pages,
        text: hit.text,
        highlighted_text: hit.highlight ? hit.highlight.text : null,
        highlighted_title: hit.highlight ? hit.highlight.title : null
      };

      // Add table-specific data if it's a table
      if (hit.type === 'table' && hit.table_structured) {
        result.table_data = {
          row_count: hit.table_structured.length,
          columns: this.extractTableColumns(hit.table_structured),
          sample_rows: hit.table_structured.slice(0, 3) // First 3 rows as sample
        };
      }

      // Add image-specific data if it's an image
      if (hit.type === 'image' && hit.image) {
        result.image_data = {
          caption: hit.image.caption,
          metadata: hit.image.metadata
        };
      }

      return result;
    });

    return formattedResults;
  }

  /**
   * Extract column names from table structure
   * @param {Array} tableStructured - Table structured data
   * @returns {Array} Column names
   */
  extractTableColumns(tableStructured) {
    if (!tableStructured || tableStructured.length === 0) {
      return [];
    }

    // Get column names from the first row
    const firstRow = tableStructured[0];
    if (firstRow && firstRow.row) {
      return Object.keys(firstRow.row).filter(key => !key.endsWith('_numeric'));
    }

    return [];
  }

  /**
   * Advanced search with complex queries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async advancedSearch(req, res) {
    const { 
      query,           // Raw Elasticsearch query
      filters,         // Additional filters
      aggregations,    // Aggregation requests
      size = 20,
      from = 0
    } = req.body;

    const userId = req.user.userId;

    try {
      // Validate query
      if (!query) {
        throw new ValidationError('Query is required for advanced search');
      }

      // Build advanced search query
      const searchQuery = this.buildAdvancedSearchQuery(query, filters, userId);

      // Execute search
      const searchResult = await elasticsearchManager.advancedSearch(
        searchQuery,
        aggregations,
        { size: parseInt(size), from: parseInt(from) }
      );

      // Format results
      const formattedResults = await this.formatSearchResults(searchResult, userId);

      res.json({
        success: true,
        data: {
          total: searchResult.total,
          hits: formattedResults,
          aggregations: searchResult.aggregations || {},
          pagination: {
            from: parseInt(from),
            size: parseInt(size),
            total: searchResult.total
          }
        }
      });

    } catch (error) {
      console.error('Advanced search error:', error.message);
      throw error;
    }
  }

  /**
   * Build advanced search query
   * @param {string} query - Raw query
   * @param {Object} filters - Additional filters
   * @param {string} userId - User ID
   * @returns {Object} Elasticsearch query object
   */
  buildAdvancedSearchQuery(query, filters, userId) {
    const mustClauses = [
      { term: { user_id: userId } }
    ];

    // Add user's query
    if (query) {
      mustClauses.push({ query_string: { query } });
    }

    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          mustClauses.push({ term: { [field]: value } });
        }
      });
    }

    return {
      bool: {
        must: mustClauses
      }
    };
  }
}

module.exports = new SearchController();
