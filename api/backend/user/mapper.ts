
import { UserDto } from "../../backend/types";
import { User, ValidationStatus } from "@/lib/storage/useUserStorage";

// Mapper function to convert User context type to UserDto
export const mapUserToDto = (user: User): UserDto => {
    return {
      id: user.id ?? 0,
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      image: user.image ?? "",
      role: user.role ?? "USER",
      verify: user.verify ?? ValidationStatus.NO_REQUEST,
      acceptedPrivacyPolicy: user.acceptedPrivacyPolicy ?? false,
      dateOfBirth: user.dateOfBirth ?? new Date(),
      safeLocations: user.safeLocations ?? [],
      externalContacts: user.externalContacts ?? [],
      emergencyContacts: user.emergencyContacts ?? []
    };
}