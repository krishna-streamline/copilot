import { NextRequest, NextResponse } from 'next/server'
import { runQuery } from '@/lib/snowflake'
import { z } from 'zod'

const CollectionIdSchema = z.object({
  collection_id: z.string().min(1),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { collection_id: string } }
) {
  try {
   const collection_id = params?.collection_id
    if (!collection_id) {
      return NextResponse.json({ error: 'Missing collection_id in route params' }, { status: 400 })
    }

    

    // 2. Fetch the collection record
    const [collection] = await runQuery<any>(
      `
      SELECT * 
      FROM RAW_SOURCE_DATA.COPILOT_COLLECTIONS
      WHERE ID = ?
    `,
      [collection_id]
    )

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // 3. Parse the MESSAGE_CONTENT JSON
    let queries = ''
    let relatedQueries: any[] = []

    try {
      const content = JSON.parse(collection.MESSAGE_CONTENT || '{}')
      queries = content.queries
      relatedQueries = JSON.parse(content.related_queries || '[]')
    } catch (e) {
      return NextResponse.json({ error: 'Invalid message content JSON' }, { status: 500 })
    }

    // 4. Execute the main `queries` SQL
    let mainQueryResult: any[] = []
    try {
      if (queries) {
        mainQueryResult = await runQuery<any>(queries)
      }
    } catch (e) {
      console.error('Error executing main query:', e)
      mainQueryResult = [{ error: 'Query execution failed' }]
    }

    // 5. Execute each related query and attach its result
    const enrichedRelatedQueries = await Promise.all(
      relatedQueries.map(async (item) => {
        try {
          const result = await runQuery<any>(item.query)
          return {
            ...item,
            result,
          }
        } catch (err) {
          return {
            ...item,
            error: 'Failed to execute query',
          }
        }
      })
    )

    return NextResponse.json({
      id: collection.ID,
      user_id: collection.USER_ID,
      title: collection.TITLE,
      description: collection.DESCRIPTION,
      created_at: collection.CREATED_AT,
      updated_at: collection.UPDATED_AT,
      chat_id: collection.CHAT_ID,
      message_id: collection.MESSAGE_ID,
      main_query: {
        query: queries,
        result: mainQueryResult,
      },
      related_queries: enrichedRelatedQueries,
      preferences: collection.PREFERENCES,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
