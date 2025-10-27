import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appEnv = import.meta.env.VITE_APP_ENV || 'development';
const mockData = import.meta.env.VITE_MOCK_DATA === 'true';

const usingMock = appEnv === 'development' && (!supabaseUrl || !supabaseAnonKey || mockData);

if (usingMock) {
  console.warn("⚠️ Running in mock mode - Supabase not configured");
}

type MockSubscription = { unsubscribe: () => void };
type MockAuth = {
  getSession: () => Promise<{ data: { session: unknown | null }; error: unknown | null }>;
  getUser: () => Promise<{ data: { user: unknown | null }; error: unknown | null }>;
  onAuthStateChange: () => { data: { subscription: MockSubscription } };
  signInWithPassword: () => Promise<{ data: { user: unknown; session: unknown }; error: { message: string } | null }>;
  signUp: () => Promise<{ data: { user: unknown; session: unknown }; error: { message: string } | null }>;
  signOut: () => Promise<{ error: unknown | null }>;
  resetPasswordForEmail: () => Promise<{ data: unknown; error: unknown | null }>;
};

type MockQueryResult = { data: unknown[]; error: null };
type MockSingleResult = { data: unknown; error: null };

type MockQueryBuilder = {
  select: (...args: unknown[]) => MockQueryBuilder;
  eq: (...args: unknown[]) => MockQueryBuilder;
  in: (...args: unknown[]) => MockQueryBuilder;
  order: (...args: unknown[]) => MockQueryBuilder;
  limit: (...args: unknown[]) => Promise<MockQueryResult>;
  single: () => Promise<MockSingleResult>;
} & PromiseLike<MockQueryResult>;

type MockInsertBuilder = {
  select: () => {
    single: () => Promise<MockSingleResult>;
  };
};

type MockTable = MockQueryBuilder & {
  insert: (...rows: unknown[]) => MockInsertBuilder;
};

type MockClient = {
  auth: MockAuth;
  from: (_table: string) => MockTable;
};

function createQueryPromise(): Promise<MockQueryResult> {
  return Promise.resolve({ data: [], error: null });
}

function createMockQueryBuilder(): MockQueryBuilder {
  const promise = createQueryPromise();
  const builder: Partial<MockQueryBuilder> = {};
  const self = builder as MockQueryBuilder;

  self.select = () => self;
  self.eq = () => self;
  self.in = () => self;
  self.order = () => self;
  self.limit = () => createQueryPromise();
  self.single = () => Promise.resolve({ data: null, error: null });
  self.then = (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected);

  return self;
}

function createMockTable(): MockTable {
  const query = createMockQueryBuilder();
  const table = Object.assign(query, {
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  });

  return table;
}

const mockSupabase: MockClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () =>
      Promise.resolve({
        data: { user: null, session: null },
        error: { message: "Mock mode - authentication disabled" },
      }),
    signUp: () =>
      Promise.resolve({
        data: { user: null, session: null },
        error: { message: "Mock mode - authentication disabled" },
      }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
  },
  from: () => createMockTable(),
};

export const isSupabaseMock = usingMock;

type RealSupabaseClient = SupabaseClient<unknown, unknown, unknown>;

export const supabase: RealSupabaseClient = usingMock
  ? (mockSupabase as unknown as RealSupabaseClient)
  : (() => {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
      }
      return createClient(supabaseUrl, supabaseAnonKey);
    })();
