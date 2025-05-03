import { connectSnowflake, runQuery, disconnectSnowflake } from '@/lib/snowflake';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    await connectSnowflake();

    const query = `
      SELECT USER_INFO
      FROM COPILOT_AUTHENTICATION_TOKENS
      WHERE TOKEN = ?
      AND EXPIRES > CURRENT_TIMESTAMP()
      LIMIT 1
    `;

    const result = await runQuery<{ USER_INFO: any }>(query, [token]);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 });
    }

    return NextResponse.json({ user_info: result[0].USER_INFO });
  } catch (err) {
    console.error('Snowflake Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    disconnectSnowflake();
  }
}
