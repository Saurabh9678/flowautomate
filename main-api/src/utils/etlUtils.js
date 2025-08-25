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
        // Creating flattened text from table content for text search
        const tableText = item.content.map(row => 
          row.data.join(' | ')
        ).join('\n ');

        // Creating column-structured table with semantic column names for data analysis
        const columnStructuredTable = transformTableToColumnStructure(item.content, item.title);

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
            imagetext: item?.ocr_text || '', // OCR text would go here
            metadata: {
              width: item?.width || 0,
              height: item?.height || 0,
              format: item?.format || 'unknown'
            }
          }
        });
        break;

      default:
        console.warn(`Unknown content type: ${item.type}`);
    }
  });

  return documents;
}

/**
 * Transform table data to column-structured format
 * @param {Array} tableContent - Raw table content with rows
 * @param {Array} tableTitle - Table title
 * @returns {Array} Column-structured table data
 */
function transformTableToColumnStructure(tableContent, tableTitle) {
  if (!tableContent || tableContent.length === 0 || !tableTitle || tableTitle.length === 0) {
    return [];
  }

  const headers = tableTitle || [];
  const dataRows = tableContent;
  
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


module.exports = {
  transformPdfDataToElasticsearchDocuments,
  transformTableToColumnStructure,
  normalizeColumnName,
};
