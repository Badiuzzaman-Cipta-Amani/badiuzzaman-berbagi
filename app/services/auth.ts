import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  userPasswordSchema,
  userProfileSchema,
} from "~~/shared/validation/auth"

import { generateKey } from "~/utils/api"

const resource = "auth"

export const getUserSessionService = () => {
  const key = computed(() => generateKey("GET", resource, "session"))

  const run = (options?: QueryOptions<SessionUser["response"]>) =>
    useQuery<SessionUser["response"]>("/auth/session", { key, ...options })

  return { key, run }
}

export const postUserLogin = () => {
  const body = ref<LoginUser["body"]>({ email: "", password: "" })

  const run = (options?: MutationRunOptions<LoginUser["response"], LoginUser["body"]>) =>
    useMutation<LoginUser["response"], LoginUser["body"]>("/auth/login", {
      method: "POST",
      body,
      ...options,
    })

  return { body, validation: loginSchema, run }
}

export const postUserRegister = () => {
  const body = ref<RegisterUser["body"]>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const run = (
    options?: MutationRunOptions<RegisterUser["response"], RegisterUser["body"]>,
  ) =>
    useMutation<RegisterUser["response"], RegisterUser["body"]>("/auth/register", {
      method: "POST",
      body,
      ...options,
    })

  return { body, validation: registerSchema, run }
}

export const postUserLogout = () => {
  const run = (options?: MutationRunOptions<LogoutUser["response"], undefined>) =>
    useMutation<LogoutUser["response"], undefined>("/auth/logout", {
      method: "POST",
      ...options,
    })

  return { run }
}

export const postForgotPassword = () => {
  const body = ref<ForgotPasswordUser["body"]>({ email: "" })

  const run = (
    options?: MutationRunOptions<
      ForgotPasswordUser["response"],
      ForgotPasswordUser["body"]
    >,
  ) =>
    useMutation<ForgotPasswordUser["response"], ForgotPasswordUser["body"]>(
      "/auth/forgot-password",
      { method: "POST", body, ...options },
    )

  return { body, validation: forgotPasswordSchema, run }
}

export const postResetPassword = () => {
  const body = ref<ResetPasswordUser["body"]>({
    token: "",
    password: "",
    confirmPassword: "",
  })

  const run = (
    options?: MutationRunOptions<
      ResetPasswordUser["response"],
      ResetPasswordUser["body"]
    >,
  ) =>
    useMutation<ResetPasswordUser["response"], ResetPasswordUser["body"]>(
      "/auth/reset-password",
      { method: "POST", body, ...options },
    )

  return { body, validation: resetPasswordSchema, run }
}

/* The signed-in donor's own account ---------------------------------------- */

export const putUserProfile = () => {
  const body = ref<UpdateUserProfile["body"]>({ name: "", email: "", phone: "" })

  const run = (
    options?: MutationRunOptions<
      UpdateUserProfile["response"],
      UpdateUserProfile["body"]
    >,
  ) =>
    useMutation<UpdateUserProfile["response"], UpdateUserProfile["body"]>("/me/profile", {
      method: "PUT",
      body,
      ...options,
    })

  return { body, validation: userProfileSchema, run }
}

export const putUserPassword = () => {
  const body = ref<UpdateUserPassword["body"]>({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  })

  const run = (
    options?: MutationRunOptions<
      UpdateUserPassword["response"],
      UpdateUserPassword["body"]
    >,
  ) =>
    useMutation<UpdateUserPassword["response"], UpdateUserPassword["body"]>(
      "/me/password",
      { method: "PUT", body, ...options },
    )

  return { body, validation: userPasswordSchema, run }
}
