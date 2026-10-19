import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { AnnualResult } from "../models/resultModel";

export const pdfService = {
  generateBulletinPdf: async (
    result: AnnualResult,
    studentName: string,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const exportsDir = path.join(__dirname, "../../uploads/bulletins");
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir, { recursive: true });
        }

        const fileName = `bulletin_${result.studentId}_${result.academicYear}.pdf`;
        const filePath = path.join(exportsDir, fileName);
        const relativeUrl = `/uploads/bulletins/${fileName}`;

        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // --- EN-TÊTE DU BULLETIN ---
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("BULLETIN DE NOTES ANNUEL", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");
        doc.text(`Année Scolaire : ${result.academicYear}`, {
          align: "center",
        });
        doc.moveDown(1);

        // Informations de l'étudiant
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("Étudiant : ", { continued: true })
          .font("Helvetica")
          .text(studentName);
        doc
          .font("Helvetica-Bold")
          .text("Classe : ", { continued: true })
          .font("Helvetica")
          .text(result.classGroup);
        doc
          .font("Helvetica-Bold")
          .text("Statut du Bulletin : ", { continued: true })
          .font("Helvetica")
          .text(result.status);
        doc.moveDown(1.5);

        // --- TABLEAU DES NOTES (8 COLONNES) ---
        const startX = 40;
        let currentY = doc.y;

        // En-tête du tableau
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text("Matière", startX, currentY, { width: 130 });
        doc.text("Coef", startX + 135, currentY, {
          width: 35,
          align: "center",
        });
        doc.text("ST1", startX + 175, currentY, { width: 40, align: "center" });
        doc.text("T1", startX + 220, currentY, { width: 40, align: "center" });
        doc.text("ST2", startX + 265, currentY, { width: 40, align: "center" });
        doc.text("T2", startX + 310, currentY, { width: 40, align: "center" });
        doc.text("ST3", startX + 355, currentY, { width: 40, align: "center" });
        doc.text("T3", startX + 400, currentY, { width: 40, align: "center" });

        // Ligne de séparation
        currentY += 15;
        doc
          .moveTo(startX, currentY)
          .lineTo(startX + 510, currentY)
          .stroke();
        currentY += 8;

        // Contenu du tableau
        doc.font("Helvetica").fontSize(9);
        for (const sub of result.subjects) {
          doc.text(sub.subjectName || "Matière", startX, currentY, {
            width: 130,
          });
          doc.text(sub.coefficient.toString(), startX + 135, currentY, {
            width: 35,
            align: "center",
          });
          doc.text(
            sub.term1SemiTrimesterGrade?.toString() ?? "-",
            startX + 175,
            currentY,
            { width: 40, align: "center" },
          );
          doc.text(
            sub.term1TrimesterGrade?.toString() ?? "-",
            startX + 220,
            currentY,
            { width: 40, align: "center" },
          );
          doc.text(
            sub.term2SemiTrimesterGrade?.toString() ?? "-",
            startX + 265,
            currentY,
            { width: 40, align: "center" },
          );
          doc.text(
            sub.term2TrimesterGrade?.toString() ?? "-",
            startX + 310,
            currentY,
            { width: 40, align: "center" },
          );
          doc.text(
            sub.term3SemiTrimesterGrade?.toString() ?? "-",
            startX + 355,
            currentY,
            { width: 40, align: "center" },
          );
          doc.text(
            sub.term3TrimesterGrade?.toString() ?? "-",
            startX + 400,
            currentY,
            { width: 40, align: "center" },
          );

          currentY += 18;
        }

        // Ligne de séparation
        doc
          .moveTo(startX, currentY)
          .lineTo(startX + 510, currentY)
          .stroke();
        currentY += 15;

        // --- SYNTHÈSE ET RÉSULTATS ANNUELS ---
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("SYNTHÈSE ANNUELLE", startX, currentY);
        currentY += 20;

        doc.fontSize(10).font("Helvetica");
        doc.text(
          `Total des Coefficients : ${result.totalCoefficients}`,
          startX,
          currentY,
        );
        currentY += 15;
        doc
          .font("Helvetica-Bold")
          .text(
            `Moyenne Générale : ${result.overallAverage} / 20`,
            startX,
            currentY,
          );
        currentY += 15;
        doc
          .font("Helvetica")
          .text(
            `Rang dans la classe : ${result.classRank ? `${result.classRank}e` : "N/A"}`,
            startX,
            currentY,
          );
        currentY += 15;
        doc
          .font("Helvetica-Bold")
          .text(`Décision du Conseil : ${result.decision}`, startX, currentY);

        // --- PIED DE PAGE ET SIGNATURE ---
        doc.moveDown(3);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Signature de l'Administration", 350, doc.y, {
            align: "right",
          });

        doc.end();

        stream.on("finish", () => resolve(relativeUrl));
        stream.on("error", (err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  },
};
