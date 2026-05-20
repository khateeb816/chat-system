const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL environment variable is missing.');
}

const sql = neon(databaseUrl || '');

// Helper to map Firestore camelCase collection names to Postgres snake_case table names
function getTableName(collectionName) {
  const mapping = {
    'appProgress': 'app_progress',
    'activityLogs': 'activity_logs',
    'apiRequestLogs': 'api_request_logs'
  };
  return mapping[collectionName] || collectionName;
}

function getStaticColumns(tableName) {
  const schema = {
    users: ['id', 'email', 'password', 'role', 'createdAt'],
    apps: ['id', 'name', 'description', 'ownerId', 'apiKey', 'status', 'createdAt'],
    questions: ['id', 'appId', 'text', 'sortOrder', 'answers', 'createdAt'],
    app_progress: ['id', 'appId', 'currentQuestionIndex', 'currentAnswerIndex', 'currentMode', 'totalApiCalls', 'lastAccessedAt', 'usedQuestions', 'currentServingAgentId', 'lastServedAt', 'servingHistory'],
    agents: ['agentId', 'userId', 'createdAt', 'lastSeenAt', 'totalRequests', 'status', 'metadata'],
    api_request_logs: ['id', 'appId', 'agentId', 'requestType', 'returnedType', 'returnedQuestionIndex', 'returnedAnswerIndex', 'timestamp', 'ip', 'userAgent'],
    activity_logs: ['id', 'userId', 'appId', 'action', 'createdAt']
  };
  return new Set(schema[tableName] || []);
}

const tableColumnsCache = {};

async function getTableColumns(tableName) {
  if (tableColumnsCache[tableName]) {
    return tableColumnsCache[tableName];
  }
  try {
    const rows = await sql.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );
    if (rows && rows.length > 0) {
      const columns = new Set(rows.map(r => r.column_name));
      tableColumnsCache[tableName] = columns;
      return columns;
    }
  } catch (error) {
    console.error(`Error fetching columns for table ${tableName}:`, error);
  }
  return getStaticColumns(tableName);
}

// Helper to deserialize JSON fields in Postgres rows
function sanitizeRow(collectionName, row) {
  if (!row) return null;
  const result = { ...row };
  
  // Ensure that all JSON/JSONB columns are returned as objects
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
    this.tableName = getTableName(collectionName);
    this.id = id;
    this.idCol = collectionName === 'agents' ? 'agentId' : 'id';
  }

  async get() {
    const query = `SELECT * FROM "${this.tableName}" WHERE "${this.idCol}" = $1 LIMIT 1`;
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

    const columns = await getTableColumns(this.tableName);

    const keys = Object.keys(rowData);
    const insertColumns = [];
    const placeholders = [];
    const values = [];

    keys.forEach((col) => {
      if (columns && !columns.has(col)) {
        return;
      }
      let val = rowData[col];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      values.push(val);
      insertColumns.push(col);
      placeholders.push(`$${values.length}`);
    });

    if (insertColumns.length === 0) return;

    const updateClauses = insertColumns
      .filter(col => col !== this.idCol)
      .map(col => `"${col}" = EXCLUDED."${col}"`);

    let query = `INSERT INTO "${this.tableName}" (${insertColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
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

    const columns = await getTableColumns(this.tableName);

    const setClauses = [];
    const values = [];

    Object.keys(fields).forEach((key) => {
      if (columns && !columns.has(key)) {
        return;
      }
      if (key === this.idCol) {
        return;
      }
      let val = fields[key];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      values.push(val);
      setClauses.push(`"${key}" = $${values.length}`);
    });

    if (setClauses.length === 0) return;

    values.push(this.id);
    const query = `UPDATE "${this.tableName}" SET ${setClauses.join(', ')} WHERE "${this.idCol}" = $${values.length}`;

    try {
      await sql.query(query, values);
    } catch (error) {
      console.error(`Error in doc(${this.id}).update on "${this.collectionName}":`, error);
      throw error;
    }
  }

  async delete() {
    const query = `DELETE FROM "${this.tableName}" WHERE "${this.idCol}" = $1`;
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
    this.tableName = getTableName(collectionName);
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
    let query = `SELECT * FROM "${this.tableName}"`;
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
    const isSerial = this.collectionName === 'activityLogs' || this.collectionName === 'apiRequestLogs';
    let idVal = '';
    let rowData = { ...data };

    // Only generate a client-side UUID if the PostgreSQL target table does not use an auto-incrementing SERIAL primary key
    if (!isSerial) {
      idVal = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      rowData = { [this.idCol]: idVal, ...rowData };
    }

    const columns = await getTableColumns(this.tableName);

    const keys = Object.keys(rowData);
    const insertColumns = [];
    const placeholders = [];
    const values = [];

    keys.forEach((col) => {
      if (columns && !columns.has(col)) {
        return;
      }
      let val = rowData[col];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      values.push(val);
      insertColumns.push(col);
      placeholders.push(`$${values.length}`);
    });

    if (insertColumns.length === 0) {
      return {
        id: idVal,
        ref: new DocumentReference(this.collectionName, idVal)
      };
    }

    let query = `INSERT INTO "${this.tableName}" (${insertColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
    if (isSerial) {
      query += ` RETURNING "${this.idCol}"`;
    }

    try {
      const rows = await sql.query(query, values);
      const finalId = isSerial ? rows[0][this.idCol].toString() : idVal;
      return {
        id: finalId,
        ref: new DocumentReference(this.collectionName, finalId)
      };
    } catch (error) {
      console.error(`Error in collection("${this.collectionName}").add():`, error);
      throw error;
    }
  }

  doc(id) {
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    }
    return new DocumentReference(this.collectionName, id);
  }
}

class Batch {
  constructor() {
    this.operations = [];
  }

  set(docRef, data) {
    this.operations.push({ type: 'set', docRef, data });
    return this;
  }

  update(docRef, data) {
    this.operations.push({ type: 'update', docRef, data });
    return this;
  }

  delete(docRef) {
    this.operations.push({ type: 'delete', docRef });
    return this;
  }

  async commit() {
    for (const op of this.operations) {
      if (op.type === 'set') {
        await op.docRef.set(op.data);
      } else if (op.type === 'update') {
        await op.docRef.update(op.data);
      } else if (op.type === 'delete') {
        await op.docRef.delete();
      }
    }
  }
}

const db = {
  collection: (name) => new QueryBuilder(name),
  batch: () => new Batch()
};

module.exports = { db };
