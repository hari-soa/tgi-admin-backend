export interface UpdateStatement {
  setClause: string;
  values: unknown[];
}

/**
 * Builds the "column = $n" list of an UPDATE query from the fields that are
 * actually present in `data`. Returns null when there is nothing to update.
 * The id used in the WHERE clause must be bound as `$${values.length + 1}`.
 */
export const buildUpdateStatement = (
  columnMapping: Record<string, string>,
  data: Record<string, unknown>,
): UpdateStatement | null => {
  const presentEntries = Object.entries(columnMapping).filter(
    ([propertyName]) => data[propertyName] !== undefined,
  );

  if (presentEntries.length === 0) {
    return null;
  }

  const setClause = presentEntries
    .map(([, column], index) => `${column} = $${index + 1}`)
    .join(", ");
  const values = presentEntries.map(([propertyName]) => data[propertyName]);

  return { setClause, values };
};
