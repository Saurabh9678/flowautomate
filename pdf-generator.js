// filename: createDummyPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");

function createDummyPdf() {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream("dummy.pdf");
  doc.pipe(stream);

  // Title 1
  doc.fontSize(18).text("Introduction", { align: "left" });
  doc.moveDown();
  doc.fontSize(12).text(
    "This is the first paragraph of the PDF document. It contains some sample text to demonstrate how text appears inside the PDF file. The quick brown fox jumps over the lazy dog. This is a dummy content for demonstration purposes."
  );

  doc.moveDown(2);

  // Title 2
  doc.fontSize(18).text("Background", { align: "left" });
  doc.moveDown();
  doc.fontSize(12).text(
    "This is the second paragraph. It provides more dummy text to simulate longer content. PDFKit is a great library for programmatically creating PDF documents using Node.js. With it, you can add text, images, tables, and more."
  );

  doc.moveDown(2);

  // Title 3
  doc.fontSize(18).text("Q4 2024 Sales Performance", { align: "left" });
  doc.moveDown();

  // Draw table manually with meaningful sales data
  const tableTop = doc.y;
  const itemHeight = 25; // Increased height for better spacing
  const colWidths = [60, 180, 120, 140];
  const headers = ["ID", "Product Name", "Units Sold", "Revenue ($)"];

  // Meaningful sales data
  const salesData = [
    [1, "MacBook Pro 16\"", "1,245", "$3,107,500"],
    [2, "iPhone 15 Pro", "2,890", "$2,890,000"],
    [3, "iPad Air", "1,567", "$940,200"],
    [4, "AirPods Pro", "3,421", "$854,250"],
    [5, "Apple Watch Series 9", "2,103", "$840,200"],
    [6, "iMac 24\"", "876", "$1,095,000"],
    [7, "Mac Studio", "234", "$468,000"],
    [8, "HomePod mini", "1,876", "$187,600"],
    [9, "Magic Keyboard", "987", "$128,310"],
    [10, "Studio Display", "456", "$729,600"]
  ];

  // Header row
  headers.forEach((header, i) => {
    doc.rect(50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, colWidths[i], itemHeight).stroke();
    doc.fontSize(10).font('Helvetica-Bold').text(header, 55 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop + 8);
  });

  // Data rows with better spacing
  salesData.forEach((rowData, rowIndex) => {
    const y = tableTop + (rowIndex + 1) * itemHeight;
    rowData.forEach((data, i) => {
      doc.rect(50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, colWidths[i], itemHeight).stroke();
      doc.fontSize(9).font('Helvetica').text(data.toString(), 55 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y + 8);
    });
  });

  doc.moveDown(4);

  // Image Section
  doc.fontSize(18).text("Sample Image", { align: "left" });
  doc.moveDown();

  try {
    doc.image("dummy-image.png", { fit: [250, 250], align: "center" });
    doc.moveDown();
    doc.fontSize(12).text("Figure 1: Sample placeholder image", { align: "center" });
  } catch (err) {
    doc.fontSize(12).fillColor("red").text("⚠️ sample.png not found, please place an image in the project folder.", { align: "center" });
  }

  doc.end();

  stream.on("finish", () => {
    console.log("✅ dummy.pdf created successfully!");
  });
}

createDummyPdf();
