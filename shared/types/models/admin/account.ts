import type { AdminPermission } from "../../../constants/permission"
import type { DataResponse, MessageResponse, PaginationResponse } from "../../response"

/** Admin accounts and the roles they are assigned to. */
export type AdminAccountItem = {
  id: string
  name: string
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  role: { id: number; name: string; label: string | null }
}

export type AdminAccountStatusFilter = "active" | "inactive" | ""

export type PaginateAdminAccount = {
  query?: {
    search?: string
    page?: number
    size?: number
    roleId?: number | ""
    status?: AdminAccountStatusFilter
  }
  response: PaginationResponse<AdminAccountItem>
}

export type CreateAdminAccount = {
  body: {
    name: string
    email: string
    password: string
    roleId: number
    isActive: boolean
  }
  response: DataResponse<AdminAccountItem>
}

export type UpdateAdminAccount = {
  params: { id: string }
  /** `password` is optional on edit: blank means "leave the existing hash alone". */
  body: {
    name: string
    email: string
    password?: string
    roleId: number
    isActive: boolean
  }
  response: DataResponse<AdminAccountItem>
}

export type DeleteAdminAccount = {
  params: { id: string }
  response: MessageResponse
}

export type AdminRoleItem = {
  id: number
  /** Machine key. Never rendered raw — use `label` (or `roleLabel()`). */
  name: string
  label: string | null
  description: string | null
  /** Resolved: `super_admin` comes back holding the whole catalogue. */
  permissions: AdminPermission[]
  /** `super_admin` cannot be renamed, deleted, or have permissions taken away. */
  isSystem: boolean
  totalAdmin: number
  createdAt: string
}

export type ListAdminRole = {
  response: DataResponse<AdminRoleItem[]>
}

export type AdminRoleBody = {
  name: string
  label: string
  description?: string
  permissions: AdminPermission[]
}

export type CreateAdminRole = {
  body: AdminRoleBody
  response: DataResponse<AdminRoleItem>
}

export type UpdateAdminRole = {
  params: { id: string }
  body: AdminRoleBody
  response: DataResponse<AdminRoleItem>
}

export type DeleteAdminRole = {
  params: { id: string }
  response: MessageResponse
}
