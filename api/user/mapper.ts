import { User } from "../../context/UserContext";
import { UserDto } from "../types";

// Mapper function to convert User context type to UserDto
export const mapUserToDto = (user: User): UserDto => {
    return {
      id: user.id ?? 0,
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      image: user.image ?? "",
      verify: user.verify ?? false,
      dateOfBirth: user.dateOfBirth ?? new Date(),
    };
}