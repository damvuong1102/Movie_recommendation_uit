const pool = require("../config/db");

const tableCache = new Map();

async function getColumns(tableName) {
  if (tableCache.has(tableName)) {
    return tableCache.get(tableName);
  }

  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
    `,
    [tableName]
  );

  const columns = new Set(result.rows.map((row) => row.column_name));
  tableCache.set(tableName, columns);
  return columns;
}

async function hasColumn(tableName, columnName) {
  const columns = await getColumns(tableName);
  return columns.has(columnName);
}

async function firstExistingColumn(tableName, candidates) {
  const columns = await getColumns(tableName);
  return candidates.find((column) => columns.has(column)) || null;
}

function columnRef(alias, columnName) {
  return `${alias}.${columnName}`;
}

module.exports = {
  getColumns,
  hasColumn,
  firstExistingColumn,
  columnRef,
};
