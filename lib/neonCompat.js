const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL environment variable is missing.');
}

const sql = neon(databaseUrl || '');

// Helper to deserialize JSON fields in Postgres rows
function sanitizeRow(collectionName, row) {
  if (!row) return null;
  const result = { ...row };
  
  // Ensure that all JSON/JSONB columns are returned as objects
  // (Neon driver automatically parses them, but in case they are stringified, we handle it)
  const jsonFields = ['answers', 'usedQuestions', 'servingHistory', 'metadata'];
  for (const field of jsonFields) {
    if (result[field] !== undefined) {
      if (typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field]);
        } catch (e) {
          // Keep as string
        }
      }
    }
  }

  // Map primary key column (id or agentId) to _id for Firestore compatibility
  result._id = row.id || row.agentId;
  return result;
}

class DocumentReference {
  constructor(collectionName, id) {
    this.collectionName = collectionName;
    this.id = id;
    this.idCol = collectionName === 'agents' ? 'agentId' : 'id';
  }

  async get() {
    const query = `SELECT * FROM "${this.collectionName}" WHERE "${this.idCol}" = $1 LIMIT 1`;
    try {
      const rows = await sql.query(query, [this.id]);
      if (rows.length === 0) {
        return { exists: false, id: this.id, data: () => null };
      }
      const data = sanitizeRow(this.collectionName, rows[0]);
      return {
        exists: true,
        id: this.id,
        ref: this,
        data: () => data
      };
    } catch (error) {
      console.error(`Error in doc(${this.id}).get on "${this.collectionName}":`, error);
      throw error;
    }
  }

  async set(data) {
    const rowData = { ...data };
    
    // Ensure ID is present
    if (!rowData[this.idCol]) {
      rowData[this.idCol] = this.id;
    }

    const columns = Object.keys(rowData);
    const placeholders = [];
    const values = [];

    columns.forEach((col, idx) => {
      let val = rowData[col];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      values.push(val);
      placeholders.push(`$${values.length}`);
    });

    const updateClauses = columns
      .filter(col => col !== this.idCol)
      .map(col => `"${col}" = EXCLUDED."${col}"`);

    let query = `INSERT INTO "${this.collectionName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
    if (updateClauses.length > 0) {
      query += ` ON CONFLICT ("${this.idCol}") DO UPDATE SET ${updateClauses.join(', ')}`;
    } else {
      query += ` ON CONFLICT ("${this.idCol}") DO NOTHING`;
    }

    try {
      await sql.query(query, values);
    } catch (error) {
      console.error(`Error in doc(${this.id}).set on "${this.collectionName}":`, error);
      throw error;
    }
  }

  async update(fields) {
    if (Object.keys(fields).length === 0) return;

    const setClauses = [];
    const values = [];

    Object.keys(fields).forEach((key) => {
      let val = fields[key];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      values.push(val);
      setClauses.push(`"${key}" = $${values.length}`);
    });

    values.push(this.id);
    const query = `UPDATE "${this.collectionName}" SET ${setClauses.join(', ')} WHERE "${this.idCol}" = $${values.length}`;

    try {
      await sql.query(query, values);
    } catch (error) {
      console.error(`Error in doc(${this.id}).update on "${this.collectionName}":`, error);
      throw error;
    }
  }

  async delete() {
    const query = `DELETE FROM "${this.collectionName}" WHERE "${this.idCol}" = $1`;
    try {
      await sql.query(query, [this.id]);
    } catch (error) {
      console.error(`Error in doc(${this.id}).delete on "${this.collectionName}":`, error);
      throw error;
    }
  }
}

class QueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.conditions = [];
    this.orderByField = null;
    this.orderByDirection = 'ASC';
    this.limitVal = null;
    this.idCol = collectionName === 'agents' ? 'agentId' : 'id';
  }

  where(field, op, value) {
    this.conditions.push({ field, op, value });
    return this;
  }

  orderBy(field, direction = 'asc') {
    this.orderByField = field;
    this.orderByDirection = direction.toUpperCase();
    return this;
  }

  limit(val) {
    this.limitVal = val;
    return this;
  }

  async get() {
    let query = `SELECT * FROM "${this.collectionName}"`;
    const params = [];
    
    if (this.conditions.length > 0) {
      const conds = [];
      for (const cond of this.conditions) {
        if (cond.op === 'in') {
          if (!Array.isArray(cond.value) || cond.value.length === 0) {
            conds.push('1 = 0');
          } else {
            const placeholders = cond.value.map((val) => {
              params.push(val);
              return `$${params.length}`;
            }).join(', ');
            conds.push(`"${cond.field}" IN (${placeholders})`);
          }
        } else {
          const operator = cond.op === '==' ? '=' : cond.op;
          params.push(cond.value);
          conds.push(`"${cond.field}" ${operator} $${params.length}`);
        }
      }
      query += ` WHERE ${conds.join(' AND ')}`;
    }

    if (this.orderByField) {
      query += ` ORDER BY "${this.orderByField}" ${this.orderByDirection}`;
    }

    if (this.limitVal !== null) {
      query += ` LIMIT ${this.limitVal}`;
    }

    try {
      const rows = await sql.query(query, params);
      const docs = rows.map(row => {
        const data = sanitizeRow(this.collectionName, row);
        const docId = row.id || row.agentId;
        return {
          id: docId,
          ref: new DocumentReference(this.collectionName, docId),
          data: () => data
        };
      });

      return {
        empty: docs.length === 0,
        docs,
        size: docs.length,
        forEach: (callback) => docs.forEach(callback)
      };
    } catch (error) {
      console.error(`Error in collection("${this.collectionName}").get():`, error);
      throw error;
    }
  }

  async add(data) {
    const idVal = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const rowData = { [this.idCol]: idVal, ...data };
    const columns = Object.keys(rowData);
    const placeholders = [];
    const values = [];

    columns.forEach((col) => {
      let val = rowData[col];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      values.push(val);
      placeholders.push(`$${values.length}`);
    });

    const query = `INSERT INTO "${this.collectionName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
    try {
      await sql.query(query, values);
      return {
        id: idVal,
        ref: new DocumentReference(this.collectionName, idVal)
      };
    } catch (error) {
      console.error(`Error in collection("${this.collectionName}").add():`, error);
      throw error;
    }
  }

  doc(id) {
    return new DocumentReference(this.collectionName, id);
  }
}

const db = {
  collection: (name) => new QueryBuilder(name)
};

module.exports = { db };
