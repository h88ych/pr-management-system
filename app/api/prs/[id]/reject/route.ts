import { getCurrentUser, handle, parseId, readJson } from '@/lib/http'
import { rejectPR } from '@/lib/pr/service'

export const dynamic = 'force-dynamic'

export const POST = (req: Request, { params }: { params: { id: string } }) =>
  handle(async () => {
    const user = await getCurrentUser(req)
    const { reason } = await readJson(req)
    return rejectPR(user, parseId(params.id), reason)
  })
