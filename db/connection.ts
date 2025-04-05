import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

// A way to bypass TypeScript errors with global objects
// that works well with Next.js and TypeScript
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = { conn: null, promise: null };

// Only use the global cache in development
if (process.env.NODE_ENV === "development") {
  // @ts-ignore - Ignoring the TypeScript error for global mongoose
  if (!global._mongooseCache) {
    // @ts-ignore - Ignoring the TypeScript error for global mongoose
    global._mongooseCache = { conn: null, promise: null };
  }
  // @ts-ignore - Ignoring the TypeScript error for global mongoose
  cached = global._mongooseCache;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
