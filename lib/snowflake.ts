import snowflake from 'snowflake-sdk';

function createConnection() {
    return snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USER,
      password: process.env.SNOWFLAKE_PASSWORD,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      role: process.env.SNOWFLAKE_ROLE,
      authenticator: 'snowflake'  // ✅ explicitly use username/password
    });
  }

export async function runQuery<T = any>(sql: string, binds: any[] = []): Promise<T[]> {
  const connection = createConnection();

  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('❌ Snowflake connection error:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  return new Promise<T[]>((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      binds,
      complete: (err, _stmt, rows) => {
        connection.destroy(); // Always clean up
        if (err) {
          console.error('❌ Query error:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      },
    });
  });
}
