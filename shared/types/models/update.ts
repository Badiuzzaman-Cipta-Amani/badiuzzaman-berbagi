import type { Attachment } from "../common"
import type { DataResponse } from "../response"

export type UpdateItem = {
  id: string
  title: string
  description: string
  createdAt: string
  campaign: {
    slug: string
    title: string
    progress: number
    cover: Attachment | null
  } | null
}

export type ListUpdate = {
  query?: { size?: number }
  response: DataResponse<UpdateItem[]>
}

export type ListCampaignUpdate = {
  params: { slug: string }
  response: DataResponse<UpdateItem[]>
}
