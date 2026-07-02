const db = require('./connection');

/**
 * Execute a callback within a database transaction
 * @param {Function} callback - Async function that receives a client
 * @returns {Promise} Result of the callback
 */
async function withTransaction(callback) {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Batch insert multiple rows
 * @param {string} table - Table name
 * @param {Array} columns - Column names
 * @param {Array} values - Array of value arrays
 * @returns {Promise<Array>} Inserted rows
 */
async function batchInsert(table, columns, values) {
  if (values.length === 0) return [];

  const placeholders = values.map((_, i) => {
    const start = i * columns.length;
    const params = columns.map((_, j) => `$${start + j + 1}`).join(', ');
    return `(${params})`;
  }).join(', ');

  const flatValues = values.flat();
  const columnNames = columns.join(', ');

  const query = `
    INSERT INTO ${table} (${columnNames})
    VALUES ${placeholders}
    RETURNING *
  `;

  const result = await db.query(query, flatValues);
  return result.rows;
}

/**
 * Batch update multiple rows
 * @param {string} table - Table name
 * @param {Array} updates - Array of {id, data} objects
 * @param {string} idColumn - ID column name (default: 'id')
 * @returns {Promise<number>} Number of rows updated
 */
async function batchUpdate(table, updates, idColumn = 'id') {
  if (updates.length === 0) return 0;

  return withTransaction(async (client) => {
    let count = 0;
    for (const update of updates) {
      const keys = Object.keys(update.data);
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = keys.map(key => update.data[key]);
      values.push(update.id);

      const query = `
        UPDATE ${table}
        SET ${setClause}
        WHERE ${idColumn} = $${values.length}
      `;

      const result = await client.query(query, values);
      count += result.rowCount;
    }
    return count;
  });
}

/**
 * Execute multiple queries in a transaction
 * @param {Array} queries - Array of {text, params} objects
 * @returns {Promise<Array>} Array of results
 */
async function batchQuery(queries) {
  return withTransaction(async (client) => {
    const results = [];
    for (const query of queries) {
      const result = await client.query(query.text, query.params);
      results.push(result.rows);
    }
    return results;
  });
}

module.exports = {
  withTransaction,
  batchInsert,
  batchUpdate,
  batchQuery,
};
