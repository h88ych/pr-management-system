import { getCurrentUser, handle, parseId } from '@/lib/http'
import { approvePR } from '@/lib/pr/service'

export const dynamic = 'force-dynamic'

export const POST = (req: Request, { params }: { params: { id: string } }) =>
  handle(async () => approvePR(await getCurrentUser(req), parseId(params.id)))
