import { api } from './client'
import { API_ENDPOINTS } from '@/types/api'
import type { LoginRequest, LoginResponse, UserResponse, UsernameCheckResponse, CreateUserRequest, CreateUserResponse, PaginatedUsersResponse } from '@/types/api'


export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, data)
    return response
  },

  logout: async (): Promise<void> => {
    await api.post(API_ENDPOINTS.LOGOUT)
  },
}


export const usernameApi = {
  checkUsername: async (username: string): Promise<UsernameCheckResponse> => {
    const response = await api.get<UsernameCheckResponse>(API_ENDPOINTS.CHECK_USERNAME(username))
    console.log("Username check response:", response);
    return response;
  },

  isUsernameAvailable: async (username: string): Promise<boolean> => {
    const response = await usernameApi.checkUsername(username)
    return !response.taken
  },
}


export const usersApi = {
  createUser: async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await api.post<CreateUserResponse>(API_ENDPOINTS.USERS, userData)
    return response
  },

  loginOrRegister: async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await api.post<CreateUserResponse>(API_ENDPOINTS.LOGIN_OR_REGISTER, userData)
    return response
  },

  getUsers: async (): Promise<UserResponse[]> => {
    const response = await api.get<UserResponse[]>(API_ENDPOINTS.USERS)
    return response
  },

  getUsersPaginated: async (page: number = 1, limit: number = 10): Promise<PaginatedUsersResponse> => {
    const response = await api.get<PaginatedUsersResponse>(`${API_ENDPOINTS.USERS}?page=${page}&limit=${limit}`)
    return response
  },

  updateUserStatus: async (userId: number, isOnline: boolean): Promise<UserResponse> => {
    const response = await api.patch<UserResponse>(
      API_ENDPOINTS.USER_STATUS(userId),
      { isOnline }
    )
    return response
  },
}