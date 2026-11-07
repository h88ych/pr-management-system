import { handle } from "@/lib/http"
import { prisma } from "@/lib/prisma"


export const dynamic = 'force-dynamic'
export const GET = () => handle(() => prisma.user.findMany())
