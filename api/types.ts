export type UserDto = {
    id: number;
    name: string;
    email: string;
    phone: string;
    image: string;
    verify: boolean;
    dateOfBirth: Date;
  };
  
export type ApiError = {
code: string;
message: string;
};
  