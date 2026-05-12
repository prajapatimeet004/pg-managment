const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');

router.post('/generate-receipt', pdfController.generateReceiptPDF);

module.exports = router;
