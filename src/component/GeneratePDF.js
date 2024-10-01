// pdfUtils.js
import { PDFDocument, rgb } from "pdf-lib";

export const modifyAndDownloadPdf = async (pdfFile, selectedRow) => {
  if (!pdfFile) return;
  console.log(selectedRow, "selected rpw");
  try {
    const pdfDoc = await PDFDocument.load(pdfFile);
    const page = pdfDoc.getPages()[0];

    const {
      Locomotive_Number: locoNumber,
      Mileage,
      Operating_Company: companyText,
    } = selectedRow;

    const positions = [
      { name: "SD", y: 380 },
      { name: "SH", y: 360 },
      { name: "QR", y: 343 },
      { name: "D", y: 325 },
      { name: "H", y: 305 },
    ];

    const textToDraw = [
      { text: locoNumber, x: 420, y: 750, size: 10 },
      { text: companyText, x: 150, y: 720, size: 10 },
      { text: Mileage, x: 420, y: 720, size: 10 },
    ];

    textToDraw.forEach(({ text, x, y, size }) => {
      page.drawText(text?.toString() || "-", {
        x,
        y,
        size,
        color: rgb(0, 100 / 255, 0),
      });
    });

    const drawTextGroup = (groupName, y) => {
      for (let i = 1; i <= 4; i++) {
        const left = selectedRow[`${groupName}${i}_LEFT`];
        const right = selectedRow[`${groupName}${i}_RIGHT`];
        const leftX = 140 + (i - 1) * 100;
        const rightX = 190 + (i - 1) * 100;

        page.drawText(left?.toString() || "-", {
          x: leftX,
          y,
          size: 8,
          color: rgb(139 / 255, 0, 0),
        });
        page.drawText(right?.toString() || "-", {
          x: rightX,
          y,
          size: 8,
          color: rgb(139 / 255, 0, 0),
        });
      }
    };

    positions.forEach((pos) => drawTextGroup(pos.name, pos.y));

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "Wheel_inspection_report.pdf";
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error modifying PDF:", error);
  }
};
