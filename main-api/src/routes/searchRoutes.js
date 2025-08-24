const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/SearchController');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');


router.use(authenticateToken);

/**
 * @route GET /search
 * @desc Search PDF content with various filters
 * @access Private
 * @query {string} query - Search query text
 * @query {string} pdf_filename - PDF filename to filter by
 * @query {string} type - Content type filter (paragraph, table, image)
 * @query {number} page_number - Page number filter
 * @query {number} total_pages - Total pages filter
 * @query {string} sort_by - Sort field (relevance, page_number, total_pages, type)
 * @query {string} sort_order - Sort order (asc, desc)
 * @query {number} size - Number of results (default: 20)
 * @query {number} from - Pagination offset (default: 0)
 */
router.get('/', asyncHandler(SearchController.searchPdfContent));


module.exports = router;
