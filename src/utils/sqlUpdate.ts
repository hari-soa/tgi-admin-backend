export interface UpdateStatement {
  setClause: string;
  values: unknown[];
}

export const buildUpdateStatement = (
  columnMapping: Record<string, string>,
  data: object,
): UpdateStatement | null => {
  const values = data as Record<string, unknown>;
  const presentEntries = Object.entries(columnMapping).filter(
    ([propertyName]) => values[propertyName] !== undefined,
  );

  if (presentEntries.length === 0) {
    return null;
  }

  const setClause = presentEntries
    .map(([, column], index) => `${column} = $${index + 1}`)
    .join(", ");
  const selectedValues = presentEntries.map(([propertyName]) => values[propertyName]);

  return { setClause, values: selectedValues };
};
