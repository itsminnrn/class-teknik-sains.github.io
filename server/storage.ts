import { type User } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(uid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  updateUser(uid: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(uid: string): Promise<User | undefined> {
    return this.users.get(uid);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(user: User): Promise<User> {
    this.users.set(user.uid, user);
    return user;
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(uid);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(uid, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const storage = new MemStorage();
