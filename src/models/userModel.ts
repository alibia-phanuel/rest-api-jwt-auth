import Datastore from "nedb-promises";

export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role?: "admin" | "moderator" | "user"; // ⚡ roles possibles
}

const users = (Datastore as any).create({
  filename: "users.db",
  autoload: true,
});

export const insertUser = async (user: User): Promise<User> => {
  return await users.insert(user);
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return await users.findOne({ email });
};

export const findUserById = async (id: string): Promise<User | null> => {
  return await users.findOne({ _id: id });
};

export const findUserRoleById = async (id: string): Promise<string | null> => {
  const user = await findUserById(id);
  return user?.role || null;
};

export { users };
