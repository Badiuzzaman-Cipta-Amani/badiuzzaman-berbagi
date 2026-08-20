import type { DataResponse, MessageResponse, PaginationResponse } from "../../response"
import type { AdminDonationItem } from "./donation"

export type AdminUserItem = {
  id: string
  name: string
  email: string
  phone: string | null
  totalDonation: number
  /** Sum of this donor's **verified** donations only. */
  totalDonated: number
  createdAt: string
}

export type AdminUserDetail = AdminUserItem & {
  donations: AdminDonationItem[]
}

export type PaginateAdminUser = {
  query?: {
    search?: string
    page?: number
    size?: number
    sort?: "latest" | "oldest" | "name" | "highest_donation"
  }
  response: PaginationResponse<AdminUserItem>
}

export type DetailAdminUser = {
  params: { id: string }
  response: DataResponse<AdminUserDetail>
}

export type CreateAdminUser = {
  body: { name: string; email: string; phone?: string; password: string }
  response: DataResponse<AdminUserItem>
}

export type UpdateAdminUser = {
  params: { id: string }
  /** Blank `password` keeps the stored hash. */
  body: { name: string; email: string; phone?: string; password?: string }
  response: DataResponse<AdminUserItem>
}

export type DeleteAdminUser = {
  params: { id: string }
  response: MessageResponse
}
