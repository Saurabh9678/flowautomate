const { Client } = require('@elastic/elasticsearch');

// Elasticsearch Configuration
const ELASTICSEARCH_CONFIG = {
  url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  username: process.env.ELASTICSEARCH_USERNAME || 'admin',
  password: process.env.ELASTICSEARCH_PASSWORD || 'admin123',
  index: process.env.ELASTICSEARCH_INDEX || 'pdf_content',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'admin',
    password: process.env.ELASTICSEARCH_PASSWORD || 'admin123'
  }
};

// Index mapping for pdf_content with dynamic column-structured tables
const INDEX_MAPPING = {
  mappings: {
    properties: {
      pdf_id: {
        type: "keyword"          // unique PDF identifier
      },
      user_id: {
        type: "keyword"          // owner of the document
      },
      total_pages: {
        type: "integer"          // total number of pages in the PDF
      },
      page_number: {
        type: "integer"          // page where the content exists
      },
      type: {
        type: "keyword"          // "paragraph", "image", "table"
      },
      title: {
        type: "text",            // standalone titles or headings
        analyzer: "custom_text_analyzer"
      },
      text: {
        type: "text",            // for paragraph/table flattened text
        analyzer: "custom_text_analyzer"
      },
      table_structured: {
        type: "nested",          // preserves row-column structure
        properties: {
          row_number: {
            type: "integer"      // row number in the table
          },
          row: {
            type: "object",      // column_name: value pairs
            dynamic: true        // allows any column names dynamically
          }
        }
      },
      image: {
        properties: {
          caption: {
            type: "text",
            analyzer: "custom_text_analyzer"
          },
          imagetext: {
            type: "text",        // OCR extracted text
            analyzer: "custom_text_analyzer"
          },
          metadata: {
            properties: {
              width: { "type": "integer" },
              height: { "type": "integer" },
              format: { "type": "keyword" }
            }
          }
        }
      }
    }
  },
  settings: {
    analysis: {
      analyzer: {
        custom_text_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding", "stop"]
        }
      }
    }
  }
};

module.exports = {
  ELASTICSEARCH_CONFIG,
  INDEX_MAPPING
};
