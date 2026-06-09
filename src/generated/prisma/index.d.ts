
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model WorldCupPlayerStats
 * 
 */
export type WorldCupPlayerStats = $Result.DefaultSelection<Prisma.$WorldCupPlayerStatsPayload>
/**
 * Model WorldCupMatchSync
 * 
 */
export type WorldCupMatchSync = $Result.DefaultSelection<Prisma.$WorldCupMatchSyncPayload>
/**
 * Model WorldCupMatch
 * 
 */
export type WorldCupMatch = $Result.DefaultSelection<Prisma.$WorldCupMatchPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more WorldCupPlayerStats
 * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more WorldCupPlayerStats
   * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.worldCupPlayerStats`: Exposes CRUD operations for the **WorldCupPlayerStats** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorldCupPlayerStats
    * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findMany()
    * ```
    */
  get worldCupPlayerStats(): Prisma.WorldCupPlayerStatsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.worldCupMatchSync`: Exposes CRUD operations for the **WorldCupMatchSync** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorldCupMatchSyncs
    * const worldCupMatchSyncs = await prisma.worldCupMatchSync.findMany()
    * ```
    */
  get worldCupMatchSync(): Prisma.WorldCupMatchSyncDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.worldCupMatch`: Exposes CRUD operations for the **WorldCupMatch** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorldCupMatches
    * const worldCupMatches = await prisma.worldCupMatch.findMany()
    * ```
    */
  get worldCupMatch(): Prisma.WorldCupMatchDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    WorldCupPlayerStats: 'WorldCupPlayerStats',
    WorldCupMatchSync: 'WorldCupMatchSync',
    WorldCupMatch: 'WorldCupMatch'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "worldCupPlayerStats" | "worldCupMatchSync" | "worldCupMatch"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      WorldCupPlayerStats: {
        payload: Prisma.$WorldCupPlayerStatsPayload<ExtArgs>
        fields: Prisma.WorldCupPlayerStatsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorldCupPlayerStatsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorldCupPlayerStatsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>
          }
          findFirst: {
            args: Prisma.WorldCupPlayerStatsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorldCupPlayerStatsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>
          }
          findMany: {
            args: Prisma.WorldCupPlayerStatsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>[]
          }
          create: {
            args: Prisma.WorldCupPlayerStatsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>
          }
          createMany: {
            args: Prisma.WorldCupPlayerStatsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorldCupPlayerStatsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>[]
          }
          delete: {
            args: Prisma.WorldCupPlayerStatsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>
          }
          update: {
            args: Prisma.WorldCupPlayerStatsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>
          }
          deleteMany: {
            args: Prisma.WorldCupPlayerStatsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorldCupPlayerStatsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorldCupPlayerStatsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>[]
          }
          upsert: {
            args: Prisma.WorldCupPlayerStatsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupPlayerStatsPayload>
          }
          aggregate: {
            args: Prisma.WorldCupPlayerStatsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorldCupPlayerStats>
          }
          groupBy: {
            args: Prisma.WorldCupPlayerStatsGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorldCupPlayerStatsGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorldCupPlayerStatsCountArgs<ExtArgs>
            result: $Utils.Optional<WorldCupPlayerStatsCountAggregateOutputType> | number
          }
        }
      }
      WorldCupMatchSync: {
        payload: Prisma.$WorldCupMatchSyncPayload<ExtArgs>
        fields: Prisma.WorldCupMatchSyncFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorldCupMatchSyncFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorldCupMatchSyncFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>
          }
          findFirst: {
            args: Prisma.WorldCupMatchSyncFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorldCupMatchSyncFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>
          }
          findMany: {
            args: Prisma.WorldCupMatchSyncFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>[]
          }
          create: {
            args: Prisma.WorldCupMatchSyncCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>
          }
          createMany: {
            args: Prisma.WorldCupMatchSyncCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorldCupMatchSyncCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>[]
          }
          delete: {
            args: Prisma.WorldCupMatchSyncDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>
          }
          update: {
            args: Prisma.WorldCupMatchSyncUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>
          }
          deleteMany: {
            args: Prisma.WorldCupMatchSyncDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorldCupMatchSyncUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorldCupMatchSyncUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>[]
          }
          upsert: {
            args: Prisma.WorldCupMatchSyncUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchSyncPayload>
          }
          aggregate: {
            args: Prisma.WorldCupMatchSyncAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorldCupMatchSync>
          }
          groupBy: {
            args: Prisma.WorldCupMatchSyncGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorldCupMatchSyncGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorldCupMatchSyncCountArgs<ExtArgs>
            result: $Utils.Optional<WorldCupMatchSyncCountAggregateOutputType> | number
          }
        }
      }
      WorldCupMatch: {
        payload: Prisma.$WorldCupMatchPayload<ExtArgs>
        fields: Prisma.WorldCupMatchFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorldCupMatchFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorldCupMatchFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>
          }
          findFirst: {
            args: Prisma.WorldCupMatchFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorldCupMatchFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>
          }
          findMany: {
            args: Prisma.WorldCupMatchFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>[]
          }
          create: {
            args: Prisma.WorldCupMatchCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>
          }
          createMany: {
            args: Prisma.WorldCupMatchCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorldCupMatchCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>[]
          }
          delete: {
            args: Prisma.WorldCupMatchDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>
          }
          update: {
            args: Prisma.WorldCupMatchUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>
          }
          deleteMany: {
            args: Prisma.WorldCupMatchDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorldCupMatchUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorldCupMatchUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>[]
          }
          upsert: {
            args: Prisma.WorldCupMatchUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorldCupMatchPayload>
          }
          aggregate: {
            args: Prisma.WorldCupMatchAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorldCupMatch>
          }
          groupBy: {
            args: Prisma.WorldCupMatchGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorldCupMatchGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorldCupMatchCountArgs<ExtArgs>
            result: $Utils.Optional<WorldCupMatchCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    worldCupPlayerStats?: WorldCupPlayerStatsOmit
    worldCupMatchSync?: WorldCupMatchSyncOmit
    worldCupMatch?: WorldCupMatchOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model WorldCupPlayerStats
   */

  export type AggregateWorldCupPlayerStats = {
    _count: WorldCupPlayerStatsCountAggregateOutputType | null
    _avg: WorldCupPlayerStatsAvgAggregateOutputType | null
    _sum: WorldCupPlayerStatsSumAggregateOutputType | null
    _min: WorldCupPlayerStatsMinAggregateOutputType | null
    _max: WorldCupPlayerStatsMaxAggregateOutputType | null
  }

  export type WorldCupPlayerStatsAvgAggregateOutputType = {
    shirtNumber: number | null
    matchesPlayed: number | null
    minutesPlayed: number | null
    goals: number | null
    assists: number | null
    shots: number | null
    shotsOnTarget: number | null
    passAccuracy: number | null
    passesCompleted: number | null
    passesAttempted: number | null
    tackles: number | null
    interceptions: number | null
    clearances: number | null
    saves: number | null
    cleanSheets: number | null
    yellowCards: number | null
    redCards: number | null
    avgRating: number | null
    performanceScore: number | null
  }

  export type WorldCupPlayerStatsSumAggregateOutputType = {
    shirtNumber: number | null
    matchesPlayed: number | null
    minutesPlayed: number | null
    goals: number | null
    assists: number | null
    shots: number | null
    shotsOnTarget: number | null
    passAccuracy: number | null
    passesCompleted: number | null
    passesAttempted: number | null
    tackles: number | null
    interceptions: number | null
    clearances: number | null
    saves: number | null
    cleanSheets: number | null
    yellowCards: number | null
    redCards: number | null
    avgRating: number | null
    performanceScore: number | null
  }

  export type WorldCupPlayerStatsMinAggregateOutputType = {
    id: string | null
    playerId: string | null
    playerName: string | null
    country: string | null
    position: string | null
    shirtNumber: number | null
    matchesPlayed: number | null
    minutesPlayed: number | null
    goals: number | null
    assists: number | null
    shots: number | null
    shotsOnTarget: number | null
    passAccuracy: number | null
    passesCompleted: number | null
    passesAttempted: number | null
    tackles: number | null
    interceptions: number | null
    clearances: number | null
    saves: number | null
    cleanSheets: number | null
    yellowCards: number | null
    redCards: number | null
    avgRating: number | null
    performanceScore: number | null
    lastUpdated: Date | null
    updatedAt: Date | null
  }

  export type WorldCupPlayerStatsMaxAggregateOutputType = {
    id: string | null
    playerId: string | null
    playerName: string | null
    country: string | null
    position: string | null
    shirtNumber: number | null
    matchesPlayed: number | null
    minutesPlayed: number | null
    goals: number | null
    assists: number | null
    shots: number | null
    shotsOnTarget: number | null
    passAccuracy: number | null
    passesCompleted: number | null
    passesAttempted: number | null
    tackles: number | null
    interceptions: number | null
    clearances: number | null
    saves: number | null
    cleanSheets: number | null
    yellowCards: number | null
    redCards: number | null
    avgRating: number | null
    performanceScore: number | null
    lastUpdated: Date | null
    updatedAt: Date | null
  }

  export type WorldCupPlayerStatsCountAggregateOutputType = {
    id: number
    playerId: number
    playerName: number
    country: number
    position: number
    shirtNumber: number
    matchesPlayed: number
    minutesPlayed: number
    goals: number
    assists: number
    shots: number
    shotsOnTarget: number
    passAccuracy: number
    passesCompleted: number
    passesAttempted: number
    tackles: number
    interceptions: number
    clearances: number
    saves: number
    cleanSheets: number
    yellowCards: number
    redCards: number
    avgRating: number
    performanceScore: number
    lastUpdated: number
    updatedAt: number
    _all: number
  }


  export type WorldCupPlayerStatsAvgAggregateInputType = {
    shirtNumber?: true
    matchesPlayed?: true
    minutesPlayed?: true
    goals?: true
    assists?: true
    shots?: true
    shotsOnTarget?: true
    passAccuracy?: true
    passesCompleted?: true
    passesAttempted?: true
    tackles?: true
    interceptions?: true
    clearances?: true
    saves?: true
    cleanSheets?: true
    yellowCards?: true
    redCards?: true
    avgRating?: true
    performanceScore?: true
  }

  export type WorldCupPlayerStatsSumAggregateInputType = {
    shirtNumber?: true
    matchesPlayed?: true
    minutesPlayed?: true
    goals?: true
    assists?: true
    shots?: true
    shotsOnTarget?: true
    passAccuracy?: true
    passesCompleted?: true
    passesAttempted?: true
    tackles?: true
    interceptions?: true
    clearances?: true
    saves?: true
    cleanSheets?: true
    yellowCards?: true
    redCards?: true
    avgRating?: true
    performanceScore?: true
  }

  export type WorldCupPlayerStatsMinAggregateInputType = {
    id?: true
    playerId?: true
    playerName?: true
    country?: true
    position?: true
    shirtNumber?: true
    matchesPlayed?: true
    minutesPlayed?: true
    goals?: true
    assists?: true
    shots?: true
    shotsOnTarget?: true
    passAccuracy?: true
    passesCompleted?: true
    passesAttempted?: true
    tackles?: true
    interceptions?: true
    clearances?: true
    saves?: true
    cleanSheets?: true
    yellowCards?: true
    redCards?: true
    avgRating?: true
    performanceScore?: true
    lastUpdated?: true
    updatedAt?: true
  }

  export type WorldCupPlayerStatsMaxAggregateInputType = {
    id?: true
    playerId?: true
    playerName?: true
    country?: true
    position?: true
    shirtNumber?: true
    matchesPlayed?: true
    minutesPlayed?: true
    goals?: true
    assists?: true
    shots?: true
    shotsOnTarget?: true
    passAccuracy?: true
    passesCompleted?: true
    passesAttempted?: true
    tackles?: true
    interceptions?: true
    clearances?: true
    saves?: true
    cleanSheets?: true
    yellowCards?: true
    redCards?: true
    avgRating?: true
    performanceScore?: true
    lastUpdated?: true
    updatedAt?: true
  }

  export type WorldCupPlayerStatsCountAggregateInputType = {
    id?: true
    playerId?: true
    playerName?: true
    country?: true
    position?: true
    shirtNumber?: true
    matchesPlayed?: true
    minutesPlayed?: true
    goals?: true
    assists?: true
    shots?: true
    shotsOnTarget?: true
    passAccuracy?: true
    passesCompleted?: true
    passesAttempted?: true
    tackles?: true
    interceptions?: true
    clearances?: true
    saves?: true
    cleanSheets?: true
    yellowCards?: true
    redCards?: true
    avgRating?: true
    performanceScore?: true
    lastUpdated?: true
    updatedAt?: true
    _all?: true
  }

  export type WorldCupPlayerStatsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorldCupPlayerStats to aggregate.
     */
    where?: WorldCupPlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupPlayerStats to fetch.
     */
    orderBy?: WorldCupPlayerStatsOrderByWithRelationInput | WorldCupPlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorldCupPlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupPlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupPlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorldCupPlayerStats
    **/
    _count?: true | WorldCupPlayerStatsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WorldCupPlayerStatsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WorldCupPlayerStatsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorldCupPlayerStatsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorldCupPlayerStatsMaxAggregateInputType
  }

  export type GetWorldCupPlayerStatsAggregateType<T extends WorldCupPlayerStatsAggregateArgs> = {
        [P in keyof T & keyof AggregateWorldCupPlayerStats]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorldCupPlayerStats[P]>
      : GetScalarType<T[P], AggregateWorldCupPlayerStats[P]>
  }




  export type WorldCupPlayerStatsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorldCupPlayerStatsWhereInput
    orderBy?: WorldCupPlayerStatsOrderByWithAggregationInput | WorldCupPlayerStatsOrderByWithAggregationInput[]
    by: WorldCupPlayerStatsScalarFieldEnum[] | WorldCupPlayerStatsScalarFieldEnum
    having?: WorldCupPlayerStatsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorldCupPlayerStatsCountAggregateInputType | true
    _avg?: WorldCupPlayerStatsAvgAggregateInputType
    _sum?: WorldCupPlayerStatsSumAggregateInputType
    _min?: WorldCupPlayerStatsMinAggregateInputType
    _max?: WorldCupPlayerStatsMaxAggregateInputType
  }

  export type WorldCupPlayerStatsGroupByOutputType = {
    id: string
    playerId: string
    playerName: string
    country: string
    position: string
    shirtNumber: number
    matchesPlayed: number
    minutesPlayed: number
    goals: number
    assists: number
    shots: number
    shotsOnTarget: number
    passAccuracy: number
    passesCompleted: number
    passesAttempted: number
    tackles: number
    interceptions: number
    clearances: number
    saves: number
    cleanSheets: number
    yellowCards: number
    redCards: number
    avgRating: number
    performanceScore: number
    lastUpdated: Date
    updatedAt: Date
    _count: WorldCupPlayerStatsCountAggregateOutputType | null
    _avg: WorldCupPlayerStatsAvgAggregateOutputType | null
    _sum: WorldCupPlayerStatsSumAggregateOutputType | null
    _min: WorldCupPlayerStatsMinAggregateOutputType | null
    _max: WorldCupPlayerStatsMaxAggregateOutputType | null
  }

  type GetWorldCupPlayerStatsGroupByPayload<T extends WorldCupPlayerStatsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorldCupPlayerStatsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorldCupPlayerStatsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorldCupPlayerStatsGroupByOutputType[P]>
            : GetScalarType<T[P], WorldCupPlayerStatsGroupByOutputType[P]>
        }
      >
    >


  export type WorldCupPlayerStatsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    playerName?: boolean
    country?: boolean
    position?: boolean
    shirtNumber?: boolean
    matchesPlayed?: boolean
    minutesPlayed?: boolean
    goals?: boolean
    assists?: boolean
    shots?: boolean
    shotsOnTarget?: boolean
    passAccuracy?: boolean
    passesCompleted?: boolean
    passesAttempted?: boolean
    tackles?: boolean
    interceptions?: boolean
    clearances?: boolean
    saves?: boolean
    cleanSheets?: boolean
    yellowCards?: boolean
    redCards?: boolean
    avgRating?: boolean
    performanceScore?: boolean
    lastUpdated?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["worldCupPlayerStats"]>

  export type WorldCupPlayerStatsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    playerName?: boolean
    country?: boolean
    position?: boolean
    shirtNumber?: boolean
    matchesPlayed?: boolean
    minutesPlayed?: boolean
    goals?: boolean
    assists?: boolean
    shots?: boolean
    shotsOnTarget?: boolean
    passAccuracy?: boolean
    passesCompleted?: boolean
    passesAttempted?: boolean
    tackles?: boolean
    interceptions?: boolean
    clearances?: boolean
    saves?: boolean
    cleanSheets?: boolean
    yellowCards?: boolean
    redCards?: boolean
    avgRating?: boolean
    performanceScore?: boolean
    lastUpdated?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["worldCupPlayerStats"]>

  export type WorldCupPlayerStatsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    playerName?: boolean
    country?: boolean
    position?: boolean
    shirtNumber?: boolean
    matchesPlayed?: boolean
    minutesPlayed?: boolean
    goals?: boolean
    assists?: boolean
    shots?: boolean
    shotsOnTarget?: boolean
    passAccuracy?: boolean
    passesCompleted?: boolean
    passesAttempted?: boolean
    tackles?: boolean
    interceptions?: boolean
    clearances?: boolean
    saves?: boolean
    cleanSheets?: boolean
    yellowCards?: boolean
    redCards?: boolean
    avgRating?: boolean
    performanceScore?: boolean
    lastUpdated?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["worldCupPlayerStats"]>

  export type WorldCupPlayerStatsSelectScalar = {
    id?: boolean
    playerId?: boolean
    playerName?: boolean
    country?: boolean
    position?: boolean
    shirtNumber?: boolean
    matchesPlayed?: boolean
    minutesPlayed?: boolean
    goals?: boolean
    assists?: boolean
    shots?: boolean
    shotsOnTarget?: boolean
    passAccuracy?: boolean
    passesCompleted?: boolean
    passesAttempted?: boolean
    tackles?: boolean
    interceptions?: boolean
    clearances?: boolean
    saves?: boolean
    cleanSheets?: boolean
    yellowCards?: boolean
    redCards?: boolean
    avgRating?: boolean
    performanceScore?: boolean
    lastUpdated?: boolean
    updatedAt?: boolean
  }

  export type WorldCupPlayerStatsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "playerId" | "playerName" | "country" | "position" | "shirtNumber" | "matchesPlayed" | "minutesPlayed" | "goals" | "assists" | "shots" | "shotsOnTarget" | "passAccuracy" | "passesCompleted" | "passesAttempted" | "tackles" | "interceptions" | "clearances" | "saves" | "cleanSheets" | "yellowCards" | "redCards" | "avgRating" | "performanceScore" | "lastUpdated" | "updatedAt", ExtArgs["result"]["worldCupPlayerStats"]>

  export type $WorldCupPlayerStatsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorldCupPlayerStats"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      playerId: string
      playerName: string
      country: string
      position: string
      shirtNumber: number
      matchesPlayed: number
      minutesPlayed: number
      goals: number
      assists: number
      shots: number
      shotsOnTarget: number
      passAccuracy: number
      passesCompleted: number
      passesAttempted: number
      tackles: number
      interceptions: number
      clearances: number
      saves: number
      cleanSheets: number
      yellowCards: number
      redCards: number
      avgRating: number
      performanceScore: number
      lastUpdated: Date
      updatedAt: Date
    }, ExtArgs["result"]["worldCupPlayerStats"]>
    composites: {}
  }

  type WorldCupPlayerStatsGetPayload<S extends boolean | null | undefined | WorldCupPlayerStatsDefaultArgs> = $Result.GetResult<Prisma.$WorldCupPlayerStatsPayload, S>

  type WorldCupPlayerStatsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorldCupPlayerStatsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorldCupPlayerStatsCountAggregateInputType | true
    }

  export interface WorldCupPlayerStatsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorldCupPlayerStats'], meta: { name: 'WorldCupPlayerStats' } }
    /**
     * Find zero or one WorldCupPlayerStats that matches the filter.
     * @param {WorldCupPlayerStatsFindUniqueArgs} args - Arguments to find a WorldCupPlayerStats
     * @example
     * // Get one WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorldCupPlayerStatsFindUniqueArgs>(args: SelectSubset<T, WorldCupPlayerStatsFindUniqueArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorldCupPlayerStats that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorldCupPlayerStatsFindUniqueOrThrowArgs} args - Arguments to find a WorldCupPlayerStats
     * @example
     * // Get one WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorldCupPlayerStatsFindUniqueOrThrowArgs>(args: SelectSubset<T, WorldCupPlayerStatsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorldCupPlayerStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupPlayerStatsFindFirstArgs} args - Arguments to find a WorldCupPlayerStats
     * @example
     * // Get one WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorldCupPlayerStatsFindFirstArgs>(args?: SelectSubset<T, WorldCupPlayerStatsFindFirstArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorldCupPlayerStats that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupPlayerStatsFindFirstOrThrowArgs} args - Arguments to find a WorldCupPlayerStats
     * @example
     * // Get one WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorldCupPlayerStatsFindFirstOrThrowArgs>(args?: SelectSubset<T, WorldCupPlayerStatsFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorldCupPlayerStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupPlayerStatsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findMany()
     * 
     * // Get first 10 WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const worldCupPlayerStatsWithIdOnly = await prisma.worldCupPlayerStats.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorldCupPlayerStatsFindManyArgs>(args?: SelectSubset<T, WorldCupPlayerStatsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorldCupPlayerStats.
     * @param {WorldCupPlayerStatsCreateArgs} args - Arguments to create a WorldCupPlayerStats.
     * @example
     * // Create one WorldCupPlayerStats
     * const WorldCupPlayerStats = await prisma.worldCupPlayerStats.create({
     *   data: {
     *     // ... data to create a WorldCupPlayerStats
     *   }
     * })
     * 
     */
    create<T extends WorldCupPlayerStatsCreateArgs>(args: SelectSubset<T, WorldCupPlayerStatsCreateArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorldCupPlayerStats.
     * @param {WorldCupPlayerStatsCreateManyArgs} args - Arguments to create many WorldCupPlayerStats.
     * @example
     * // Create many WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorldCupPlayerStatsCreateManyArgs>(args?: SelectSubset<T, WorldCupPlayerStatsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorldCupPlayerStats and returns the data saved in the database.
     * @param {WorldCupPlayerStatsCreateManyAndReturnArgs} args - Arguments to create many WorldCupPlayerStats.
     * @example
     * // Create many WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorldCupPlayerStats and only return the `id`
     * const worldCupPlayerStatsWithIdOnly = await prisma.worldCupPlayerStats.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorldCupPlayerStatsCreateManyAndReturnArgs>(args?: SelectSubset<T, WorldCupPlayerStatsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorldCupPlayerStats.
     * @param {WorldCupPlayerStatsDeleteArgs} args - Arguments to delete one WorldCupPlayerStats.
     * @example
     * // Delete one WorldCupPlayerStats
     * const WorldCupPlayerStats = await prisma.worldCupPlayerStats.delete({
     *   where: {
     *     // ... filter to delete one WorldCupPlayerStats
     *   }
     * })
     * 
     */
    delete<T extends WorldCupPlayerStatsDeleteArgs>(args: SelectSubset<T, WorldCupPlayerStatsDeleteArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorldCupPlayerStats.
     * @param {WorldCupPlayerStatsUpdateArgs} args - Arguments to update one WorldCupPlayerStats.
     * @example
     * // Update one WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorldCupPlayerStatsUpdateArgs>(args: SelectSubset<T, WorldCupPlayerStatsUpdateArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorldCupPlayerStats.
     * @param {WorldCupPlayerStatsDeleteManyArgs} args - Arguments to filter WorldCupPlayerStats to delete.
     * @example
     * // Delete a few WorldCupPlayerStats
     * const { count } = await prisma.worldCupPlayerStats.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorldCupPlayerStatsDeleteManyArgs>(args?: SelectSubset<T, WorldCupPlayerStatsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorldCupPlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupPlayerStatsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorldCupPlayerStatsUpdateManyArgs>(args: SelectSubset<T, WorldCupPlayerStatsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorldCupPlayerStats and returns the data updated in the database.
     * @param {WorldCupPlayerStatsUpdateManyAndReturnArgs} args - Arguments to update many WorldCupPlayerStats.
     * @example
     * // Update many WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorldCupPlayerStats and only return the `id`
     * const worldCupPlayerStatsWithIdOnly = await prisma.worldCupPlayerStats.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorldCupPlayerStatsUpdateManyAndReturnArgs>(args: SelectSubset<T, WorldCupPlayerStatsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorldCupPlayerStats.
     * @param {WorldCupPlayerStatsUpsertArgs} args - Arguments to update or create a WorldCupPlayerStats.
     * @example
     * // Update or create a WorldCupPlayerStats
     * const worldCupPlayerStats = await prisma.worldCupPlayerStats.upsert({
     *   create: {
     *     // ... data to create a WorldCupPlayerStats
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorldCupPlayerStats we want to update
     *   }
     * })
     */
    upsert<T extends WorldCupPlayerStatsUpsertArgs>(args: SelectSubset<T, WorldCupPlayerStatsUpsertArgs<ExtArgs>>): Prisma__WorldCupPlayerStatsClient<$Result.GetResult<Prisma.$WorldCupPlayerStatsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorldCupPlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupPlayerStatsCountArgs} args - Arguments to filter WorldCupPlayerStats to count.
     * @example
     * // Count the number of WorldCupPlayerStats
     * const count = await prisma.worldCupPlayerStats.count({
     *   where: {
     *     // ... the filter for the WorldCupPlayerStats we want to count
     *   }
     * })
    **/
    count<T extends WorldCupPlayerStatsCountArgs>(
      args?: Subset<T, WorldCupPlayerStatsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorldCupPlayerStatsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorldCupPlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupPlayerStatsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorldCupPlayerStatsAggregateArgs>(args: Subset<T, WorldCupPlayerStatsAggregateArgs>): Prisma.PrismaPromise<GetWorldCupPlayerStatsAggregateType<T>>

    /**
     * Group by WorldCupPlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupPlayerStatsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorldCupPlayerStatsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorldCupPlayerStatsGroupByArgs['orderBy'] }
        : { orderBy?: WorldCupPlayerStatsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorldCupPlayerStatsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorldCupPlayerStatsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorldCupPlayerStats model
   */
  readonly fields: WorldCupPlayerStatsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorldCupPlayerStats.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorldCupPlayerStatsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorldCupPlayerStats model
   */
  interface WorldCupPlayerStatsFieldRefs {
    readonly id: FieldRef<"WorldCupPlayerStats", 'String'>
    readonly playerId: FieldRef<"WorldCupPlayerStats", 'String'>
    readonly playerName: FieldRef<"WorldCupPlayerStats", 'String'>
    readonly country: FieldRef<"WorldCupPlayerStats", 'String'>
    readonly position: FieldRef<"WorldCupPlayerStats", 'String'>
    readonly shirtNumber: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly matchesPlayed: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly minutesPlayed: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly goals: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly assists: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly shots: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly shotsOnTarget: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly passAccuracy: FieldRef<"WorldCupPlayerStats", 'Float'>
    readonly passesCompleted: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly passesAttempted: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly tackles: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly interceptions: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly clearances: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly saves: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly cleanSheets: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly yellowCards: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly redCards: FieldRef<"WorldCupPlayerStats", 'Int'>
    readonly avgRating: FieldRef<"WorldCupPlayerStats", 'Float'>
    readonly performanceScore: FieldRef<"WorldCupPlayerStats", 'Float'>
    readonly lastUpdated: FieldRef<"WorldCupPlayerStats", 'DateTime'>
    readonly updatedAt: FieldRef<"WorldCupPlayerStats", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorldCupPlayerStats findUnique
   */
  export type WorldCupPlayerStatsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupPlayerStats to fetch.
     */
    where: WorldCupPlayerStatsWhereUniqueInput
  }

  /**
   * WorldCupPlayerStats findUniqueOrThrow
   */
  export type WorldCupPlayerStatsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupPlayerStats to fetch.
     */
    where: WorldCupPlayerStatsWhereUniqueInput
  }

  /**
   * WorldCupPlayerStats findFirst
   */
  export type WorldCupPlayerStatsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupPlayerStats to fetch.
     */
    where?: WorldCupPlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupPlayerStats to fetch.
     */
    orderBy?: WorldCupPlayerStatsOrderByWithRelationInput | WorldCupPlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorldCupPlayerStats.
     */
    cursor?: WorldCupPlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupPlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupPlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupPlayerStats.
     */
    distinct?: WorldCupPlayerStatsScalarFieldEnum | WorldCupPlayerStatsScalarFieldEnum[]
  }

  /**
   * WorldCupPlayerStats findFirstOrThrow
   */
  export type WorldCupPlayerStatsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupPlayerStats to fetch.
     */
    where?: WorldCupPlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupPlayerStats to fetch.
     */
    orderBy?: WorldCupPlayerStatsOrderByWithRelationInput | WorldCupPlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorldCupPlayerStats.
     */
    cursor?: WorldCupPlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupPlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupPlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupPlayerStats.
     */
    distinct?: WorldCupPlayerStatsScalarFieldEnum | WorldCupPlayerStatsScalarFieldEnum[]
  }

  /**
   * WorldCupPlayerStats findMany
   */
  export type WorldCupPlayerStatsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupPlayerStats to fetch.
     */
    where?: WorldCupPlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupPlayerStats to fetch.
     */
    orderBy?: WorldCupPlayerStatsOrderByWithRelationInput | WorldCupPlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorldCupPlayerStats.
     */
    cursor?: WorldCupPlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupPlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupPlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupPlayerStats.
     */
    distinct?: WorldCupPlayerStatsScalarFieldEnum | WorldCupPlayerStatsScalarFieldEnum[]
  }

  /**
   * WorldCupPlayerStats create
   */
  export type WorldCupPlayerStatsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * The data needed to create a WorldCupPlayerStats.
     */
    data: XOR<WorldCupPlayerStatsCreateInput, WorldCupPlayerStatsUncheckedCreateInput>
  }

  /**
   * WorldCupPlayerStats createMany
   */
  export type WorldCupPlayerStatsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorldCupPlayerStats.
     */
    data: WorldCupPlayerStatsCreateManyInput | WorldCupPlayerStatsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorldCupPlayerStats createManyAndReturn
   */
  export type WorldCupPlayerStatsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * The data used to create many WorldCupPlayerStats.
     */
    data: WorldCupPlayerStatsCreateManyInput | WorldCupPlayerStatsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorldCupPlayerStats update
   */
  export type WorldCupPlayerStatsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * The data needed to update a WorldCupPlayerStats.
     */
    data: XOR<WorldCupPlayerStatsUpdateInput, WorldCupPlayerStatsUncheckedUpdateInput>
    /**
     * Choose, which WorldCupPlayerStats to update.
     */
    where: WorldCupPlayerStatsWhereUniqueInput
  }

  /**
   * WorldCupPlayerStats updateMany
   */
  export type WorldCupPlayerStatsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorldCupPlayerStats.
     */
    data: XOR<WorldCupPlayerStatsUpdateManyMutationInput, WorldCupPlayerStatsUncheckedUpdateManyInput>
    /**
     * Filter which WorldCupPlayerStats to update
     */
    where?: WorldCupPlayerStatsWhereInput
    /**
     * Limit how many WorldCupPlayerStats to update.
     */
    limit?: number
  }

  /**
   * WorldCupPlayerStats updateManyAndReturn
   */
  export type WorldCupPlayerStatsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * The data used to update WorldCupPlayerStats.
     */
    data: XOR<WorldCupPlayerStatsUpdateManyMutationInput, WorldCupPlayerStatsUncheckedUpdateManyInput>
    /**
     * Filter which WorldCupPlayerStats to update
     */
    where?: WorldCupPlayerStatsWhereInput
    /**
     * Limit how many WorldCupPlayerStats to update.
     */
    limit?: number
  }

  /**
   * WorldCupPlayerStats upsert
   */
  export type WorldCupPlayerStatsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * The filter to search for the WorldCupPlayerStats to update in case it exists.
     */
    where: WorldCupPlayerStatsWhereUniqueInput
    /**
     * In case the WorldCupPlayerStats found by the `where` argument doesn't exist, create a new WorldCupPlayerStats with this data.
     */
    create: XOR<WorldCupPlayerStatsCreateInput, WorldCupPlayerStatsUncheckedCreateInput>
    /**
     * In case the WorldCupPlayerStats was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorldCupPlayerStatsUpdateInput, WorldCupPlayerStatsUncheckedUpdateInput>
  }

  /**
   * WorldCupPlayerStats delete
   */
  export type WorldCupPlayerStatsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
    /**
     * Filter which WorldCupPlayerStats to delete.
     */
    where: WorldCupPlayerStatsWhereUniqueInput
  }

  /**
   * WorldCupPlayerStats deleteMany
   */
  export type WorldCupPlayerStatsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorldCupPlayerStats to delete
     */
    where?: WorldCupPlayerStatsWhereInput
    /**
     * Limit how many WorldCupPlayerStats to delete.
     */
    limit?: number
  }

  /**
   * WorldCupPlayerStats without action
   */
  export type WorldCupPlayerStatsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupPlayerStats
     */
    select?: WorldCupPlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupPlayerStats
     */
    omit?: WorldCupPlayerStatsOmit<ExtArgs> | null
  }


  /**
   * Model WorldCupMatchSync
   */

  export type AggregateWorldCupMatchSync = {
    _count: WorldCupMatchSyncCountAggregateOutputType | null
    _min: WorldCupMatchSyncMinAggregateOutputType | null
    _max: WorldCupMatchSyncMaxAggregateOutputType | null
  }

  export type WorldCupMatchSyncMinAggregateOutputType = {
    id: string | null
    matchId: string | null
    syncedAt: Date | null
  }

  export type WorldCupMatchSyncMaxAggregateOutputType = {
    id: string | null
    matchId: string | null
    syncedAt: Date | null
  }

  export type WorldCupMatchSyncCountAggregateOutputType = {
    id: number
    matchId: number
    syncedAt: number
    _all: number
  }


  export type WorldCupMatchSyncMinAggregateInputType = {
    id?: true
    matchId?: true
    syncedAt?: true
  }

  export type WorldCupMatchSyncMaxAggregateInputType = {
    id?: true
    matchId?: true
    syncedAt?: true
  }

  export type WorldCupMatchSyncCountAggregateInputType = {
    id?: true
    matchId?: true
    syncedAt?: true
    _all?: true
  }

  export type WorldCupMatchSyncAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorldCupMatchSync to aggregate.
     */
    where?: WorldCupMatchSyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatchSyncs to fetch.
     */
    orderBy?: WorldCupMatchSyncOrderByWithRelationInput | WorldCupMatchSyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorldCupMatchSyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatchSyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatchSyncs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorldCupMatchSyncs
    **/
    _count?: true | WorldCupMatchSyncCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorldCupMatchSyncMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorldCupMatchSyncMaxAggregateInputType
  }

  export type GetWorldCupMatchSyncAggregateType<T extends WorldCupMatchSyncAggregateArgs> = {
        [P in keyof T & keyof AggregateWorldCupMatchSync]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorldCupMatchSync[P]>
      : GetScalarType<T[P], AggregateWorldCupMatchSync[P]>
  }




  export type WorldCupMatchSyncGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorldCupMatchSyncWhereInput
    orderBy?: WorldCupMatchSyncOrderByWithAggregationInput | WorldCupMatchSyncOrderByWithAggregationInput[]
    by: WorldCupMatchSyncScalarFieldEnum[] | WorldCupMatchSyncScalarFieldEnum
    having?: WorldCupMatchSyncScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorldCupMatchSyncCountAggregateInputType | true
    _min?: WorldCupMatchSyncMinAggregateInputType
    _max?: WorldCupMatchSyncMaxAggregateInputType
  }

  export type WorldCupMatchSyncGroupByOutputType = {
    id: string
    matchId: string
    syncedAt: Date
    _count: WorldCupMatchSyncCountAggregateOutputType | null
    _min: WorldCupMatchSyncMinAggregateOutputType | null
    _max: WorldCupMatchSyncMaxAggregateOutputType | null
  }

  type GetWorldCupMatchSyncGroupByPayload<T extends WorldCupMatchSyncGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorldCupMatchSyncGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorldCupMatchSyncGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorldCupMatchSyncGroupByOutputType[P]>
            : GetScalarType<T[P], WorldCupMatchSyncGroupByOutputType[P]>
        }
      >
    >


  export type WorldCupMatchSyncSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    syncedAt?: boolean
  }, ExtArgs["result"]["worldCupMatchSync"]>

  export type WorldCupMatchSyncSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    syncedAt?: boolean
  }, ExtArgs["result"]["worldCupMatchSync"]>

  export type WorldCupMatchSyncSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    syncedAt?: boolean
  }, ExtArgs["result"]["worldCupMatchSync"]>

  export type WorldCupMatchSyncSelectScalar = {
    id?: boolean
    matchId?: boolean
    syncedAt?: boolean
  }

  export type WorldCupMatchSyncOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "matchId" | "syncedAt", ExtArgs["result"]["worldCupMatchSync"]>

  export type $WorldCupMatchSyncPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorldCupMatchSync"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      matchId: string
      syncedAt: Date
    }, ExtArgs["result"]["worldCupMatchSync"]>
    composites: {}
  }

  type WorldCupMatchSyncGetPayload<S extends boolean | null | undefined | WorldCupMatchSyncDefaultArgs> = $Result.GetResult<Prisma.$WorldCupMatchSyncPayload, S>

  type WorldCupMatchSyncCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorldCupMatchSyncFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorldCupMatchSyncCountAggregateInputType | true
    }

  export interface WorldCupMatchSyncDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorldCupMatchSync'], meta: { name: 'WorldCupMatchSync' } }
    /**
     * Find zero or one WorldCupMatchSync that matches the filter.
     * @param {WorldCupMatchSyncFindUniqueArgs} args - Arguments to find a WorldCupMatchSync
     * @example
     * // Get one WorldCupMatchSync
     * const worldCupMatchSync = await prisma.worldCupMatchSync.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorldCupMatchSyncFindUniqueArgs>(args: SelectSubset<T, WorldCupMatchSyncFindUniqueArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorldCupMatchSync that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorldCupMatchSyncFindUniqueOrThrowArgs} args - Arguments to find a WorldCupMatchSync
     * @example
     * // Get one WorldCupMatchSync
     * const worldCupMatchSync = await prisma.worldCupMatchSync.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorldCupMatchSyncFindUniqueOrThrowArgs>(args: SelectSubset<T, WorldCupMatchSyncFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorldCupMatchSync that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchSyncFindFirstArgs} args - Arguments to find a WorldCupMatchSync
     * @example
     * // Get one WorldCupMatchSync
     * const worldCupMatchSync = await prisma.worldCupMatchSync.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorldCupMatchSyncFindFirstArgs>(args?: SelectSubset<T, WorldCupMatchSyncFindFirstArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorldCupMatchSync that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchSyncFindFirstOrThrowArgs} args - Arguments to find a WorldCupMatchSync
     * @example
     * // Get one WorldCupMatchSync
     * const worldCupMatchSync = await prisma.worldCupMatchSync.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorldCupMatchSyncFindFirstOrThrowArgs>(args?: SelectSubset<T, WorldCupMatchSyncFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorldCupMatchSyncs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchSyncFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorldCupMatchSyncs
     * const worldCupMatchSyncs = await prisma.worldCupMatchSync.findMany()
     * 
     * // Get first 10 WorldCupMatchSyncs
     * const worldCupMatchSyncs = await prisma.worldCupMatchSync.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const worldCupMatchSyncWithIdOnly = await prisma.worldCupMatchSync.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorldCupMatchSyncFindManyArgs>(args?: SelectSubset<T, WorldCupMatchSyncFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorldCupMatchSync.
     * @param {WorldCupMatchSyncCreateArgs} args - Arguments to create a WorldCupMatchSync.
     * @example
     * // Create one WorldCupMatchSync
     * const WorldCupMatchSync = await prisma.worldCupMatchSync.create({
     *   data: {
     *     // ... data to create a WorldCupMatchSync
     *   }
     * })
     * 
     */
    create<T extends WorldCupMatchSyncCreateArgs>(args: SelectSubset<T, WorldCupMatchSyncCreateArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorldCupMatchSyncs.
     * @param {WorldCupMatchSyncCreateManyArgs} args - Arguments to create many WorldCupMatchSyncs.
     * @example
     * // Create many WorldCupMatchSyncs
     * const worldCupMatchSync = await prisma.worldCupMatchSync.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorldCupMatchSyncCreateManyArgs>(args?: SelectSubset<T, WorldCupMatchSyncCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorldCupMatchSyncs and returns the data saved in the database.
     * @param {WorldCupMatchSyncCreateManyAndReturnArgs} args - Arguments to create many WorldCupMatchSyncs.
     * @example
     * // Create many WorldCupMatchSyncs
     * const worldCupMatchSync = await prisma.worldCupMatchSync.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorldCupMatchSyncs and only return the `id`
     * const worldCupMatchSyncWithIdOnly = await prisma.worldCupMatchSync.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorldCupMatchSyncCreateManyAndReturnArgs>(args?: SelectSubset<T, WorldCupMatchSyncCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorldCupMatchSync.
     * @param {WorldCupMatchSyncDeleteArgs} args - Arguments to delete one WorldCupMatchSync.
     * @example
     * // Delete one WorldCupMatchSync
     * const WorldCupMatchSync = await prisma.worldCupMatchSync.delete({
     *   where: {
     *     // ... filter to delete one WorldCupMatchSync
     *   }
     * })
     * 
     */
    delete<T extends WorldCupMatchSyncDeleteArgs>(args: SelectSubset<T, WorldCupMatchSyncDeleteArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorldCupMatchSync.
     * @param {WorldCupMatchSyncUpdateArgs} args - Arguments to update one WorldCupMatchSync.
     * @example
     * // Update one WorldCupMatchSync
     * const worldCupMatchSync = await prisma.worldCupMatchSync.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorldCupMatchSyncUpdateArgs>(args: SelectSubset<T, WorldCupMatchSyncUpdateArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorldCupMatchSyncs.
     * @param {WorldCupMatchSyncDeleteManyArgs} args - Arguments to filter WorldCupMatchSyncs to delete.
     * @example
     * // Delete a few WorldCupMatchSyncs
     * const { count } = await prisma.worldCupMatchSync.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorldCupMatchSyncDeleteManyArgs>(args?: SelectSubset<T, WorldCupMatchSyncDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorldCupMatchSyncs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchSyncUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorldCupMatchSyncs
     * const worldCupMatchSync = await prisma.worldCupMatchSync.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorldCupMatchSyncUpdateManyArgs>(args: SelectSubset<T, WorldCupMatchSyncUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorldCupMatchSyncs and returns the data updated in the database.
     * @param {WorldCupMatchSyncUpdateManyAndReturnArgs} args - Arguments to update many WorldCupMatchSyncs.
     * @example
     * // Update many WorldCupMatchSyncs
     * const worldCupMatchSync = await prisma.worldCupMatchSync.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorldCupMatchSyncs and only return the `id`
     * const worldCupMatchSyncWithIdOnly = await prisma.worldCupMatchSync.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorldCupMatchSyncUpdateManyAndReturnArgs>(args: SelectSubset<T, WorldCupMatchSyncUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorldCupMatchSync.
     * @param {WorldCupMatchSyncUpsertArgs} args - Arguments to update or create a WorldCupMatchSync.
     * @example
     * // Update or create a WorldCupMatchSync
     * const worldCupMatchSync = await prisma.worldCupMatchSync.upsert({
     *   create: {
     *     // ... data to create a WorldCupMatchSync
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorldCupMatchSync we want to update
     *   }
     * })
     */
    upsert<T extends WorldCupMatchSyncUpsertArgs>(args: SelectSubset<T, WorldCupMatchSyncUpsertArgs<ExtArgs>>): Prisma__WorldCupMatchSyncClient<$Result.GetResult<Prisma.$WorldCupMatchSyncPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorldCupMatchSyncs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchSyncCountArgs} args - Arguments to filter WorldCupMatchSyncs to count.
     * @example
     * // Count the number of WorldCupMatchSyncs
     * const count = await prisma.worldCupMatchSync.count({
     *   where: {
     *     // ... the filter for the WorldCupMatchSyncs we want to count
     *   }
     * })
    **/
    count<T extends WorldCupMatchSyncCountArgs>(
      args?: Subset<T, WorldCupMatchSyncCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorldCupMatchSyncCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorldCupMatchSync.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchSyncAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorldCupMatchSyncAggregateArgs>(args: Subset<T, WorldCupMatchSyncAggregateArgs>): Prisma.PrismaPromise<GetWorldCupMatchSyncAggregateType<T>>

    /**
     * Group by WorldCupMatchSync.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchSyncGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorldCupMatchSyncGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorldCupMatchSyncGroupByArgs['orderBy'] }
        : { orderBy?: WorldCupMatchSyncGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorldCupMatchSyncGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorldCupMatchSyncGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorldCupMatchSync model
   */
  readonly fields: WorldCupMatchSyncFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorldCupMatchSync.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorldCupMatchSyncClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorldCupMatchSync model
   */
  interface WorldCupMatchSyncFieldRefs {
    readonly id: FieldRef<"WorldCupMatchSync", 'String'>
    readonly matchId: FieldRef<"WorldCupMatchSync", 'String'>
    readonly syncedAt: FieldRef<"WorldCupMatchSync", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorldCupMatchSync findUnique
   */
  export type WorldCupMatchSyncFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatchSync to fetch.
     */
    where: WorldCupMatchSyncWhereUniqueInput
  }

  /**
   * WorldCupMatchSync findUniqueOrThrow
   */
  export type WorldCupMatchSyncFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatchSync to fetch.
     */
    where: WorldCupMatchSyncWhereUniqueInput
  }

  /**
   * WorldCupMatchSync findFirst
   */
  export type WorldCupMatchSyncFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatchSync to fetch.
     */
    where?: WorldCupMatchSyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatchSyncs to fetch.
     */
    orderBy?: WorldCupMatchSyncOrderByWithRelationInput | WorldCupMatchSyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorldCupMatchSyncs.
     */
    cursor?: WorldCupMatchSyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatchSyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatchSyncs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupMatchSyncs.
     */
    distinct?: WorldCupMatchSyncScalarFieldEnum | WorldCupMatchSyncScalarFieldEnum[]
  }

  /**
   * WorldCupMatchSync findFirstOrThrow
   */
  export type WorldCupMatchSyncFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatchSync to fetch.
     */
    where?: WorldCupMatchSyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatchSyncs to fetch.
     */
    orderBy?: WorldCupMatchSyncOrderByWithRelationInput | WorldCupMatchSyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorldCupMatchSyncs.
     */
    cursor?: WorldCupMatchSyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatchSyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatchSyncs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupMatchSyncs.
     */
    distinct?: WorldCupMatchSyncScalarFieldEnum | WorldCupMatchSyncScalarFieldEnum[]
  }

  /**
   * WorldCupMatchSync findMany
   */
  export type WorldCupMatchSyncFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatchSyncs to fetch.
     */
    where?: WorldCupMatchSyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatchSyncs to fetch.
     */
    orderBy?: WorldCupMatchSyncOrderByWithRelationInput | WorldCupMatchSyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorldCupMatchSyncs.
     */
    cursor?: WorldCupMatchSyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatchSyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatchSyncs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupMatchSyncs.
     */
    distinct?: WorldCupMatchSyncScalarFieldEnum | WorldCupMatchSyncScalarFieldEnum[]
  }

  /**
   * WorldCupMatchSync create
   */
  export type WorldCupMatchSyncCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * The data needed to create a WorldCupMatchSync.
     */
    data: XOR<WorldCupMatchSyncCreateInput, WorldCupMatchSyncUncheckedCreateInput>
  }

  /**
   * WorldCupMatchSync createMany
   */
  export type WorldCupMatchSyncCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorldCupMatchSyncs.
     */
    data: WorldCupMatchSyncCreateManyInput | WorldCupMatchSyncCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorldCupMatchSync createManyAndReturn
   */
  export type WorldCupMatchSyncCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * The data used to create many WorldCupMatchSyncs.
     */
    data: WorldCupMatchSyncCreateManyInput | WorldCupMatchSyncCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorldCupMatchSync update
   */
  export type WorldCupMatchSyncUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * The data needed to update a WorldCupMatchSync.
     */
    data: XOR<WorldCupMatchSyncUpdateInput, WorldCupMatchSyncUncheckedUpdateInput>
    /**
     * Choose, which WorldCupMatchSync to update.
     */
    where: WorldCupMatchSyncWhereUniqueInput
  }

  /**
   * WorldCupMatchSync updateMany
   */
  export type WorldCupMatchSyncUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorldCupMatchSyncs.
     */
    data: XOR<WorldCupMatchSyncUpdateManyMutationInput, WorldCupMatchSyncUncheckedUpdateManyInput>
    /**
     * Filter which WorldCupMatchSyncs to update
     */
    where?: WorldCupMatchSyncWhereInput
    /**
     * Limit how many WorldCupMatchSyncs to update.
     */
    limit?: number
  }

  /**
   * WorldCupMatchSync updateManyAndReturn
   */
  export type WorldCupMatchSyncUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * The data used to update WorldCupMatchSyncs.
     */
    data: XOR<WorldCupMatchSyncUpdateManyMutationInput, WorldCupMatchSyncUncheckedUpdateManyInput>
    /**
     * Filter which WorldCupMatchSyncs to update
     */
    where?: WorldCupMatchSyncWhereInput
    /**
     * Limit how many WorldCupMatchSyncs to update.
     */
    limit?: number
  }

  /**
   * WorldCupMatchSync upsert
   */
  export type WorldCupMatchSyncUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * The filter to search for the WorldCupMatchSync to update in case it exists.
     */
    where: WorldCupMatchSyncWhereUniqueInput
    /**
     * In case the WorldCupMatchSync found by the `where` argument doesn't exist, create a new WorldCupMatchSync with this data.
     */
    create: XOR<WorldCupMatchSyncCreateInput, WorldCupMatchSyncUncheckedCreateInput>
    /**
     * In case the WorldCupMatchSync was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorldCupMatchSyncUpdateInput, WorldCupMatchSyncUncheckedUpdateInput>
  }

  /**
   * WorldCupMatchSync delete
   */
  export type WorldCupMatchSyncDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
    /**
     * Filter which WorldCupMatchSync to delete.
     */
    where: WorldCupMatchSyncWhereUniqueInput
  }

  /**
   * WorldCupMatchSync deleteMany
   */
  export type WorldCupMatchSyncDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorldCupMatchSyncs to delete
     */
    where?: WorldCupMatchSyncWhereInput
    /**
     * Limit how many WorldCupMatchSyncs to delete.
     */
    limit?: number
  }

  /**
   * WorldCupMatchSync without action
   */
  export type WorldCupMatchSyncDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatchSync
     */
    select?: WorldCupMatchSyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatchSync
     */
    omit?: WorldCupMatchSyncOmit<ExtArgs> | null
  }


  /**
   * Model WorldCupMatch
   */

  export type AggregateWorldCupMatch = {
    _count: WorldCupMatchCountAggregateOutputType | null
    _avg: WorldCupMatchAvgAggregateOutputType | null
    _sum: WorldCupMatchSumAggregateOutputType | null
    _min: WorldCupMatchMinAggregateOutputType | null
    _max: WorldCupMatchMaxAggregateOutputType | null
  }

  export type WorldCupMatchAvgAggregateOutputType = {
    homeScore: number | null
    awayScore: number | null
  }

  export type WorldCupMatchSumAggregateOutputType = {
    homeScore: number | null
    awayScore: number | null
  }

  export type WorldCupMatchMinAggregateOutputType = {
    id: string | null
    matchDate: Date | null
    homeTeam: string | null
    awayTeam: string | null
    homeScore: number | null
    awayScore: number | null
    status: string | null
    stage: string | null
    groupName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorldCupMatchMaxAggregateOutputType = {
    id: string | null
    matchDate: Date | null
    homeTeam: string | null
    awayTeam: string | null
    homeScore: number | null
    awayScore: number | null
    status: string | null
    stage: string | null
    groupName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorldCupMatchCountAggregateOutputType = {
    id: number
    matchDate: number
    homeTeam: number
    awayTeam: number
    homeScore: number
    awayScore: number
    status: number
    stage: number
    groupName: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WorldCupMatchAvgAggregateInputType = {
    homeScore?: true
    awayScore?: true
  }

  export type WorldCupMatchSumAggregateInputType = {
    homeScore?: true
    awayScore?: true
  }

  export type WorldCupMatchMinAggregateInputType = {
    id?: true
    matchDate?: true
    homeTeam?: true
    awayTeam?: true
    homeScore?: true
    awayScore?: true
    status?: true
    stage?: true
    groupName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorldCupMatchMaxAggregateInputType = {
    id?: true
    matchDate?: true
    homeTeam?: true
    awayTeam?: true
    homeScore?: true
    awayScore?: true
    status?: true
    stage?: true
    groupName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorldCupMatchCountAggregateInputType = {
    id?: true
    matchDate?: true
    homeTeam?: true
    awayTeam?: true
    homeScore?: true
    awayScore?: true
    status?: true
    stage?: true
    groupName?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WorldCupMatchAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorldCupMatch to aggregate.
     */
    where?: WorldCupMatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatches to fetch.
     */
    orderBy?: WorldCupMatchOrderByWithRelationInput | WorldCupMatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorldCupMatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorldCupMatches
    **/
    _count?: true | WorldCupMatchCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WorldCupMatchAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WorldCupMatchSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorldCupMatchMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorldCupMatchMaxAggregateInputType
  }

  export type GetWorldCupMatchAggregateType<T extends WorldCupMatchAggregateArgs> = {
        [P in keyof T & keyof AggregateWorldCupMatch]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorldCupMatch[P]>
      : GetScalarType<T[P], AggregateWorldCupMatch[P]>
  }




  export type WorldCupMatchGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorldCupMatchWhereInput
    orderBy?: WorldCupMatchOrderByWithAggregationInput | WorldCupMatchOrderByWithAggregationInput[]
    by: WorldCupMatchScalarFieldEnum[] | WorldCupMatchScalarFieldEnum
    having?: WorldCupMatchScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorldCupMatchCountAggregateInputType | true
    _avg?: WorldCupMatchAvgAggregateInputType
    _sum?: WorldCupMatchSumAggregateInputType
    _min?: WorldCupMatchMinAggregateInputType
    _max?: WorldCupMatchMaxAggregateInputType
  }

  export type WorldCupMatchGroupByOutputType = {
    id: string
    matchDate: Date
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    status: string
    stage: string
    groupName: string | null
    createdAt: Date
    updatedAt: Date
    _count: WorldCupMatchCountAggregateOutputType | null
    _avg: WorldCupMatchAvgAggregateOutputType | null
    _sum: WorldCupMatchSumAggregateOutputType | null
    _min: WorldCupMatchMinAggregateOutputType | null
    _max: WorldCupMatchMaxAggregateOutputType | null
  }

  type GetWorldCupMatchGroupByPayload<T extends WorldCupMatchGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorldCupMatchGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorldCupMatchGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorldCupMatchGroupByOutputType[P]>
            : GetScalarType<T[P], WorldCupMatchGroupByOutputType[P]>
        }
      >
    >


  export type WorldCupMatchSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchDate?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeScore?: boolean
    awayScore?: boolean
    status?: boolean
    stage?: boolean
    groupName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["worldCupMatch"]>

  export type WorldCupMatchSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchDate?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeScore?: boolean
    awayScore?: boolean
    status?: boolean
    stage?: boolean
    groupName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["worldCupMatch"]>

  export type WorldCupMatchSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchDate?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeScore?: boolean
    awayScore?: boolean
    status?: boolean
    stage?: boolean
    groupName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["worldCupMatch"]>

  export type WorldCupMatchSelectScalar = {
    id?: boolean
    matchDate?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeScore?: boolean
    awayScore?: boolean
    status?: boolean
    stage?: boolean
    groupName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WorldCupMatchOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "matchDate" | "homeTeam" | "awayTeam" | "homeScore" | "awayScore" | "status" | "stage" | "groupName" | "createdAt" | "updatedAt", ExtArgs["result"]["worldCupMatch"]>

  export type $WorldCupMatchPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorldCupMatch"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      matchDate: Date
      homeTeam: string
      awayTeam: string
      homeScore: number
      awayScore: number
      status: string
      stage: string
      groupName: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["worldCupMatch"]>
    composites: {}
  }

  type WorldCupMatchGetPayload<S extends boolean | null | undefined | WorldCupMatchDefaultArgs> = $Result.GetResult<Prisma.$WorldCupMatchPayload, S>

  type WorldCupMatchCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorldCupMatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorldCupMatchCountAggregateInputType | true
    }

  export interface WorldCupMatchDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorldCupMatch'], meta: { name: 'WorldCupMatch' } }
    /**
     * Find zero or one WorldCupMatch that matches the filter.
     * @param {WorldCupMatchFindUniqueArgs} args - Arguments to find a WorldCupMatch
     * @example
     * // Get one WorldCupMatch
     * const worldCupMatch = await prisma.worldCupMatch.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorldCupMatchFindUniqueArgs>(args: SelectSubset<T, WorldCupMatchFindUniqueArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorldCupMatch that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorldCupMatchFindUniqueOrThrowArgs} args - Arguments to find a WorldCupMatch
     * @example
     * // Get one WorldCupMatch
     * const worldCupMatch = await prisma.worldCupMatch.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorldCupMatchFindUniqueOrThrowArgs>(args: SelectSubset<T, WorldCupMatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorldCupMatch that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchFindFirstArgs} args - Arguments to find a WorldCupMatch
     * @example
     * // Get one WorldCupMatch
     * const worldCupMatch = await prisma.worldCupMatch.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorldCupMatchFindFirstArgs>(args?: SelectSubset<T, WorldCupMatchFindFirstArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorldCupMatch that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchFindFirstOrThrowArgs} args - Arguments to find a WorldCupMatch
     * @example
     * // Get one WorldCupMatch
     * const worldCupMatch = await prisma.worldCupMatch.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorldCupMatchFindFirstOrThrowArgs>(args?: SelectSubset<T, WorldCupMatchFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorldCupMatches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorldCupMatches
     * const worldCupMatches = await prisma.worldCupMatch.findMany()
     * 
     * // Get first 10 WorldCupMatches
     * const worldCupMatches = await prisma.worldCupMatch.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const worldCupMatchWithIdOnly = await prisma.worldCupMatch.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorldCupMatchFindManyArgs>(args?: SelectSubset<T, WorldCupMatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorldCupMatch.
     * @param {WorldCupMatchCreateArgs} args - Arguments to create a WorldCupMatch.
     * @example
     * // Create one WorldCupMatch
     * const WorldCupMatch = await prisma.worldCupMatch.create({
     *   data: {
     *     // ... data to create a WorldCupMatch
     *   }
     * })
     * 
     */
    create<T extends WorldCupMatchCreateArgs>(args: SelectSubset<T, WorldCupMatchCreateArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorldCupMatches.
     * @param {WorldCupMatchCreateManyArgs} args - Arguments to create many WorldCupMatches.
     * @example
     * // Create many WorldCupMatches
     * const worldCupMatch = await prisma.worldCupMatch.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorldCupMatchCreateManyArgs>(args?: SelectSubset<T, WorldCupMatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorldCupMatches and returns the data saved in the database.
     * @param {WorldCupMatchCreateManyAndReturnArgs} args - Arguments to create many WorldCupMatches.
     * @example
     * // Create many WorldCupMatches
     * const worldCupMatch = await prisma.worldCupMatch.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorldCupMatches and only return the `id`
     * const worldCupMatchWithIdOnly = await prisma.worldCupMatch.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorldCupMatchCreateManyAndReturnArgs>(args?: SelectSubset<T, WorldCupMatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorldCupMatch.
     * @param {WorldCupMatchDeleteArgs} args - Arguments to delete one WorldCupMatch.
     * @example
     * // Delete one WorldCupMatch
     * const WorldCupMatch = await prisma.worldCupMatch.delete({
     *   where: {
     *     // ... filter to delete one WorldCupMatch
     *   }
     * })
     * 
     */
    delete<T extends WorldCupMatchDeleteArgs>(args: SelectSubset<T, WorldCupMatchDeleteArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorldCupMatch.
     * @param {WorldCupMatchUpdateArgs} args - Arguments to update one WorldCupMatch.
     * @example
     * // Update one WorldCupMatch
     * const worldCupMatch = await prisma.worldCupMatch.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorldCupMatchUpdateArgs>(args: SelectSubset<T, WorldCupMatchUpdateArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorldCupMatches.
     * @param {WorldCupMatchDeleteManyArgs} args - Arguments to filter WorldCupMatches to delete.
     * @example
     * // Delete a few WorldCupMatches
     * const { count } = await prisma.worldCupMatch.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorldCupMatchDeleteManyArgs>(args?: SelectSubset<T, WorldCupMatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorldCupMatches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorldCupMatches
     * const worldCupMatch = await prisma.worldCupMatch.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorldCupMatchUpdateManyArgs>(args: SelectSubset<T, WorldCupMatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorldCupMatches and returns the data updated in the database.
     * @param {WorldCupMatchUpdateManyAndReturnArgs} args - Arguments to update many WorldCupMatches.
     * @example
     * // Update many WorldCupMatches
     * const worldCupMatch = await prisma.worldCupMatch.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorldCupMatches and only return the `id`
     * const worldCupMatchWithIdOnly = await prisma.worldCupMatch.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorldCupMatchUpdateManyAndReturnArgs>(args: SelectSubset<T, WorldCupMatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorldCupMatch.
     * @param {WorldCupMatchUpsertArgs} args - Arguments to update or create a WorldCupMatch.
     * @example
     * // Update or create a WorldCupMatch
     * const worldCupMatch = await prisma.worldCupMatch.upsert({
     *   create: {
     *     // ... data to create a WorldCupMatch
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorldCupMatch we want to update
     *   }
     * })
     */
    upsert<T extends WorldCupMatchUpsertArgs>(args: SelectSubset<T, WorldCupMatchUpsertArgs<ExtArgs>>): Prisma__WorldCupMatchClient<$Result.GetResult<Prisma.$WorldCupMatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorldCupMatches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchCountArgs} args - Arguments to filter WorldCupMatches to count.
     * @example
     * // Count the number of WorldCupMatches
     * const count = await prisma.worldCupMatch.count({
     *   where: {
     *     // ... the filter for the WorldCupMatches we want to count
     *   }
     * })
    **/
    count<T extends WorldCupMatchCountArgs>(
      args?: Subset<T, WorldCupMatchCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorldCupMatchCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorldCupMatch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorldCupMatchAggregateArgs>(args: Subset<T, WorldCupMatchAggregateArgs>): Prisma.PrismaPromise<GetWorldCupMatchAggregateType<T>>

    /**
     * Group by WorldCupMatch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorldCupMatchGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorldCupMatchGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorldCupMatchGroupByArgs['orderBy'] }
        : { orderBy?: WorldCupMatchGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorldCupMatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorldCupMatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorldCupMatch model
   */
  readonly fields: WorldCupMatchFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorldCupMatch.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorldCupMatchClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorldCupMatch model
   */
  interface WorldCupMatchFieldRefs {
    readonly id: FieldRef<"WorldCupMatch", 'String'>
    readonly matchDate: FieldRef<"WorldCupMatch", 'DateTime'>
    readonly homeTeam: FieldRef<"WorldCupMatch", 'String'>
    readonly awayTeam: FieldRef<"WorldCupMatch", 'String'>
    readonly homeScore: FieldRef<"WorldCupMatch", 'Int'>
    readonly awayScore: FieldRef<"WorldCupMatch", 'Int'>
    readonly status: FieldRef<"WorldCupMatch", 'String'>
    readonly stage: FieldRef<"WorldCupMatch", 'String'>
    readonly groupName: FieldRef<"WorldCupMatch", 'String'>
    readonly createdAt: FieldRef<"WorldCupMatch", 'DateTime'>
    readonly updatedAt: FieldRef<"WorldCupMatch", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorldCupMatch findUnique
   */
  export type WorldCupMatchFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatch to fetch.
     */
    where: WorldCupMatchWhereUniqueInput
  }

  /**
   * WorldCupMatch findUniqueOrThrow
   */
  export type WorldCupMatchFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatch to fetch.
     */
    where: WorldCupMatchWhereUniqueInput
  }

  /**
   * WorldCupMatch findFirst
   */
  export type WorldCupMatchFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatch to fetch.
     */
    where?: WorldCupMatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatches to fetch.
     */
    orderBy?: WorldCupMatchOrderByWithRelationInput | WorldCupMatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorldCupMatches.
     */
    cursor?: WorldCupMatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupMatches.
     */
    distinct?: WorldCupMatchScalarFieldEnum | WorldCupMatchScalarFieldEnum[]
  }

  /**
   * WorldCupMatch findFirstOrThrow
   */
  export type WorldCupMatchFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatch to fetch.
     */
    where?: WorldCupMatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatches to fetch.
     */
    orderBy?: WorldCupMatchOrderByWithRelationInput | WorldCupMatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorldCupMatches.
     */
    cursor?: WorldCupMatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupMatches.
     */
    distinct?: WorldCupMatchScalarFieldEnum | WorldCupMatchScalarFieldEnum[]
  }

  /**
   * WorldCupMatch findMany
   */
  export type WorldCupMatchFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * Filter, which WorldCupMatches to fetch.
     */
    where?: WorldCupMatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorldCupMatches to fetch.
     */
    orderBy?: WorldCupMatchOrderByWithRelationInput | WorldCupMatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorldCupMatches.
     */
    cursor?: WorldCupMatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorldCupMatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorldCupMatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorldCupMatches.
     */
    distinct?: WorldCupMatchScalarFieldEnum | WorldCupMatchScalarFieldEnum[]
  }

  /**
   * WorldCupMatch create
   */
  export type WorldCupMatchCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * The data needed to create a WorldCupMatch.
     */
    data: XOR<WorldCupMatchCreateInput, WorldCupMatchUncheckedCreateInput>
  }

  /**
   * WorldCupMatch createMany
   */
  export type WorldCupMatchCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorldCupMatches.
     */
    data: WorldCupMatchCreateManyInput | WorldCupMatchCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorldCupMatch createManyAndReturn
   */
  export type WorldCupMatchCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * The data used to create many WorldCupMatches.
     */
    data: WorldCupMatchCreateManyInput | WorldCupMatchCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorldCupMatch update
   */
  export type WorldCupMatchUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * The data needed to update a WorldCupMatch.
     */
    data: XOR<WorldCupMatchUpdateInput, WorldCupMatchUncheckedUpdateInput>
    /**
     * Choose, which WorldCupMatch to update.
     */
    where: WorldCupMatchWhereUniqueInput
  }

  /**
   * WorldCupMatch updateMany
   */
  export type WorldCupMatchUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorldCupMatches.
     */
    data: XOR<WorldCupMatchUpdateManyMutationInput, WorldCupMatchUncheckedUpdateManyInput>
    /**
     * Filter which WorldCupMatches to update
     */
    where?: WorldCupMatchWhereInput
    /**
     * Limit how many WorldCupMatches to update.
     */
    limit?: number
  }

  /**
   * WorldCupMatch updateManyAndReturn
   */
  export type WorldCupMatchUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * The data used to update WorldCupMatches.
     */
    data: XOR<WorldCupMatchUpdateManyMutationInput, WorldCupMatchUncheckedUpdateManyInput>
    /**
     * Filter which WorldCupMatches to update
     */
    where?: WorldCupMatchWhereInput
    /**
     * Limit how many WorldCupMatches to update.
     */
    limit?: number
  }

  /**
   * WorldCupMatch upsert
   */
  export type WorldCupMatchUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * The filter to search for the WorldCupMatch to update in case it exists.
     */
    where: WorldCupMatchWhereUniqueInput
    /**
     * In case the WorldCupMatch found by the `where` argument doesn't exist, create a new WorldCupMatch with this data.
     */
    create: XOR<WorldCupMatchCreateInput, WorldCupMatchUncheckedCreateInput>
    /**
     * In case the WorldCupMatch was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorldCupMatchUpdateInput, WorldCupMatchUncheckedUpdateInput>
  }

  /**
   * WorldCupMatch delete
   */
  export type WorldCupMatchDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
    /**
     * Filter which WorldCupMatch to delete.
     */
    where: WorldCupMatchWhereUniqueInput
  }

  /**
   * WorldCupMatch deleteMany
   */
  export type WorldCupMatchDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorldCupMatches to delete
     */
    where?: WorldCupMatchWhereInput
    /**
     * Limit how many WorldCupMatches to delete.
     */
    limit?: number
  }

  /**
   * WorldCupMatch without action
   */
  export type WorldCupMatchDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorldCupMatch
     */
    select?: WorldCupMatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorldCupMatch
     */
    omit?: WorldCupMatchOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const WorldCupPlayerStatsScalarFieldEnum: {
    id: 'id',
    playerId: 'playerId',
    playerName: 'playerName',
    country: 'country',
    position: 'position',
    shirtNumber: 'shirtNumber',
    matchesPlayed: 'matchesPlayed',
    minutesPlayed: 'minutesPlayed',
    goals: 'goals',
    assists: 'assists',
    shots: 'shots',
    shotsOnTarget: 'shotsOnTarget',
    passAccuracy: 'passAccuracy',
    passesCompleted: 'passesCompleted',
    passesAttempted: 'passesAttempted',
    tackles: 'tackles',
    interceptions: 'interceptions',
    clearances: 'clearances',
    saves: 'saves',
    cleanSheets: 'cleanSheets',
    yellowCards: 'yellowCards',
    redCards: 'redCards',
    avgRating: 'avgRating',
    performanceScore: 'performanceScore',
    lastUpdated: 'lastUpdated',
    updatedAt: 'updatedAt'
  };

  export type WorldCupPlayerStatsScalarFieldEnum = (typeof WorldCupPlayerStatsScalarFieldEnum)[keyof typeof WorldCupPlayerStatsScalarFieldEnum]


  export const WorldCupMatchSyncScalarFieldEnum: {
    id: 'id',
    matchId: 'matchId',
    syncedAt: 'syncedAt'
  };

  export type WorldCupMatchSyncScalarFieldEnum = (typeof WorldCupMatchSyncScalarFieldEnum)[keyof typeof WorldCupMatchSyncScalarFieldEnum]


  export const WorldCupMatchScalarFieldEnum: {
    id: 'id',
    matchDate: 'matchDate',
    homeTeam: 'homeTeam',
    awayTeam: 'awayTeam',
    homeScore: 'homeScore',
    awayScore: 'awayScore',
    status: 'status',
    stage: 'stage',
    groupName: 'groupName',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WorldCupMatchScalarFieldEnum = (typeof WorldCupMatchScalarFieldEnum)[keyof typeof WorldCupMatchScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    
  /**
   * Deep Input Types
   */


  export type WorldCupPlayerStatsWhereInput = {
    AND?: WorldCupPlayerStatsWhereInput | WorldCupPlayerStatsWhereInput[]
    OR?: WorldCupPlayerStatsWhereInput[]
    NOT?: WorldCupPlayerStatsWhereInput | WorldCupPlayerStatsWhereInput[]
    id?: StringFilter<"WorldCupPlayerStats"> | string
    playerId?: StringFilter<"WorldCupPlayerStats"> | string
    playerName?: StringFilter<"WorldCupPlayerStats"> | string
    country?: StringFilter<"WorldCupPlayerStats"> | string
    position?: StringFilter<"WorldCupPlayerStats"> | string
    shirtNumber?: IntFilter<"WorldCupPlayerStats"> | number
    matchesPlayed?: IntFilter<"WorldCupPlayerStats"> | number
    minutesPlayed?: IntFilter<"WorldCupPlayerStats"> | number
    goals?: IntFilter<"WorldCupPlayerStats"> | number
    assists?: IntFilter<"WorldCupPlayerStats"> | number
    shots?: IntFilter<"WorldCupPlayerStats"> | number
    shotsOnTarget?: IntFilter<"WorldCupPlayerStats"> | number
    passAccuracy?: FloatFilter<"WorldCupPlayerStats"> | number
    passesCompleted?: IntFilter<"WorldCupPlayerStats"> | number
    passesAttempted?: IntFilter<"WorldCupPlayerStats"> | number
    tackles?: IntFilter<"WorldCupPlayerStats"> | number
    interceptions?: IntFilter<"WorldCupPlayerStats"> | number
    clearances?: IntFilter<"WorldCupPlayerStats"> | number
    saves?: IntFilter<"WorldCupPlayerStats"> | number
    cleanSheets?: IntFilter<"WorldCupPlayerStats"> | number
    yellowCards?: IntFilter<"WorldCupPlayerStats"> | number
    redCards?: IntFilter<"WorldCupPlayerStats"> | number
    avgRating?: FloatFilter<"WorldCupPlayerStats"> | number
    performanceScore?: FloatFilter<"WorldCupPlayerStats"> | number
    lastUpdated?: DateTimeFilter<"WorldCupPlayerStats"> | Date | string
    updatedAt?: DateTimeFilter<"WorldCupPlayerStats"> | Date | string
  }

  export type WorldCupPlayerStatsOrderByWithRelationInput = {
    id?: SortOrder
    playerId?: SortOrder
    playerName?: SortOrder
    country?: SortOrder
    position?: SortOrder
    shirtNumber?: SortOrder
    matchesPlayed?: SortOrder
    minutesPlayed?: SortOrder
    goals?: SortOrder
    assists?: SortOrder
    shots?: SortOrder
    shotsOnTarget?: SortOrder
    passAccuracy?: SortOrder
    passesCompleted?: SortOrder
    passesAttempted?: SortOrder
    tackles?: SortOrder
    interceptions?: SortOrder
    clearances?: SortOrder
    saves?: SortOrder
    cleanSheets?: SortOrder
    yellowCards?: SortOrder
    redCards?: SortOrder
    avgRating?: SortOrder
    performanceScore?: SortOrder
    lastUpdated?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupPlayerStatsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    playerId?: string
    AND?: WorldCupPlayerStatsWhereInput | WorldCupPlayerStatsWhereInput[]
    OR?: WorldCupPlayerStatsWhereInput[]
    NOT?: WorldCupPlayerStatsWhereInput | WorldCupPlayerStatsWhereInput[]
    playerName?: StringFilter<"WorldCupPlayerStats"> | string
    country?: StringFilter<"WorldCupPlayerStats"> | string
    position?: StringFilter<"WorldCupPlayerStats"> | string
    shirtNumber?: IntFilter<"WorldCupPlayerStats"> | number
    matchesPlayed?: IntFilter<"WorldCupPlayerStats"> | number
    minutesPlayed?: IntFilter<"WorldCupPlayerStats"> | number
    goals?: IntFilter<"WorldCupPlayerStats"> | number
    assists?: IntFilter<"WorldCupPlayerStats"> | number
    shots?: IntFilter<"WorldCupPlayerStats"> | number
    shotsOnTarget?: IntFilter<"WorldCupPlayerStats"> | number
    passAccuracy?: FloatFilter<"WorldCupPlayerStats"> | number
    passesCompleted?: IntFilter<"WorldCupPlayerStats"> | number
    passesAttempted?: IntFilter<"WorldCupPlayerStats"> | number
    tackles?: IntFilter<"WorldCupPlayerStats"> | number
    interceptions?: IntFilter<"WorldCupPlayerStats"> | number
    clearances?: IntFilter<"WorldCupPlayerStats"> | number
    saves?: IntFilter<"WorldCupPlayerStats"> | number
    cleanSheets?: IntFilter<"WorldCupPlayerStats"> | number
    yellowCards?: IntFilter<"WorldCupPlayerStats"> | number
    redCards?: IntFilter<"WorldCupPlayerStats"> | number
    avgRating?: FloatFilter<"WorldCupPlayerStats"> | number
    performanceScore?: FloatFilter<"WorldCupPlayerStats"> | number
    lastUpdated?: DateTimeFilter<"WorldCupPlayerStats"> | Date | string
    updatedAt?: DateTimeFilter<"WorldCupPlayerStats"> | Date | string
  }, "id" | "playerId">

  export type WorldCupPlayerStatsOrderByWithAggregationInput = {
    id?: SortOrder
    playerId?: SortOrder
    playerName?: SortOrder
    country?: SortOrder
    position?: SortOrder
    shirtNumber?: SortOrder
    matchesPlayed?: SortOrder
    minutesPlayed?: SortOrder
    goals?: SortOrder
    assists?: SortOrder
    shots?: SortOrder
    shotsOnTarget?: SortOrder
    passAccuracy?: SortOrder
    passesCompleted?: SortOrder
    passesAttempted?: SortOrder
    tackles?: SortOrder
    interceptions?: SortOrder
    clearances?: SortOrder
    saves?: SortOrder
    cleanSheets?: SortOrder
    yellowCards?: SortOrder
    redCards?: SortOrder
    avgRating?: SortOrder
    performanceScore?: SortOrder
    lastUpdated?: SortOrder
    updatedAt?: SortOrder
    _count?: WorldCupPlayerStatsCountOrderByAggregateInput
    _avg?: WorldCupPlayerStatsAvgOrderByAggregateInput
    _max?: WorldCupPlayerStatsMaxOrderByAggregateInput
    _min?: WorldCupPlayerStatsMinOrderByAggregateInput
    _sum?: WorldCupPlayerStatsSumOrderByAggregateInput
  }

  export type WorldCupPlayerStatsScalarWhereWithAggregatesInput = {
    AND?: WorldCupPlayerStatsScalarWhereWithAggregatesInput | WorldCupPlayerStatsScalarWhereWithAggregatesInput[]
    OR?: WorldCupPlayerStatsScalarWhereWithAggregatesInput[]
    NOT?: WorldCupPlayerStatsScalarWhereWithAggregatesInput | WorldCupPlayerStatsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorldCupPlayerStats"> | string
    playerId?: StringWithAggregatesFilter<"WorldCupPlayerStats"> | string
    playerName?: StringWithAggregatesFilter<"WorldCupPlayerStats"> | string
    country?: StringWithAggregatesFilter<"WorldCupPlayerStats"> | string
    position?: StringWithAggregatesFilter<"WorldCupPlayerStats"> | string
    shirtNumber?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    matchesPlayed?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    minutesPlayed?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    goals?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    assists?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    shots?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    shotsOnTarget?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    passAccuracy?: FloatWithAggregatesFilter<"WorldCupPlayerStats"> | number
    passesCompleted?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    passesAttempted?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    tackles?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    interceptions?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    clearances?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    saves?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    cleanSheets?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    yellowCards?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    redCards?: IntWithAggregatesFilter<"WorldCupPlayerStats"> | number
    avgRating?: FloatWithAggregatesFilter<"WorldCupPlayerStats"> | number
    performanceScore?: FloatWithAggregatesFilter<"WorldCupPlayerStats"> | number
    lastUpdated?: DateTimeWithAggregatesFilter<"WorldCupPlayerStats"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorldCupPlayerStats"> | Date | string
  }

  export type WorldCupMatchSyncWhereInput = {
    AND?: WorldCupMatchSyncWhereInput | WorldCupMatchSyncWhereInput[]
    OR?: WorldCupMatchSyncWhereInput[]
    NOT?: WorldCupMatchSyncWhereInput | WorldCupMatchSyncWhereInput[]
    id?: StringFilter<"WorldCupMatchSync"> | string
    matchId?: StringFilter<"WorldCupMatchSync"> | string
    syncedAt?: DateTimeFilter<"WorldCupMatchSync"> | Date | string
  }

  export type WorldCupMatchSyncOrderByWithRelationInput = {
    id?: SortOrder
    matchId?: SortOrder
    syncedAt?: SortOrder
  }

  export type WorldCupMatchSyncWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    matchId?: string
    AND?: WorldCupMatchSyncWhereInput | WorldCupMatchSyncWhereInput[]
    OR?: WorldCupMatchSyncWhereInput[]
    NOT?: WorldCupMatchSyncWhereInput | WorldCupMatchSyncWhereInput[]
    syncedAt?: DateTimeFilter<"WorldCupMatchSync"> | Date | string
  }, "id" | "matchId">

  export type WorldCupMatchSyncOrderByWithAggregationInput = {
    id?: SortOrder
    matchId?: SortOrder
    syncedAt?: SortOrder
    _count?: WorldCupMatchSyncCountOrderByAggregateInput
    _max?: WorldCupMatchSyncMaxOrderByAggregateInput
    _min?: WorldCupMatchSyncMinOrderByAggregateInput
  }

  export type WorldCupMatchSyncScalarWhereWithAggregatesInput = {
    AND?: WorldCupMatchSyncScalarWhereWithAggregatesInput | WorldCupMatchSyncScalarWhereWithAggregatesInput[]
    OR?: WorldCupMatchSyncScalarWhereWithAggregatesInput[]
    NOT?: WorldCupMatchSyncScalarWhereWithAggregatesInput | WorldCupMatchSyncScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorldCupMatchSync"> | string
    matchId?: StringWithAggregatesFilter<"WorldCupMatchSync"> | string
    syncedAt?: DateTimeWithAggregatesFilter<"WorldCupMatchSync"> | Date | string
  }

  export type WorldCupMatchWhereInput = {
    AND?: WorldCupMatchWhereInput | WorldCupMatchWhereInput[]
    OR?: WorldCupMatchWhereInput[]
    NOT?: WorldCupMatchWhereInput | WorldCupMatchWhereInput[]
    id?: StringFilter<"WorldCupMatch"> | string
    matchDate?: DateTimeFilter<"WorldCupMatch"> | Date | string
    homeTeam?: StringFilter<"WorldCupMatch"> | string
    awayTeam?: StringFilter<"WorldCupMatch"> | string
    homeScore?: IntFilter<"WorldCupMatch"> | number
    awayScore?: IntFilter<"WorldCupMatch"> | number
    status?: StringFilter<"WorldCupMatch"> | string
    stage?: StringFilter<"WorldCupMatch"> | string
    groupName?: StringNullableFilter<"WorldCupMatch"> | string | null
    createdAt?: DateTimeFilter<"WorldCupMatch"> | Date | string
    updatedAt?: DateTimeFilter<"WorldCupMatch"> | Date | string
  }

  export type WorldCupMatchOrderByWithRelationInput = {
    id?: SortOrder
    matchDate?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    status?: SortOrder
    stage?: SortOrder
    groupName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupMatchWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WorldCupMatchWhereInput | WorldCupMatchWhereInput[]
    OR?: WorldCupMatchWhereInput[]
    NOT?: WorldCupMatchWhereInput | WorldCupMatchWhereInput[]
    matchDate?: DateTimeFilter<"WorldCupMatch"> | Date | string
    homeTeam?: StringFilter<"WorldCupMatch"> | string
    awayTeam?: StringFilter<"WorldCupMatch"> | string
    homeScore?: IntFilter<"WorldCupMatch"> | number
    awayScore?: IntFilter<"WorldCupMatch"> | number
    status?: StringFilter<"WorldCupMatch"> | string
    stage?: StringFilter<"WorldCupMatch"> | string
    groupName?: StringNullableFilter<"WorldCupMatch"> | string | null
    createdAt?: DateTimeFilter<"WorldCupMatch"> | Date | string
    updatedAt?: DateTimeFilter<"WorldCupMatch"> | Date | string
  }, "id">

  export type WorldCupMatchOrderByWithAggregationInput = {
    id?: SortOrder
    matchDate?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    status?: SortOrder
    stage?: SortOrder
    groupName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WorldCupMatchCountOrderByAggregateInput
    _avg?: WorldCupMatchAvgOrderByAggregateInput
    _max?: WorldCupMatchMaxOrderByAggregateInput
    _min?: WorldCupMatchMinOrderByAggregateInput
    _sum?: WorldCupMatchSumOrderByAggregateInput
  }

  export type WorldCupMatchScalarWhereWithAggregatesInput = {
    AND?: WorldCupMatchScalarWhereWithAggregatesInput | WorldCupMatchScalarWhereWithAggregatesInput[]
    OR?: WorldCupMatchScalarWhereWithAggregatesInput[]
    NOT?: WorldCupMatchScalarWhereWithAggregatesInput | WorldCupMatchScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorldCupMatch"> | string
    matchDate?: DateTimeWithAggregatesFilter<"WorldCupMatch"> | Date | string
    homeTeam?: StringWithAggregatesFilter<"WorldCupMatch"> | string
    awayTeam?: StringWithAggregatesFilter<"WorldCupMatch"> | string
    homeScore?: IntWithAggregatesFilter<"WorldCupMatch"> | number
    awayScore?: IntWithAggregatesFilter<"WorldCupMatch"> | number
    status?: StringWithAggregatesFilter<"WorldCupMatch"> | string
    stage?: StringWithAggregatesFilter<"WorldCupMatch"> | string
    groupName?: StringNullableWithAggregatesFilter<"WorldCupMatch"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"WorldCupMatch"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorldCupMatch"> | Date | string
  }

  export type WorldCupPlayerStatsCreateInput = {
    id?: string
    playerId: string
    playerName: string
    country: string
    position: string
    shirtNumber?: number
    matchesPlayed?: number
    minutesPlayed?: number
    goals?: number
    assists?: number
    shots?: number
    shotsOnTarget?: number
    passAccuracy?: number
    passesCompleted?: number
    passesAttempted?: number
    tackles?: number
    interceptions?: number
    clearances?: number
    saves?: number
    cleanSheets?: number
    yellowCards?: number
    redCards?: number
    avgRating?: number
    performanceScore?: number
    lastUpdated?: Date | string
    updatedAt?: Date | string
  }

  export type WorldCupPlayerStatsUncheckedCreateInput = {
    id?: string
    playerId: string
    playerName: string
    country: string
    position: string
    shirtNumber?: number
    matchesPlayed?: number
    minutesPlayed?: number
    goals?: number
    assists?: number
    shots?: number
    shotsOnTarget?: number
    passAccuracy?: number
    passesCompleted?: number
    passesAttempted?: number
    tackles?: number
    interceptions?: number
    clearances?: number
    saves?: number
    cleanSheets?: number
    yellowCards?: number
    redCards?: number
    avgRating?: number
    performanceScore?: number
    lastUpdated?: Date | string
    updatedAt?: Date | string
  }

  export type WorldCupPlayerStatsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    playerName?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    position?: StringFieldUpdateOperationsInput | string
    shirtNumber?: IntFieldUpdateOperationsInput | number
    matchesPlayed?: IntFieldUpdateOperationsInput | number
    minutesPlayed?: IntFieldUpdateOperationsInput | number
    goals?: IntFieldUpdateOperationsInput | number
    assists?: IntFieldUpdateOperationsInput | number
    shots?: IntFieldUpdateOperationsInput | number
    shotsOnTarget?: IntFieldUpdateOperationsInput | number
    passAccuracy?: FloatFieldUpdateOperationsInput | number
    passesCompleted?: IntFieldUpdateOperationsInput | number
    passesAttempted?: IntFieldUpdateOperationsInput | number
    tackles?: IntFieldUpdateOperationsInput | number
    interceptions?: IntFieldUpdateOperationsInput | number
    clearances?: IntFieldUpdateOperationsInput | number
    saves?: IntFieldUpdateOperationsInput | number
    cleanSheets?: IntFieldUpdateOperationsInput | number
    yellowCards?: IntFieldUpdateOperationsInput | number
    redCards?: IntFieldUpdateOperationsInput | number
    avgRating?: FloatFieldUpdateOperationsInput | number
    performanceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupPlayerStatsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    playerName?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    position?: StringFieldUpdateOperationsInput | string
    shirtNumber?: IntFieldUpdateOperationsInput | number
    matchesPlayed?: IntFieldUpdateOperationsInput | number
    minutesPlayed?: IntFieldUpdateOperationsInput | number
    goals?: IntFieldUpdateOperationsInput | number
    assists?: IntFieldUpdateOperationsInput | number
    shots?: IntFieldUpdateOperationsInput | number
    shotsOnTarget?: IntFieldUpdateOperationsInput | number
    passAccuracy?: FloatFieldUpdateOperationsInput | number
    passesCompleted?: IntFieldUpdateOperationsInput | number
    passesAttempted?: IntFieldUpdateOperationsInput | number
    tackles?: IntFieldUpdateOperationsInput | number
    interceptions?: IntFieldUpdateOperationsInput | number
    clearances?: IntFieldUpdateOperationsInput | number
    saves?: IntFieldUpdateOperationsInput | number
    cleanSheets?: IntFieldUpdateOperationsInput | number
    yellowCards?: IntFieldUpdateOperationsInput | number
    redCards?: IntFieldUpdateOperationsInput | number
    avgRating?: FloatFieldUpdateOperationsInput | number
    performanceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupPlayerStatsCreateManyInput = {
    id?: string
    playerId: string
    playerName: string
    country: string
    position: string
    shirtNumber?: number
    matchesPlayed?: number
    minutesPlayed?: number
    goals?: number
    assists?: number
    shots?: number
    shotsOnTarget?: number
    passAccuracy?: number
    passesCompleted?: number
    passesAttempted?: number
    tackles?: number
    interceptions?: number
    clearances?: number
    saves?: number
    cleanSheets?: number
    yellowCards?: number
    redCards?: number
    avgRating?: number
    performanceScore?: number
    lastUpdated?: Date | string
    updatedAt?: Date | string
  }

  export type WorldCupPlayerStatsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    playerName?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    position?: StringFieldUpdateOperationsInput | string
    shirtNumber?: IntFieldUpdateOperationsInput | number
    matchesPlayed?: IntFieldUpdateOperationsInput | number
    minutesPlayed?: IntFieldUpdateOperationsInput | number
    goals?: IntFieldUpdateOperationsInput | number
    assists?: IntFieldUpdateOperationsInput | number
    shots?: IntFieldUpdateOperationsInput | number
    shotsOnTarget?: IntFieldUpdateOperationsInput | number
    passAccuracy?: FloatFieldUpdateOperationsInput | number
    passesCompleted?: IntFieldUpdateOperationsInput | number
    passesAttempted?: IntFieldUpdateOperationsInput | number
    tackles?: IntFieldUpdateOperationsInput | number
    interceptions?: IntFieldUpdateOperationsInput | number
    clearances?: IntFieldUpdateOperationsInput | number
    saves?: IntFieldUpdateOperationsInput | number
    cleanSheets?: IntFieldUpdateOperationsInput | number
    yellowCards?: IntFieldUpdateOperationsInput | number
    redCards?: IntFieldUpdateOperationsInput | number
    avgRating?: FloatFieldUpdateOperationsInput | number
    performanceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupPlayerStatsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    playerName?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    position?: StringFieldUpdateOperationsInput | string
    shirtNumber?: IntFieldUpdateOperationsInput | number
    matchesPlayed?: IntFieldUpdateOperationsInput | number
    minutesPlayed?: IntFieldUpdateOperationsInput | number
    goals?: IntFieldUpdateOperationsInput | number
    assists?: IntFieldUpdateOperationsInput | number
    shots?: IntFieldUpdateOperationsInput | number
    shotsOnTarget?: IntFieldUpdateOperationsInput | number
    passAccuracy?: FloatFieldUpdateOperationsInput | number
    passesCompleted?: IntFieldUpdateOperationsInput | number
    passesAttempted?: IntFieldUpdateOperationsInput | number
    tackles?: IntFieldUpdateOperationsInput | number
    interceptions?: IntFieldUpdateOperationsInput | number
    clearances?: IntFieldUpdateOperationsInput | number
    saves?: IntFieldUpdateOperationsInput | number
    cleanSheets?: IntFieldUpdateOperationsInput | number
    yellowCards?: IntFieldUpdateOperationsInput | number
    redCards?: IntFieldUpdateOperationsInput | number
    avgRating?: FloatFieldUpdateOperationsInput | number
    performanceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchSyncCreateInput = {
    id?: string
    matchId: string
    syncedAt?: Date | string
  }

  export type WorldCupMatchSyncUncheckedCreateInput = {
    id?: string
    matchId: string
    syncedAt?: Date | string
  }

  export type WorldCupMatchSyncUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchId?: StringFieldUpdateOperationsInput | string
    syncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchSyncUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchId?: StringFieldUpdateOperationsInput | string
    syncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchSyncCreateManyInput = {
    id?: string
    matchId: string
    syncedAt?: Date | string
  }

  export type WorldCupMatchSyncUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchId?: StringFieldUpdateOperationsInput | string
    syncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchSyncUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchId?: StringFieldUpdateOperationsInput | string
    syncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchCreateInput = {
    id: string
    matchDate: Date | string
    homeTeam: string
    awayTeam: string
    homeScore?: number
    awayScore?: number
    status?: string
    stage: string
    groupName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorldCupMatchUncheckedCreateInput = {
    id: string
    matchDate: Date | string
    homeTeam: string
    awayTeam: string
    homeScore?: number
    awayScore?: number
    status?: string
    stage: string
    groupName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorldCupMatchUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeScore?: IntFieldUpdateOperationsInput | number
    awayScore?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    groupName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeScore?: IntFieldUpdateOperationsInput | number
    awayScore?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    groupName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchCreateManyInput = {
    id: string
    matchDate: Date | string
    homeTeam: string
    awayTeam: string
    homeScore?: number
    awayScore?: number
    status?: string
    stage: string
    groupName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorldCupMatchUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeScore?: IntFieldUpdateOperationsInput | number
    awayScore?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    groupName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorldCupMatchUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeScore?: IntFieldUpdateOperationsInput | number
    awayScore?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    groupName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type WorldCupPlayerStatsCountOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    playerName?: SortOrder
    country?: SortOrder
    position?: SortOrder
    shirtNumber?: SortOrder
    matchesPlayed?: SortOrder
    minutesPlayed?: SortOrder
    goals?: SortOrder
    assists?: SortOrder
    shots?: SortOrder
    shotsOnTarget?: SortOrder
    passAccuracy?: SortOrder
    passesCompleted?: SortOrder
    passesAttempted?: SortOrder
    tackles?: SortOrder
    interceptions?: SortOrder
    clearances?: SortOrder
    saves?: SortOrder
    cleanSheets?: SortOrder
    yellowCards?: SortOrder
    redCards?: SortOrder
    avgRating?: SortOrder
    performanceScore?: SortOrder
    lastUpdated?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupPlayerStatsAvgOrderByAggregateInput = {
    shirtNumber?: SortOrder
    matchesPlayed?: SortOrder
    minutesPlayed?: SortOrder
    goals?: SortOrder
    assists?: SortOrder
    shots?: SortOrder
    shotsOnTarget?: SortOrder
    passAccuracy?: SortOrder
    passesCompleted?: SortOrder
    passesAttempted?: SortOrder
    tackles?: SortOrder
    interceptions?: SortOrder
    clearances?: SortOrder
    saves?: SortOrder
    cleanSheets?: SortOrder
    yellowCards?: SortOrder
    redCards?: SortOrder
    avgRating?: SortOrder
    performanceScore?: SortOrder
  }

  export type WorldCupPlayerStatsMaxOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    playerName?: SortOrder
    country?: SortOrder
    position?: SortOrder
    shirtNumber?: SortOrder
    matchesPlayed?: SortOrder
    minutesPlayed?: SortOrder
    goals?: SortOrder
    assists?: SortOrder
    shots?: SortOrder
    shotsOnTarget?: SortOrder
    passAccuracy?: SortOrder
    passesCompleted?: SortOrder
    passesAttempted?: SortOrder
    tackles?: SortOrder
    interceptions?: SortOrder
    clearances?: SortOrder
    saves?: SortOrder
    cleanSheets?: SortOrder
    yellowCards?: SortOrder
    redCards?: SortOrder
    avgRating?: SortOrder
    performanceScore?: SortOrder
    lastUpdated?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupPlayerStatsMinOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    playerName?: SortOrder
    country?: SortOrder
    position?: SortOrder
    shirtNumber?: SortOrder
    matchesPlayed?: SortOrder
    minutesPlayed?: SortOrder
    goals?: SortOrder
    assists?: SortOrder
    shots?: SortOrder
    shotsOnTarget?: SortOrder
    passAccuracy?: SortOrder
    passesCompleted?: SortOrder
    passesAttempted?: SortOrder
    tackles?: SortOrder
    interceptions?: SortOrder
    clearances?: SortOrder
    saves?: SortOrder
    cleanSheets?: SortOrder
    yellowCards?: SortOrder
    redCards?: SortOrder
    avgRating?: SortOrder
    performanceScore?: SortOrder
    lastUpdated?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupPlayerStatsSumOrderByAggregateInput = {
    shirtNumber?: SortOrder
    matchesPlayed?: SortOrder
    minutesPlayed?: SortOrder
    goals?: SortOrder
    assists?: SortOrder
    shots?: SortOrder
    shotsOnTarget?: SortOrder
    passAccuracy?: SortOrder
    passesCompleted?: SortOrder
    passesAttempted?: SortOrder
    tackles?: SortOrder
    interceptions?: SortOrder
    clearances?: SortOrder
    saves?: SortOrder
    cleanSheets?: SortOrder
    yellowCards?: SortOrder
    redCards?: SortOrder
    avgRating?: SortOrder
    performanceScore?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type WorldCupMatchSyncCountOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    syncedAt?: SortOrder
  }

  export type WorldCupMatchSyncMaxOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    syncedAt?: SortOrder
  }

  export type WorldCupMatchSyncMinOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    syncedAt?: SortOrder
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type WorldCupMatchCountOrderByAggregateInput = {
    id?: SortOrder
    matchDate?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    status?: SortOrder
    stage?: SortOrder
    groupName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupMatchAvgOrderByAggregateInput = {
    homeScore?: SortOrder
    awayScore?: SortOrder
  }

  export type WorldCupMatchMaxOrderByAggregateInput = {
    id?: SortOrder
    matchDate?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    status?: SortOrder
    stage?: SortOrder
    groupName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupMatchMinOrderByAggregateInput = {
    id?: SortOrder
    matchDate?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    status?: SortOrder
    stage?: SortOrder
    groupName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorldCupMatchSumOrderByAggregateInput = {
    homeScore?: SortOrder
    awayScore?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}