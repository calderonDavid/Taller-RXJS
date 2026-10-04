export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  image: string; // Útil para mostrar la foto en los "Datos de usuario"
}

export interface UserResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}