import { getCurrentUser, handle, readJson } from '@/lib/http'
import { createPR, listPRs } from '@/lib/pr/service'

export const dynamic = 'force-dynamic'

export const GET = (req: Request) =>
  handle(async () => {
    await getCurrentUser(req)
    return listPRs(new URL(req.url).searchParams.get('status'))
  })

export const POST = (req: Request) =>
  handle(
    async () => createPR(await getCurrentUser(req), await readJson(req)),
    201
  )
