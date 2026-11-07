import { getCurrentUser, handle, parseId } from '@/lib/http'
import { submitPR } from '@/lib/pr/service'

export const dynamic = 'force-dynamic'

export const POST = (req: Request, { params }: { params: { id: string } }) =>
  handle(async () => submitPR(await getCurrentUser(req), parseId(params.id)))
