import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { sessionClaims, userId } = await auth()

    return Response.json(
      {
        userId,
        sessionClaims,
        keys: sessionClaims ? Object.keys(sessionClaims) : [],
      },
      { status: 200 }
    )
  } catch (error) {
    return Response.json(
      { error: 'Failed to get claims', details: String(error) },
      { status: 500 }
    )
  }
}
