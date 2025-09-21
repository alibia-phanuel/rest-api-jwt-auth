declare module "nedb-promises" {
  interface Datastore<T> {
    insert(doc: T): Promise<T>;
    find(query: Partial<T>): Promise<T[]>;
    findOne(query: Partial<T>): Promise<T | null>;
    update(query: Partial<T>, update: Partial<T>, options?: { upsert?: boolean, multi?: boolean }): Promise<number>;
    remove(query: Partial<T>, options?: { multi?: boolean }): Promise<number>;
  }

  function Datastore<T>(options?: { filename?: string; autoload?: boolean }): Datastore<T>;

  export = Datastore;
}
