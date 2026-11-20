const SCHOOL_YEAR_FIRST_MONTH_INDEX = 8; // September (0-based)

/**
 * Returns the academic year ("YYYY-YYYY") a date belongs to.
 * A school year starts in September.
 */
export const getAcademicYear = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const startYear =
    date.getMonth() >= SCHOOL_YEAR_FIRST_MONTH_INDEX ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};
