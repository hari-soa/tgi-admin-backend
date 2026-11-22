import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { AnnualResult, SubjectGradeField } from "../models/resultModel";

const PAGE_MARGIN = 40;
const TABLE_WIDTH = 510;
const HEADER_ROW_HEIGHT = 23;
const BODY_ROW_HEIGHT = 18;
const SUBJECT_COLUMN_WIDTH = 130;
const COEFFICIENT_COLUMN_X = 135;
const COEFFICIENT_COLUMN_WIDTH = 35;
const GRADE_COLUMN_WIDTH = 40;
const AVERAGE_COLUMN_X = 445;
const AVERAGE_COLUMN_WIDTH = 65;

const GRADE_COLUMNS: {
  label: string;
  field: SubjectGradeField;
  offsetX: number;
}[] = [
  { label: "ST1", field: "term1SemiTrimesterGrade", offsetX: 175 },
  { label: "T1", field: "term1TrimesterGrade", offsetX: 220 },
  { label: "ST2", field: "term2SemiTrimesterGrade", offsetX: 265 },
  { label: "T2", field: "term2TrimesterGrade", offsetX: 310 },
  { label: "ST3", field: "term3SemiTrimesterGrade", offsetX: 355 },
  { label: "T3", field: "term3TrimesterGrade", offsetX: 400 },
];

const EXPORTS_DIRECTORY = path.join(__dirname, "../../uploads/report-cards");

export const pdfService = {
  generateReportCardPdf: async (
    result: AnnualResult,
    studentName: string,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        fs.mkdirSync(EXPORTS_DIRECTORY, { recursive: true });

        const fileName = `report-card_${result.studentId}_${result.academicYear}.pdf`;
        const filePath = path.join(EXPORTS_DIRECTORY, fileName);
        const publicUrl = `/uploads/report-cards/${fileName}`;

        const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4" });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("BULLETIN DE NOTES ANNUEL", { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Année scolaire : ${result.academicYear}`, { align: "center" });
        doc.moveDown(1);
        const studentInformation = [
          { label: "Élève : ", value: studentName },
          { label: "Classe : ", value: result.classGroup },
          { label: "Statut du bulletin : ", value: result.status },
          {
            label: "Notes : ",
            value: "note sur 20 multipliée par le coefficient de la matière",
          },
        ];
        doc.fontSize(11);
        studentInformation.forEach(({ label, value }) => {
          doc
            .font("Helvetica-Bold")
            .text(label, { continued: true })
            .font("Helvetica")
            .text(value);
        });
        doc.moveDown(1.5);
        const tableTop = doc.y;
        const separatorY = tableTop + 15;

        doc.fontSize(9).font("Helvetica-Bold");
        doc.text("Matière", PAGE_MARGIN, tableTop, {
          width: SUBJECT_COLUMN_WIDTH,
        });
        doc.text("Coef", PAGE_MARGIN + COEFFICIENT_COLUMN_X, tableTop, {
          width: COEFFICIENT_COLUMN_WIDTH,
          align: "center",
        });
        GRADE_COLUMNS.forEach(({ label, offsetX }) => {
          doc.text(label, PAGE_MARGIN + offsetX, tableTop, {
            width: GRADE_COLUMN_WIDTH,
            align: "center",
          });
        });
        doc.text("Moyenne", PAGE_MARGIN + AVERAGE_COLUMN_X, tableTop, {
          width: AVERAGE_COLUMN_WIDTH,
          align: "center",
        });
        doc
          .moveTo(PAGE_MARGIN, separatorY)
          .lineTo(PAGE_MARGIN + TABLE_WIDTH, separatorY)
          .stroke();

        doc.font("Helvetica").fontSize(9);
        result.subjects.forEach((subject, rowIndex) => {
          const rowY =
            tableTop + HEADER_ROW_HEIGHT + rowIndex * BODY_ROW_HEIGHT;
          doc.text(subject.subjectName || "Matière", PAGE_MARGIN, rowY, {
            width: SUBJECT_COLUMN_WIDTH,
          });
          doc.text(
            subject.coefficient.toString(),
            PAGE_MARGIN + COEFFICIENT_COLUMN_X,
            rowY,
            { width: COEFFICIENT_COLUMN_WIDTH, align: "center" },
          );
          doc.text(
            subject.subjectOverallAverage?.toString() ?? "",
            PAGE_MARGIN + AVERAGE_COLUMN_X,
            rowY,
            { width: AVERAGE_COLUMN_WIDTH, align: "center" },
          );
          GRADE_COLUMNS.forEach(({ field, offsetX }) => {
            doc.text(
              subject[field]?.toString() ?? "",
              PAGE_MARGIN + offsetX,
              rowY,
              {
                width: GRADE_COLUMN_WIDTH,
                align: "center",
              },
            );
          });
        });
        const tableBottom =
          tableTop +
          HEADER_ROW_HEIGHT +
          result.subjects.length * BODY_ROW_HEIGHT;
        doc
          .moveTo(PAGE_MARGIN, tableBottom)
          .lineTo(PAGE_MARGIN + TABLE_WIDTH, tableBottom)
          .stroke();

        const summaryLines = [
          { text: "SYNTHÈSE ANNUELLE", font: "Helvetica-Bold", size: 11 },
          {
            text: `Total des coefficients : ${result.totalCoefficients}`,
            font: "Helvetica",
            size: 10,
          },
          {
            text: `Moyenne générale : ${result.overallAverage} / 20`,
            font: "Helvetica-Bold",
            size: 10,
          },
          {
            text: `Rang dans la classe : ${result.classRank ? `${result.classRank}e` : "N/A"}`,
            font: "Helvetica",
            size: 10,
          },
          {
            text: `Décision du conseil : ${result.decision}`,
            font: "Helvetica-Bold",
            size: 10,
          },
        ];
        summaryLines.forEach((line, lineIndex) => {
          doc
            .font(line.font)
            .fontSize(line.size)
            .text(line.text, PAGE_MARGIN, tableBottom + 15 + lineIndex * 18);
        });
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Signature de l'administration", 350, tableBottom + 130, {
            align: "right",
          });

        doc.end();

        stream.on("finish", () => resolve(publicUrl));
        stream.on("error", (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  },
};
