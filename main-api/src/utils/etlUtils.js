/**
 * ETL (Extract, Transform, Load) Utilities for PDF Data Processing
 * This file contains data transformation functions that can be used
 * independently of the Elasticsearch service.
 */

/**
 * Transform PDF data to Elasticsearch documents with column-structured tables
 * @param {Object} pdfData - Parsed PDF data from pdfParser
 * @param {string} pdfId - PDF identifier
 * @param {string} userId - User identifier
 * @returns {Array} Array of Elasticsearch documents
 */
function transformPdfDataToElasticsearchDocuments(pdfData, pdfId, userId) {
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
        const columnStructuredTable = transformTableToColumnStructure(item.content);

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
function transformTableToColumnStructure(tableContent) {
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
      const columnName = normalizeColumnName(header);
      const value = rowData[colIndex] || '';
      
      // Store original value
      columnObject[columnName] = value;
      
      // Extract numeric values for numeric columns
      extractNumericValues(columnObject, columnName, value, header);
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
function normalizeColumnName(header) {
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
function extractNumericValues(columnObject, columnName, value, header) {
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
    const numericValue = parseCurrencyValue(value);
    if (!isNaN(numericValue)) {
      columnObject[`${columnName}_numeric`] = numericValue;
    }
  }
  
  // Extract profit values
  if (headerLower.includes('profit') && value.includes('$')) {
    const numericValue = parseCurrencyValue(value);
    if (!isNaN(numericValue)) {
      columnObject[`${columnName}_numeric`] = numericValue;
    }
  }
  
  // Extract budget values
  if (headerLower.includes('budget') && value.includes('$')) {
    const numericValue = parseCurrencyValue(value);
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
    const numericValue = parseCurrencyValue(value);
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
function parseCurrencyValue(value) {
  return parseFloat(
    value
      .replace('$', '')
      .replace('M', '000000')
      .replace('K', '000')
      .replace(/,/g, '')
  );
}

/**
 * Transform PDF data to a different format (example for other systems)
 * @param {Object} pdfData - Parsed PDF data
 * @param {string} pdfId - PDF identifier
 * @param {string} userId - User identifier
 * @returns {Object} Transformed data in a different format
 */
function transformPdfDataToCustomFormat(pdfData, pdfId, userId) {
  return {
    documentId: pdfId,
    ownerId: userId,
    totalPages: pdfData.total_pages,
    content: pdfData.data.map(item => ({
      contentType: item.type,
      pageNumber: item.page || 1,
      content: item.text || '',
      metadata: {
        title: Array.isArray(item.title) ? item.title.join(' ') : item.title,
        ...(item.type === 'table' && { 
          tableData: item.content,
          rowCount: item.content.length
        })
      }
    }))
  };
}

/**
 * Transform PDF data to CSV format
 * @param {Object} pdfData - Parsed PDF data
 * @param {string} pdfId - PDF identifier
 * @returns {string} CSV formatted string
 */
function transformPdfDataToCSV(pdfData, pdfId) {
  const csvRows = ['pdf_id,page_number,type,title,text'];
  
  pdfData.data.forEach(item => {
    const title = Array.isArray(item.title) ? item.title.join(' ') : item.title;
    const text = (item.text || '').replace(/"/g, '""'); // Escape quotes for CSV
    csvRows.push(`"${pdfId}","${item.page || 1}","${item.type}","${title}","${text}"`);
  });
  
  return csvRows.join('\n');
}

/**
 * Transform PDF data to JSON Lines format (one JSON object per line)
 * @param {Object} pdfData - Parsed PDF data
 * @param {string} pdfId - PDF identifier
 * @param {string} userId - User identifier
 * @returns {string} JSON Lines formatted string
 */
function transformPdfDataToJSONLines(pdfData, pdfId, userId) {
  const documents = transformPdfDataToElasticsearchDocuments(pdfData, pdfId, userId);
  return documents.map(doc => JSON.stringify(doc)).join('\n');
}

/**
 * Validate transformed documents
 * @param {Array} documents - Transformed documents
 * @returns {Object} Validation result
 */
function validateTransformedDocuments(documents) {
  const errors = [];
  const warnings = [];
  
  documents.forEach((doc, index) => {
    // Required fields validation
    if (!doc.pdf_id) {
      errors.push(`Document ${index}: Missing pdf_id`);
    }
    if (!doc.user_id) {
      errors.push(`Document ${index}: Missing user_id`);
    }
    if (!doc.type) {
      errors.push(`Document ${index}: Missing type`);
    }
    if (!doc.total_pages) {
      errors.push(`Document ${index}: Missing total_pages`);
    }
    
    // Type-specific validation
    if (doc.type === 'paragraph' && !doc.text) {
      warnings.push(`Document ${index}: Paragraph has no text content`);
    }
    
    if (doc.type === 'table' && !doc.table_structured) {
      warnings.push(`Document ${index}: Table missing structured data`);
    }
    
    // Validate column structure for tables
    if (doc.type === 'table' && doc.table_structured) {
      doc.table_structured.forEach((row, rowIndex) => {
        if (!row.row || typeof row.row !== 'object') {
          errors.push(`Document ${index}, Row ${rowIndex}: Invalid row structure`);
        }
        if (!row.row_number) {
          warnings.push(`Document ${index}, Row ${rowIndex}: Missing row number`);
        }
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    documentCount: documents.length
  };
}

/**
 * Filter documents by type
 * @param {Array} documents - Transformed documents
 * @param {string} type - Document type to filter by
 * @returns {Array} Filtered documents
 */
function filterDocumentsByType(documents, type) {
  return documents.filter(doc => doc.type === type);
}

/**
 * Filter documents by page number
 * @param {Array} documents - Transformed documents
 * @param {number} pageNumber - Page number to filter by
 * @returns {Array} Filtered documents
 */
function filterDocumentsByPage(documents, pageNumber) {
  return documents.filter(doc => doc.page_number === pageNumber);
}

/**
 * Get document statistics
 * @param {Array} documents - Transformed documents
 * @returns {Object} Statistics
 */
function getDocumentStatistics(documents) {
  const stats = {
    total: documents.length,
    byType: {},
    byPage: {},
    totalTextLength: 0
  };
  
  documents.forEach(doc => {
    // Count by type
    stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
    
    // Count by page
    stats.byPage[doc.page_number] = (stats.byPage[doc.page_number] || 0) + 1;
    
    // Calculate total text length
    if (doc.text) {
      stats.totalTextLength += doc.text.length;
    }
  });
  
  return stats;
}

module.exports = {
  // Main transformation functions
  transformPdfDataToElasticsearchDocuments,
  transformPdfDataToCustomFormat,
  transformPdfDataToCSV,
  transformPdfDataToJSONLines,
  
  // Table transformation functions
  transformTableToColumnStructure,
  normalizeColumnName,
  extractNumericValues,
  parseCurrencyValue,
  
  // Utility functions
  validateTransformedDocuments,
  filterDocumentsByType,
  filterDocumentsByPage,
  getDocumentStatistics
};
