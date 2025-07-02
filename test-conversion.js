const fs = require('fs-extra');
const path = require('path');

// Create test files for conversion testing

async function createTestFiles() {
  // Ensure test directory exists
  await fs.ensureDir('test-files');
  
  // Create a test CSV file
  const csvContent = `Name,Age,City,Occupation
John Doe,30,New York,Software Engineer
Jane Smith,25,Los Angeles,Designer
Bob Johnson,35,Chicago,Manager
Alice Brown,28,Houston,Developer
Charlie Wilson,32,Phoenix,Analyst
Diana Davis,29,Philadelphia,Consultant
Eve Miller,31,San Antonio,Architect
Frank Garcia,27,San Diego,Writer
Grace Rodriguez,33,Dallas,Teacher
Henry Martinez,26,San Jose,Student`;

  await fs.writeFile('test-files/sample.csv', csvContent);
  
  // Create a test Word document content (as text for now)
  const wordContent = `This is a sample Word document for testing conversion.

This document contains multiple paragraphs to test the conversion functionality.

Features to test:
- Multiple paragraphs
- Different text formatting
- Line breaks and spacing
- Special characters: áéíóú, ñ, ü
- Numbers: 123, 456.789
- Symbols: @#$%^&*()

This document should be converted to PDF while maintaining the structure and readability.

The conversion process should handle:
1. Text formatting
2. Paragraph spacing
3. Character encoding
4. Page breaks when necessary

End of test document.`;

  await fs.writeFile('test-files/sample.txt', wordContent);
  
  console.log('Test files created successfully!');
  console.log('- test-files/sample.csv');
  console.log('- test-files/sample.txt');
  console.log('\nYou can now test the conversion functionality.');
}

createTestFiles().catch(console.error);
