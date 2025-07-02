# DocSmith - Professional Document Converter

A modern web application for converting documents between different formats including PDF, Word, and CSV files.

## Features

- **PDF to Word**: Convert PDF documents to Word format
- **Word to PDF**: Convert Word documents to PDF format  
- **CSV to PDF**: Convert CSV data to formatted PDF reports
- **PDF to CSV**: Extract tabular data from PDF to CSV format
- **Drag & Drop Interface**: Easy file upload with drag and drop support
- **Progress Tracking**: Real-time conversion progress indication
- **Responsive Design**: Works on desktop and mobile devices
- **File Validation**: Automatic file type and size validation
- **Modern UI**: Clean, professional interface with smooth animations

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **pdf-lib** - PDF manipulation
- **mammoth** - Word document processing
- **papaparse** - CSV parsing
- **jsPDF** - PDF generation

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Interactive functionality
- **Font Awesome** - Icons

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DocSmith
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload a file**: Drag and drop a file or click to browse
2. **Select conversion type**: Choose from the available conversion options
3. **Convert**: Click the convert button to start the process
4. **Download**: Download your converted file when ready

## Supported File Types

- **Input**: PDF, DOCX, DOC, CSV
- **Output**: PDF, HTML (Word alternative), CSV
- **File Size Limit**: 50MB per file

## API Endpoints

### POST /convert
Convert uploaded documents between formats.

**Parameters:**
- `file` (multipart/form-data): The file to convert
- `conversionType` (string): Type of conversion (pdf-to-word, word-to-pdf, csv-to-pdf, pdf-to-csv)

**Response:**
```json
{
  "success": true,
  "downloadUrl": "/downloads/converted-file.pdf",
  "filename": "converted-file.pdf"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-07-02T12:00:00.000Z"
}
```

## Project Structure

```
DocSmith/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── README.md             # Project documentation
├── public/               # Static files
│   ├── index.html        # Main HTML file
│   ├── style.css         # Stylesheet
│   └── script.js         # Client-side JavaScript
├── uploads/              # Temporary upload directory
└── downloads/            # Converted files directory
```

## Development Notes

### Current Implementation Status

- ✅ Basic file upload and validation
- ✅ Modern responsive UI
- ✅ Progress tracking and error handling
- ✅ CSV to PDF conversion (fully functional)
- ✅ Word to PDF conversion (basic implementation)
- ⚠️ PDF to Word conversion (placeholder - needs pdf-parse library)
- ⚠️ PDF to CSV conversion (placeholder - needs table extraction)

### Production Enhancements Needed

1. **PDF Text Extraction**: Implement `pdf-parse` for actual PDF text extraction
2. **Table Detection**: Add table detection for PDF to CSV conversion
3. **Word Document Creation**: Use `docx` library for proper Word document generation
4. **File Cleanup**: Implement automatic cleanup of temporary files
5. **Rate Limiting**: Add rate limiting for API endpoints
6. **Authentication**: Add user authentication if needed
7. **Cloud Storage**: Integrate with cloud storage for file handling
8. **Error Logging**: Implement comprehensive error logging

## Security Considerations

- File type validation
- File size limits
- Temporary file cleanup
- Input sanitization
- CORS configuration

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository or contact the development team.
