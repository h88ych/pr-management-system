import { getCurrentUser, handle, parseId, readJson } from '@/lib/http'
import { deletePR, getPR, updatePR } from '@/lib/pr/service'

export const dynamic = 'force-dynamic'
type Ctx = { params: { id: string } }

export const GET = (req: Request, { params }: Ctx) =>
  handle(async () => {
    await getCurrentUser(req)
    return getPR(parseId(params.id))
  })

export const PUT = (req: Request, { params }: Ctx) =>
  handle(async () =>
    updatePR(await getCurrentUser(req), parseId(params.id), await readJson(req))
  )

export const DELETE = (req: Request, { params }: Ctx) =>
  handle(async () => deletePR(await getCurrentUser(req), parseId(params.id)))
