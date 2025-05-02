// api/userApi.ts
import { User } from "../context/UserContext";

export type UserDto = {
    id: number;
    name: string;
    email: string;
    phone: string;
    image: string;
    verify: boolean;
    dateOfBirth: Date;
};

type ApiError = {
  code: string;
  message: string;
};

export const getUser = async (id: number): Promise<UserDto> => {
  const response = await fetch(`http://localhost:8080/user/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = responseText ? JSON.parse(responseText) : null;
    } catch (_) {
      // El cuerpo no era JSON válido
    }

    const errorMessage =
      errorData?.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return JSON.parse(responseText) as UserDto;
};


export const createUser = async (userDto: UserDto): Promise<number> => {
  const response = await fetch("http://localhost:8080/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userDto),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = responseText ? JSON.parse(responseText) : null;
    } catch (_) {}
    const errorMessage =
      errorData?.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  // Parseamos el ID que viene como número
  const id = Number(responseText);
  if (isNaN(id)) {
    throw new Error("Invalid ID returned from backend");
  }

  return id;
};

export const deleteUser = async (id: number): Promise<void> => {
  const response = await fetch(`http://localhost:8080/user/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorData: ApiError | null = null;

    try {
      errorData = responseText ? JSON.parse(responseText) : null;
    } catch (_) {
      // no-op
    }

    const errorMessage =
      errorData?.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
};

