const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { PDFDocument, rgb } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Papa = require('papaparse');
const jsPDF = require('jspdf').jsPDF;
const { Document, Packer, Paragraph, TextRun } = require('docx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/downloads', express.static('downloads'));

// Ensure directories exist
fs.ensureDirSync('uploads');
fs.ensureDirSync('downloads');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Conversion functions
class DocumentConverter {
  
  // PDF to Word conversion - Enhanced with actual text extraction
  static async pdfToWord(inputPath, outputPath) {
    try {
      const pdfBuffer = await fs.readFile(inputPath);
      
      // Extract text using pdf-parse
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text;
      const numPages = pdfData.numpages;
      
      // Split text into paragraphs for better formatting
      const paragraphs = extractedText.split('\n').filter(p => p.trim().length > 0);
      
      // Create a proper Word document using docx library
      const docChildren = [
        new Paragraph({
          children: [
            new TextRun({
              text: "Converted from PDF Document",
              bold: true,
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Total Pages: ${numPages}`,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Conversion Date: ${new Date().toLocaleString()}`,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "",
              size: 24,
            }),
          ],
        }),
      ];

      // Add extracted content as paragraphs
      paragraphs.forEach(paragraph => {
        if (paragraph.trim().length > 0) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph,
                  size: 22,
                }),
              ],
            })
          );
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(outputPath, buffer);
      
      return outputPath;
    } catch (error) {
      throw new Error(`PDF to Word conversion failed: ${error.message}`);
    }
  }

  // Word to PDF conversion - Enhanced with better formatting
  static async wordToPdf(inputPath, outputPath) {
    try {
      // Extract both raw text and HTML for better formatting
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ path: inputPath }),
        mammoth.convertToHtml({ path: inputPath })
      ]);
      
      const text = textResult.value;
      const html = htmlResult.value;
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set up document properties
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Converted Word Document', margin, margin);
      
      let yPosition = margin + 15;
      
      // Process text with better formatting
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      // Split text into paragraphs
      const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
      
      paragraphs.forEach((paragraph, index) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Handle long paragraphs by splitting them
        const lines = doc.splitTextToSize(paragraph, maxWidth);
        
        lines.forEach(line => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
        
        yPosition += 3; // Add space between paragraphs
      });
      
      // Add metadata
      doc.setProperties({
        title: 'Converted from Word Document',
        creator: 'DocSmith Converter',
        creationDate: new Date()
      });
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      await fs.writeFile(outputPath, pdfBuffer);
      
      return outputPath;
    } catch (error) {
      throw new Error(`Word to PDF conversion failed: ${error.message}`);
    }
  }

  // CSV to PDF conversion - Enhanced with better table formatting
  static async csvToPdf(inputPath, outputPath) {
    try {
      const csvData = await fs.readFile(inputPath, 'utf8');
      const parsed = Papa.parse(csvData, { 
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
      });
      
      const doc = new jsPDF({
        orientation: 'landscape', // Better for tables
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;
      
      // Add title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('CSV Data Report', margin, yPosition);
      yPosition += 15;
      
      // Add generation info
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
      doc.text(`Total Records: ${parsed.data.length}`, margin, yPosition + 5);
      yPosition += 20;
      
      if (parsed.data.length > 0) {
        const headers = Object.keys(parsed.data[0]);
        const colWidth = (pageWidth - (margin * 2)) / headers.length;
        
        // Draw table headers
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(230, 230, 230);
        
        headers.forEach((header, index) => {
          const x = margin + (index * colWidth);
          doc.rect(x, yPosition - 4, colWidth, 8, 'F');
          doc.text(header.substring(0, 15), x + 2, yPosition);
        });
        
        yPosition += 10;
        
        // Draw table data
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        
        parsed.data.forEach((row, rowIndex) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            
            // Redraw headers on new page
            doc.setFont(undefined, 'bold');
            doc.setFillColor(230, 230, 230);
            headers.forEach((header, index) => {
              const x = margin + (index * colWidth);
              doc.rect(x, yPosition - 4, colWidth, 8, 'F');
              doc.text(header.substring(0, 15), x + 2, yPosition);
            });
            yPosition += 10;
            doc.setFont(undefined, 'normal');
          }
          
          // Alternate row colors
          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), 8, 'F');
          }
          
          headers.forEach((header, index) => {
            const x = margin + (index * colWidth);
            const cellValue = String(row[header] || '').substring(0, 20);
            doc.text(cellValue, x + 2, yPosition);
          });
          
          yPosition += 8;
        });
      }
      
      // Add footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
      }
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      await fs.writeFile(outputPath, pdfBuffer);
      
      return outputPath;
    } catch (error) {
      throw new Error(`CSV to PDF conversion failed: ${error.message}`);
    }
  }

  // PDF to CSV conversion - Enhanced with actual text extraction
  static async pdfToCsv(inputPath, outputPath) {
    try {
      const pdfBuffer = await fs.readFile(inputPath);
      const pdfData = await pdfParse(pdfBuffer);
      
      const csvData = [];
      
      // Add header row
      csvData.push(['Page_Number', 'Line_Number', 'Content', 'Character_Count']);
      
      // Split text by pages (approximate)
      const allText = pdfData.text;
      const lines = allText.split('\n');
      
      let currentPage = 1;
      let lineNumber = 1;
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          // Estimate page breaks (this is approximate)
          if (lineNumber > 50) { // Assume ~50 lines per page
            currentPage++;
            lineNumber = 1;
          }
          
          csvData.push([
            currentPage,
            lineNumber,
            trimmedLine,
            trimmedLine.length
          ]);
          
          lineNumber++;
        }
      });
      
      // Add summary information
      csvData.push([
        'SUMMARY',
        'Total Lines',
        lines.filter(l => l.trim().length > 0).length,
        'Summary'
      ]);
      
      csvData.push([
        'SUMMARY',
        'Total Pages',
        pdfData.numpages,
        'Summary'
      ]);
      
      csvData.push([
        'SUMMARY',
        'Total Characters',
        allText.length,
        'Summary'
      ]);
      
      // Convert to CSV format
      const csvContent = Papa.unparse(csvData);
      await fs.writeFile(outputPath, csvContent);
      
      return outputPath;
    } catch (error) {
      throw new Error(`PDF to CSV conversion failed: ${error.message}`);
    }
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload and conversion endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { conversionType } = req.body;
    if (!conversionType) {
      return res.status(400).json({ error: 'Conversion type not specified' });
    }

    const inputPath = req.file.path;
    const inputExt = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, inputExt);
    
    // Validate file type matches conversion type
    const validationResult = validateConversionType(inputExt, conversionType);
    if (!validationResult.valid) {
      await fs.remove(inputPath); // Clean up uploaded file
      return res.status(400).json({ error: validationResult.message });
    }
    
    let outputPath;
    let outputExt;

    // Determine output extension based on conversion type
    switch (conversionType) {
      case 'pdf-to-word':
        outputExt = '.docx';
        break;
      case 'word-to-pdf':
        outputExt = '.pdf';
        break;
      case 'csv-to-pdf':
        outputExt = '.pdf';
        break;
      case 'pdf-to-csv':
        outputExt = '.csv';
        break;
      default:
        await fs.remove(inputPath);
        return res.status(400).json({ error: 'Invalid conversion type' });
    }

    outputPath = path.join('downloads', `${baseName}_converted_${Date.now()}${outputExt}`);

    // Perform conversion
    let result;
    try {
      switch (conversionType) {
        case 'pdf-to-word':
          result = await DocumentConverter.pdfToWord(inputPath, outputPath);
          break;
        case 'word-to-pdf':
          result = await DocumentConverter.wordToPdf(inputPath, outputPath);
          break;
        case 'csv-to-pdf':
          result = await DocumentConverter.csvToPdf(inputPath, outputPath);
          break;
        case 'pdf-to-csv':
          result = await DocumentConverter.pdfToCsv(inputPath, outputPath);
          break;
      }
    } catch (conversionError) {
      await fs.remove(inputPath); // Clean up uploaded file
      throw conversionError;
    }

    // Clean up uploaded file
    await fs.remove(inputPath);

    // Verify output file was created
    if (!await fs.pathExists(result)) {
      throw new Error('Conversion completed but output file was not created');
    }

    const downloadUrl = `/downloads/${path.basename(result)}`;
    res.json({ 
      success: true, 
      downloadUrl: downloadUrl,
      filename: path.basename(result),
      originalFilename: req.file.originalname,
      conversionType: conversionType
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up files in case of error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred during conversion',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Validation function for file types and conversion types
function validateConversionType(fileExt, conversionType) {
  const validCombinations = {
    'pdf-to-word': ['.pdf'],
    'word-to-pdf': ['.docx', '.doc'],
    'csv-to-pdf': ['.csv'],
    'pdf-to-csv': ['.pdf']
  };

  const allowedExtensions = validCombinations[conversionType];
  
  if (!allowedExtensions) {
    return { valid: false, message: 'Invalid conversion type' };
  }

  if (!allowedExtensions.includes(fileExt)) {
    return { 
      valid: false, 
      message: `File type ${fileExt} is not compatible with ${conversionType} conversion. Expected: ${allowedExtensions.join(', ')}` 
    };
  }

  return { valid: true };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// File cleanup function
async function cleanupOldFiles() {
  try {
    const downloadsDir = 'downloads';
    const uploadsDir = 'uploads';
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    for (const dir of [downloadsDir, uploadsDir]) {
      if (await fs.pathExists(dir)) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          const age = Date.now() - stats.mtime.getTime();
          
          if (age > maxAge) {
            await fs.remove(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// Run initial cleanup on startup
cleanupOldFiles();

app.listen(PORT, () => {
  console.log(`DocSmith Converter running on http://localhost:${PORT}`);
});
