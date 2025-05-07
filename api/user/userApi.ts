import api from "../client";
import { UserDto } from "../types";

export const getCurrentUser = async (): Promise<UserDto> => {
  const response = await api.get("/user/me");
  return response.data;
};

export const createUser = async (dto: UserDto): Promise<number> => {
  const response = await api.post("/user", dto);
  return response.data;
};

export const getUser = async (id: number): Promise<UserDto> => {
  const response = await api.get(`/user/${id}`);
  return response.data;
};

export const updateUser = async (id: number, dto: UserDto): Promise<void> => {
  await api.put(`/user/${id}`, dto);
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/user/${id}`);
};

