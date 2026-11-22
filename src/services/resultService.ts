import {
  resultRepository,
  AnnualResultInput,
} from "../repositories/resultRepository";
import {
  AbsentSubjectRow,
  gradeRepository,
  PublishedGradeRow,
} from "../repositories/gradeRepository";
import { userRepository } from "../repositories/userRepository";
import { CreateAnnualResultDto } from "../dtos/resultDto";
import {
  AnnualResult,
  SubjectGradeBreakdown,
  SubjectGradeField,
} from "../models/resultModel";
import { TokenPayload } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { assertCanAccessStudentData } from "../utils/accessControl";
import { pdfService } from "./pdfService";

const TERM_NUMBER: Record<string, number> = {
  FIRST_TRIMESTER: 1,
  SECOND_TRIMESTER: 2,
  THIRD_TRIMESTER: 3,
};

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const getGradeField = (term: string, examType: string): SubjectGradeField => {
  const examSuffix =
    examType === "SEMI_TRIMESTER" ? "SemiTrimesterGrade" : "TrimesterGrade";
  return `term${TERM_NUMBER[term]}${examSuffix}` as SubjectGradeField;
};

const GRADE_FIELDS: SubjectGradeField[] = [
  "term1SemiTrimesterGrade",
  "term1TrimesterGrade",
  "term2SemiTrimesterGrade",
  "term2TrimesterGrade",
  "term3SemiTrimesterGrade",
  "term3TrimesterGrade",
];

const createEmptyBreakdown = (
  subject: AbsentSubjectRow | PublishedGradeRow,
): SubjectGradeBreakdown => ({
  subjectId: subject.subjectId,
  subjectName: subject.subjectName,
  coefficient: subject.coefficient,
  subjectOverallAverage: null,
});

const computeSubjectAverage = (
  breakdown: SubjectGradeBreakdown,
): number | null => {
  const availableGrades = GRADE_FIELDS.map((field) => breakdown[field]).filter(
    (value): value is number => value !== undefined && value !== null,
  );
  if (availableGrades.length === 0) {
    return null;
  }
  const gradeSum = availableGrades.reduce((sum, value) => sum + value, 0);
  return roundToTwoDecimals(gradeSum / availableGrades.length);
};

const buildSubjectBreakdowns = (
  publishedGrades: PublishedGradeRow[],
  absentSubjects: AbsentSubjectRow[],
): SubjectGradeBreakdown[] => {
  const breakdownBySubject = new Map<string, SubjectGradeBreakdown>();

  absentSubjects.forEach((subject) => {
    breakdownBySubject.set(subject.subjectId, createEmptyBreakdown(subject));
  });

  publishedGrades.forEach((grade) => {
    const breakdown =
      breakdownBySubject.get(grade.subjectId) ?? createEmptyBreakdown(grade);
    breakdown[getGradeField(grade.term, grade.examType)] = roundToTwoDecimals(
      grade.value * grade.coefficient,
    );
    breakdownBySubject.set(grade.subjectId, breakdown);
  });

  return [...breakdownBySubject.values()].map((breakdown) => ({
    ...breakdown,
    subjectOverallAverage: computeSubjectAverage(breakdown),
  }));
};

const getAcademicYearBounds = (academicYear: string) => {
  const [startYear, endYear] = academicYear.split("-");
  return { startDate: `${startYear}-09-01`, endDate: `${endYear}-09-01` };
};

const getResultOrThrow = async (id: string): Promise<AnnualResult> => {
  const result = await resultRepository.findById(id);
  if (!result) {
    throw new AppError("Annual result not found", 404);
  }
  return result;
};

const assertCanReadResult = (
  requester: TokenPayload,
  result: AnnualResult,
): void => {
  assertCanAccessStudentData(requester, result.studentId);

  if (requester.role === "STUDENT" && result.status !== "PUBLISHED") {
    throw new AppError("This report card is not published yet", 403);
  }
};

export const resultService = {
  createResult: async (dto: CreateAnnualResultDto, secretaryId: string) => {
    const result = await resultRepository.upsertAnnualResult(dto, secretaryId);
    await resultRepository.recomputeClassRanks(
      dto.classGroup,
      dto.academicYear,
    );
    return resultRepository.findById(result.id);
  },

    refreshResultsFromPublishedGrades: async (
    studentIds: string[],
    classGroup: string,
    academicYear: string,
    secretaryId: string,
    adminId: string,
  ): Promise<void> => {
    const { startDate, endDate } = getAcademicYearBounds(academicYear);
    const uniqueStudentIds = [...new Set(studentIds)];

    await Promise.all(
      uniqueStudentIds.map(async (studentId) => {
        const [publishedGrades, absentSubjects] = await Promise.all([
          gradeRepository.findPublishedForStudent(
            studentId,
            classGroup,
            startDate,
            endDate,
          ),
          gradeRepository.findAbsentSubjectsForStudent(
            studentId,
            classGroup,
            academicYear,
          ),
        ]);
        const subjects = buildSubjectBreakdowns(publishedGrades, absentSubjects);
        const countedSubjects = subjects.filter(
          (subject) => subject.subjectOverallAverage !== null,
        );
        if (countedSubjects.length === 0) {
          return;
        }

        const totalCoefficients = countedSubjects.reduce(
          (sum, subject) => sum + subject.coefficient,
          0,
        );
        const weightedSum = countedSubjects.reduce(
          (sum, subject) => sum + (subject.subjectOverallAverage as number),
          0,
        );

        const input: AnnualResultInput = {
          studentId,
          classGroup: classGroup as AnnualResultInput["classGroup"],
          academicYear,
          status: "PUBLISHED",
          subjects: subjects as AnnualResultInput["subjects"],
          totalCoefficients,
          overallAverage: roundToTwoDecimals(weightedSum / totalCoefficients),
        };
        await resultRepository.upsertAnnualResult(input, secretaryId, adminId);
      }),
    );

    await resultRepository.recomputeClassRanks(classGroup, academicYear);
  },

  getResultById: async (id: string, requester: TokenPayload) => {
    const result = await getResultOrThrow(id);
    assertCanReadResult(requester, result);
    return result;
  },

  reviewResult: async (
    id: string,
    status: string | undefined,
    decision: string | undefined,
    adminId: string,
  ) => {
    await getResultOrThrow(id);
    return resultRepository.updateStatusAndDecision(
      id,
      status,
      decision,
      adminId,
    );
  },

  getStudentResults: async (studentId: string, requester: TokenPayload) => {
    assertCanAccessStudentData(requester, studentId);
    const results = await resultRepository.findByStudentId(studentId);

    return requester.role === "STUDENT"
      ? results.filter((result) => result.status === "PUBLISHED")
      : results;
  },

  generateAndExportPdf: async (resultId: string, requester: TokenPayload) => {
    const result = await getResultOrThrow(resultId);
    assertCanReadResult(requester, result);

    const student = await userRepository.findById(result.studentId);
    const studentName = student
      ? `${student.firstName} ${student.lastName}`
      : result.studentId;

    const pdfUrl = await pdfService.generateReportCardPdf(result, studentName);
    await resultRepository.updatePdfExportUrl(resultId, pdfUrl);

    return { pdfUrl };
  },
};
