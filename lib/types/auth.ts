/** Matches backend CreateUserDTO */
export interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Matches backend LogUserDTO */
export interface LogUserDTO {
  email: string;
  password: string;
}
