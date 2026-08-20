import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import {
  adminLoginSchema,
  adminPasswordSchema,
  adminProfileSchema,
} from "~~/shared/validation/admin"

import { generateKey } from "~/utils/api"

const resource = "admin/auth"

export const getAdminSessionService = () => {
  const key = computed(() => generateKey("GET", resource, "session"))

  const run = (options?: QueryOptions<SessionAdmin["response"]>) =>
    useQuery<SessionAdmin["response"]>("/admin/auth/session", { key, ...options })

  return { key, run }
}

export const postAdminLogin = (config?: { body?: Partial<LoginAdmin["body"]> }) => {
  const body = ref<LoginAdmin["body"]>({
    email: config?.body?.email ?? "",
    password: config?.body?.password ?? "",
  })

  const run = (
    options?: MutationRunOptions<LoginAdmin["response"], LoginAdmin["body"]>,
  ) =>
    useMutation<LoginAdmin["response"], LoginAdmin["body"]>("/admin/auth/login", {
      method: "POST",
      body,
      ...options,
    })

  return { body, validation: adminLoginSchema, run }
}

export const postAdminLogout = () => {
  const run = (options?: MutationRunOptions<LogoutAdmin["response"], undefined>) =>
    useMutation<LogoutAdmin["response"], undefined>("/admin/auth/logout", {
      method: "POST",
      ...options,
    })

  return { run }
}

/* The signed-in admin's own account ---------------------------------------- */

export const putAdminProfile = () => {
  const body = ref<UpdateAdminProfile["body"]>({ name: "", email: "" })

  const run = (
    options?: MutationRunOptions<
      UpdateAdminProfile["response"],
      UpdateAdminProfile["body"]
    >,
  ) =>
    useMutation<UpdateAdminProfile["response"], UpdateAdminProfile["body"]>(
      "/admin/profile",
      { method: "PUT", body, ...options },
    )

  return { body, validation: adminProfileSchema, run }
}

export const putAdminPassword = () => {
  const body = ref<UpdateAdminPassword["body"]>({
    currentPassword: "",
    password: "",
    passwordConfirmation: "",
  })

  const run = (
    options?: MutationRunOptions<
      UpdateAdminPassword["response"],
      UpdateAdminPassword["body"]
    >,
  ) =>
    useMutation<UpdateAdminPassword["response"], UpdateAdminPassword["body"]>(
      "/admin/profile/password",
      { method: "PUT", body, ...options },
    )

  return { body, validation: adminPasswordSchema, run }
}
