const elasticsearchManager = require("../utils/elasticsearchManager");
const PdfService = require("../services/PdfService");
const { ValidationError } = require("../utils/CustomError");

class SearchController {
  constructor() {
    this.pdfService = new PdfService();
    this.searchPdfContent = this.searchPdfContent.bind(this);
  }

  /**
   * Search PDF content with various filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchPdfContent(req, res) {
    const {
      query, // Search query text
      pdf_filename, // PDF filename to filter by
      type, // Content type filter (paragraph, table, image)
      page_number, // Page number filter
      total_pages, // Total pages filter
      sort_by, // Sort field
      sort_order, // Sort order (asc, desc)
      size = 20, // Number of results
      from = 0, // Pagination offset
    } = req.query;

    const userId = req.user.userId;

    try {
      // Validate required parameters
      if (!query && !pdf_filename && !type && !page_number && !total_pages) {
        throw new ValidationError("At least one search parameter is required");
      }

      // Build search query
      const searchQuery = await this.buildSearchQuery({
        query,
        pdf_filename,
        type,
        page_number,
        total_pages,
        userId,
      });

      // Build search options
      const searchOptions = {
        query: searchQuery,
        highlight: {
          fields: {
            title: {},
            text: {},
          },
        },
        size: parseInt(size),
        from: parseInt(from),
        sort: this.buildSortOptions(sort_by, sort_order),
      };


      // Execute search using advanced search for better control
      const searchResult = await elasticsearchManager.searchPdfContent(
        searchOptions
      );

      const formattedResults = await this.formatSearchResults(
        searchResult,
        userId
      );

      res.json({
        success: true,
        data: {
          total: searchResult.total,
          hits: formattedResults,
          pagination: {
            from: parseInt(from),
            size: parseInt(size),
            total: searchResult.total,
          },
        },
      });
    } catch (error) {
      console.error("Search error:", error.message);
      throw error;
    }
  }

  /**
   * Build Elasticsearch query based on search parameters
   * @param {Object} params - Search parameters
   * @returns {Promise<string>} Elasticsearch query string
   */
  async buildSearchQuery(params) {
    const { query, pdf_filename, type, page_number, total_pages, userId } =
      params;
    const finalQuery = 
      {
        bool: {
          must: [],
        },
      }
    

    // Base user filter - ensure exact match
    finalQuery.bool.must.push({ term: { user_id: userId } });

    // PDF filename filter - get PDF ID from database
    if (pdf_filename) {
      const pdfId = await this.getPdfIdByFilename(pdf_filename, userId);
      if (pdfId) {
        finalQuery.bool.must.push({ terms: { pdf_id: pdfId } });
      }
    }

    // Content type filter
    if (type) {
      finalQuery.bool.must.push({ term: { type } });
    }

    // Page number filter
    if (page_number) {
      finalQuery.bool.must.push({ term: { page_number } });
    }

    // Total pages filter
    if (total_pages) {
      finalQuery.bool.must.push({ term: { total_pages } });
    }

    // Text query - use proper phrase search
    if (query) {
      // Escape special characters and use phrase search
      const escapedQuery = query.replace(/[+\-&|!(){}[\]^"~*?:\\]/g, "\\$&");
      if (type === "image") {
        finalQuery.bool.must.push({
          multi_match: {
            query: escapedQuery,
            fields: ["image.caption", "image.imagetext", "title", "text"],
          },
        });
      } else {
        finalQuery.bool.must.push({
          multi_match: {
            query: escapedQuery,
            fields: ["title", "text"],
            type: "best_fields",
            fuzziness: "AUTO",
          },
        });
      }
    }
    return finalQuery;
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
      const cleanFilename = filename.replace(/^.*[\\\/]/, "");

      // Search for PDF in database
      const pdf = await this.pdfService.getPdfIdByFilename(
        cleanFilename,
        userId
      );
      const pdfIds = pdf.map((pdf) => pdf.id);
      return pdfIds;
    } catch (error) {
      console.error("Error getting PDF ID by filename:", error.message);
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
      return { _score: { order: "desc" } }; // Default: sort by relevance
    }

    const order = sortOrder === "asc" ? "asc" : "desc";

    // Handle different sort fields
    switch (sortBy) {
      case "relevance":
        return { _score: { order: "desc" } };
      case "page_number":
        return { page_number: { order } };
      case "total_pages":
        return { total_pages: { order } };
      case "type":
        return { type: { order } };
      default:
        return { _score: { order: "desc" } };
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

    const formattedResults = searchResult.hits.map((hit) => {
      // Extract data from hit.source (Elasticsearch document data)
      const source = hit.source || {};

      const result = {
        id: hit.id,
        score: hit.score,
        pdf_id: source.pdf_id,
        user_id: source.user_id,
        type: source.type,
        title: source.title,
        page_number: source.page_number,
        total_pages: source.total_pages,
        text: source.text,
        highlighted_text: hit.highlights?.text ? hit.highlights.text[0] : null,
        highlighted_title: hit.highlights?.title
          ? hit.highlights.title[0]
          : null,
      };

      // Add table-specific data if it's a table
      if (source.type === "table" && source.table_structured) {
        result.table_data = {
          row_count: source.table_structured.length,
          rows: source.table_structured,
        };
      }

      // Add image-specific data if it's an image
      if (source.type === "image" && source.image) {
        result.image_data = {
          caption: source.image.caption,
          metadata: source.image.metadata,
        };
      }

      return result;
    });

    return formattedResults;
  }
}

module.exports = new SearchController();
