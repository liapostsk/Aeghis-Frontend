
import { UserDto } from "../types";
import { User } from "../../lib/storage/useUserStorage";

// Mapper function to convert User context type to UserDto
export const mapUserToDto = (user: User): UserDto => {
    return {
      id: user.id ?? 0,
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      image: user.image ?? "",
      verify: user.verify ?? false,
      acceptedPrivacyPolicy: user.acceptedPrivacyPolicy ?? false,
      dateOfBirth: user.dateOfBirth ?? new Date(),
      safeLocations: user.safeLocations ?? [],
      emergencyContacts: user.emergencyContacts ?? []
    };
}