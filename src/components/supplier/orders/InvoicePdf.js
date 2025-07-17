import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InvoicePdf() {
    function addFooter(doc) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const footerHeight = 25;
        const footerY = pageHeight - footerHeight;
        const columnY = footerY + 17;
        const boxHeight = 10;
        const columnWidth = 40;
        const startX = 15;
        const gap = 5;

        const grayBg = "#f2f5fa";
        const lightGrayBox = "#e9eefb";
        const textColor = "#333333";

        // Draw full gray footer background
        doc.setFillColor(grayBg);
        doc.rect(0, footerY, pageWidth, footerHeight, "F");

        // Set font styles
        doc.setFontSize(8);
        doc.setTextColor(textColor);

        // Centered address text
        const centerText = "123 Your Street City, State, Country, Zip Code";
        doc.text(centerText, pageWidth / 2, footerY + 8, { align: "center" });

        // Contact column values
        const columns = [
            { label: "Tel: +1-541-754-3010" },
            { label: "Fax: +1-541-754-3010" },
            { label: "Email: info@yourwebsite.com" },
            { label: "www.yourwebsite.com" },
        ];

        columns.forEach((col, i) => {
            const x = startX + i * (columnWidth + gap);

            // Draw light gray box behind text
            doc.setFillColor(lightGrayBox);
            doc.rect(x, columnY - boxHeight + 5, columnWidth, boxHeight, "F");

            // Draw the text inside the box
            doc.setTextColor(textColor);
            doc.text(col.label, x + 3, columnY);
        });
    }
    const generateInvoicePDF = () => {
        const doc = new jsPDF();
        const margin = 14;
        const text = "ShipOwl";
        const fontSize = 20;
        const padding = 3;

        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(131, 145, 162);

        const x = margin;
        const y = 20; // baseline for text

        const textWidth = doc.getTextWidth(text);
        const rectHeight = 10;

        // Background rectangle should start *above* the text baseline
        const rectY = 13; // correct top alignment

        doc.setFillColor(233, 238, 251); // light blue
        doc.rect(x, rectY, textWidth + padding * 2 + 50, rectHeight, "F");

        // Draw the text on top
        doc.text(text, x, y);

        // Header Section
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const boxY = 25;
        const boxHeight = 25;
        const boxWidth = 40;

        // Draw left box
        doc.setFillColor(233, 238, 251); // Light blue
        doc.rect(margin, boxY, boxWidth, boxHeight, "F");
        doc.rect(margin + boxWidth + 2, boxY, boxWidth, boxHeight, "F");

        // Left box content (e.g., "Billing From")
        doc.setTextColor(40);
        const address = "Building name 123 Your, Street City/State ,Country, Zip Code";

        // Split into array by comma
        const addressLines = address.split(",");

        doc.setTextColor(40);

        // Loop through and draw each line
        addressLines.forEach((line, index) => {
            doc.text(line.trim(), margin + 2, boxY + 4 + index * 4); // 6 is line spacing
        });
        // Right box content (e.g., "Billing To" — placeholder data)
        doc.text("+1-541-754-3010", margin + boxWidth + 4, boxY + 5);
        doc.text("you@email.com", margin + boxWidth + 4, boxY + 9);
        doc.text("yourwebsite.com", margin + boxWidth + 4, boxY + 13);
        doc.text("GSTIN", margin + boxWidth + 4, boxY + 17);


        doc.setFontSize(16);
        doc.setTextColor(94, 112, 122)
        doc.text("Invoice", 130, y);

        // Invoice Info
        doc.setFontSize(10);
        const invoiceData = [
            ["Date:", "MM/DD/YYYY"],
            ["Invoice #:", "00001"],
            ["Customer #:", "CUST123"],
            ["Purchase order #:", "00002"],
            ["Payment due by:", "MM/DD/YYYY"],
        ];

        invoiceData.forEach(([label, value], i) => {
            const y = 30 + i * 7;

            // Draw background for value
            doc.setFillColor(233, 238, 251); // light blue
            doc.rect(165, y - 4, 30, 6.5, "F"); // adjust width/height as needed

            // Label (key)
            doc.setTextColor(50, 60, 66); // dark gray-blue
            doc.setFont("helvetica", "bold"); // make it bold
            doc.text(label, 130, y);

            // Value (normal weight)
            doc.setTextColor(0); // black
            doc.setFont("helvetica", "normal");
            doc.text(value, 170, y);
        });




        const sectionHeaders = [
            { title: "Billed to", x: margin, y: 65 },
            { title: "Ship to (if different)", x: 130, y: 65 },
        ];

        sectionHeaders.forEach(({ title, x, y }) => {
            doc.setFillColor(94, 112, 122); // dark gray/green
            doc.rect(x, y, 65, 8, "F");
            doc.setTextColor(255);
            doc.text(title, x + 2, y + 5);
            doc.setTextColor(0);
        });

        // Add background rectangles for client info sections
        const infoBoxHeight = 25;
        const infoBoxWidth = 65;
        const infoBoxY = 73;

        doc.setFillColor(233, 238, 251); // light blue background

        // Left box (Billed to)
        doc.rect(margin, infoBoxY + 5, infoBoxWidth, infoBoxHeight, "F");

        // Right box (Ship to)
        doc.rect(130, infoBoxY + 5, infoBoxWidth, infoBoxHeight, "F");

        // Client Info Text
        doc.setTextColor(0);
        doc.setFontSize(10);

        // Left box content
        doc.text("Client name", margin + 2, infoBoxY + 9);
        doc.text("123 Your Street City, State,", margin + 2, infoBoxY + 15);
        doc.text("Country Zip Code", margin + 2, infoBoxY + 21);
        doc.text("Phone", margin + 2, infoBoxY + 27);

        // Right box content
        doc.text("Client name", 130 + 2, infoBoxY + 9);
        doc.text("123 Your Street City, State,", 130 + 2, infoBoxY + 15);
        doc.text("Country Zip Code", 130 + 2, infoBoxY + 21);
        doc.text("Phone", 130 + 2, infoBoxY + 27);

        // Item Table
        autoTable(doc, {
            head: [["Description", "Unit cost", "QTY/HR Rate", "Amount"]],
            body: Array(8).fill(["Your item name", "$0.00", "1", "$0.00"]),
            startY: 110, // fallback to 100 if no table rendered before
            headStyles: {
                fillColor: [94, 112, 122], // dark grayish-green
                cellPadding: 3,
                textColor: 255
            },
            bodyStyles: {
                fillColor: [233, 238, 251], // light blue #e9eefb
                lineColor: [255, 255, 255],
                lineWidth: 0.6,
                cellPadding: 3,
                textColor: 0
            },
            alternateRowStyles: {
                fillColor: [233, 238, 251] // disable stripe effect by matching body fill
            }
        });


        // Notes Section
        let yPosition = doc.lastAutoTable?.finalY
        const notesHeaderY = yPosition + 10;

        // Header
        doc.setFillColor(94, 112, 122); // dark green/gray
        doc.rect(margin, notesHeaderY, 120, 8, "F"); // x, y, width, height
        doc.setTextColor(255);
        doc.setFontSize(11);
        doc.text("Special notes and instructions", margin + 2, notesHeaderY + 5);

        // Note Content Box
        const notesBoxY = notesHeaderY + 10;
        const notesBoxHeight = 30; // adjust height as needed

        doc.setFillColor(233, 238, 251); // light blue background
        doc.rect(margin, notesBoxY, 120, notesBoxHeight, "F"); // Fill + Draw

        // Notes Text
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text("Your notes here", margin + 1, notesBoxY + 15); // place text inside box with some padding


        // Summary
        const summaryStartY = yPosition + 15;

        const summary = [
            ["Subtotal:", "$0.00"],
            ["Discount:", "$0.00"],
            ["Tax rate:", "%"],
            ["Tax:", "$0.00"],
            ["Total:", "$0.00"],
        ];

        summary.forEach(([label, val], i) => {
            yPosition = summaryStartY + i * 8;

            // Background behind the value box
            doc.setFillColor(233, 238, 251); // light blue background
            doc.rect(160, yPosition - 5, 35, 8, "F"); // x, yPosition, width, height

            // Label (left side)
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(label, 140, yPosition);

            // Value (right-aligned inside the box)
            doc.setFont("helvetica", "normal");
            doc.text(val, 193, yPosition, { align: "right" }); // right-align to x=193
        });

        yPosition = yPosition + 10;
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        doc.setFontSize(12);
        doc.setTextColor(94, 112, 122)
        doc.text("Thank you for your business!", centerX, yPosition + 5, { align: "center" });

        doc.setFontSize(9);
        doc.text(
            "Should you have any enquiries concerning this invoice, please contact us.",
            centerX,
            yPosition + 10,
            { align: "center" }
        );

        addFooter(doc)
        doc.save("invoice.pdf");
    };

    return (
        <div
            onClick={generateInvoicePDF}
            className="cursor-pointer text-blue-600 underline"
        >
            Download Invoice PDF
        </div>
    );
}
