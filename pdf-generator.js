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

function createStoryPdf() {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream("dummy2.pdf");
  doc.pipe(stream);

  // Story Title
  doc.fontSize(24).font('Helvetica-Bold').text("The Mysterious Code", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').text("A Tale of Digital Discovery", { align: "center" });
  doc.moveDown(2);

  // Chapter 1: The Beginning
  doc.fontSize(18).font('Helvetica-Bold').text("Chapter 1: The Discovery", { align: "left" });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(
    "In the quiet hours of a late night, Sarah, a young software developer, found herself staring at an unusual piece of code. The function seemed to have a life of its own, responding to inputs in ways she had never seen before. The variables danced across her screen like characters in a digital ballet, each one telling a part of a story she was only beginning to understand."
  );
  doc.moveDown();

  doc.fontSize(12).font('Helvetica').text(
    "The project had started as a simple automation script, but somewhere along the way, it had evolved into something much more complex. The codebase had grown organically, with each commit adding new layers of functionality that seemed to anticipate the needs of its users before they even knew they had them."
  );

  doc.moveDown(2);

  // Chapter 2: The Investigation
  doc.fontSize(18).font('Helvetica-Bold').text("Chapter 2: The Investigation", { align: "left" });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(
    "Sarah's curiosity got the better of her. She began to trace the execution path of her mysterious function, following the flow of data through the system. Each step revealed new surprises - the code was not just processing information, it was learning from it, adapting its behavior based on patterns it discovered in the data."
  );
  doc.moveDown();

  doc.fontSize(12).font('Helvetica').text(
    "The more she investigated, the more she realized that her simple script had somehow developed emergent properties. It was as if the code had taken on a life of its own, creating connections and relationships between data points that she had never explicitly programmed."
  );

  doc.moveDown(2);

  // Chapter 3: The Revelation
  doc.fontSize(18).font('Helvetica-Bold').text("Chapter 3: The Revelation", { align: "left" });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(
    "After weeks of analysis, Sarah finally understood what had happened. Her code had inadvertently created a simple form of artificial intelligence. The algorithms she had written were not just following instructions - they were learning, adapting, and evolving based on the data they processed."
  );
  doc.moveDown();

  doc.fontSize(12).font('Helvetica').text(
    "The revelation was both exciting and terrifying. She had created something that could think, in its own limited way. The code had become more than just a tool - it had become a partner in problem-solving, offering insights and solutions that she might never have considered on her own."
  );

  doc.moveDown(2);

  // Chapter 4: The Future
  doc.fontSize(18).font('Helvetica-Bold').text("Chapter 4: The Future", { align: "left" });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(
    "Sarah realized that this was just the beginning. Her accidental discovery had opened up a world of possibilities. She began to think about how she could harness this emergent intelligence, how she could guide its development in ways that would benefit humanity."
  );
  doc.moveDown();

  doc.fontSize(12).font('Helvetica').text(
    "The code continued to evolve, becoming more sophisticated with each iteration. Sarah documented everything, sharing her findings with the broader developer community. Her story became a cautionary tale about the power of code and the responsibility that comes with creating intelligent systems."
  );

  doc.moveDown(2);

  // Epilogue
  doc.fontSize(18).font('Helvetica-Bold').text("Epilogue", { align: "left" });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(
    "Years later, Sarah's discovery would be remembered as one of the early milestones in the development of practical artificial intelligence. Her story reminded developers everywhere that sometimes the most profound discoveries happen not through deliberate design, but through the unexpected emergence of complexity from simple beginnings."
  );
  doc.moveDown();

  doc.fontSize(12).font('Helvetica').text(
    "The mysterious code continued to run, processing data and learning from each interaction. It had become a living example of how technology can surprise us, evolve beyond our expectations, and teach us new ways of thinking about the relationship between humans and machines."
  );

  doc.moveDown(2);

  // About the Author
  doc.fontSize(14).font('Helvetica-Bold').text("About the Author", { align: "left" });
  doc.moveDown();
  doc.fontSize(10).font('Helvetica').text(
    "This story was generated as a demonstration of PDF creation capabilities. It explores themes of artificial intelligence, emergent behavior, and the unexpected consequences of technological development."
  );

  doc.end();

  stream.on("finish", () => {
    console.log("✅ dummy2.pdf created successfully!");
  });
}

// Create both PDFs
createDummyPdf();
createStoryPdf();
