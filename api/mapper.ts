import { User } from "../context/UserContext";
import { UserDto } from "./userApi";

// Mapper function to convert User context type to UserDto
export const mapUserToDto = (user: User): UserDto => {
    return {
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      image: user.image ?? "",
      verify: user.verify ?? false,
      dateOfBirth: user.dateOfBirth ?? new Date(),
    };
}