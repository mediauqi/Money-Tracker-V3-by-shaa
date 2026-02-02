import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-4053ac61/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint - creates a new user
app.post("/make-server-4053ac61/signup", async (c) => {
  try {
    const { username, password, emoji } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    // Check if username already exists
    const existingUser = await kv.get(`user:${username}`);
    if (existingUser) {
      return c.json({ error: "Username already exists" }, 400);
    }

    // Create user
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      username,
      password, // In a real app, hash this!
      emoji: emoji || "😊",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${username}`, user);
    await kv.set(`userid:${userId}`, username);

    // Initialize user balance
    await kv.set(`balance:${userId}`, {
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0,
    });

    return c.json({ 
      success: true, 
      user: { id: userId, username, emoji: user.emoji }
    });
  } catch (error) {
    console.error("Error during signup:", error);
    return c.json({ error: "Signup failed", details: String(error) }, 500);
  }
});

// Sign in endpoint
app.post("/make-server-4053ac61/signin", async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    const user = await kv.get(`user:${username}`);
    
    if (!user || user.password !== password) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    return c.json({ 
      success: true, 
      user: { id: user.id, username: user.username, emoji: user.emoji }
    });
  } catch (error) {
    console.error("Error during signin:", error);
    return c.json({ error: "Signin failed", details: String(error) }, 500);
  }
});

// Get user profile
app.get("/make-server-4053ac61/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const username = await kv.get(`userid:${userId}`);
    
    if (!username) {
      return c.json({ error: "User not found" }, 404);
    }

    const user = await kv.get(`user:${username}`);
    const balance = await kv.get(`balance:${userId}`) || { balance: 0, totalIncome: 0, totalExpenses: 0 };

    return c.json({
      id: user.id,
      username: user.username,
      emoji: user.emoji,
      balance: balance.balance,
      totalIncome: balance.totalIncome,
      totalExpenses: balance.totalExpenses,
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    return c.json({ error: "Failed to get profile", details: String(error) }, 500);
  }
});

// Update user emoji
app.put("/make-server-4053ac61/profile/:userId/emoji", async (c) => {
  try {
    const userId = c.req.param("userId");
    const { emoji } = await c.req.json();
    
    const username = await kv.get(`userid:${userId}`);
    if (!username) {
      return c.json({ error: "User not found" }, 404);
    }

    const user = await kv.get(`user:${username}`);
    user.emoji = emoji;
    await kv.set(`user:${username}`, user);

    return c.json({ success: true, emoji });
  } catch (error) {
    console.error("Error updating emoji:", error);
    return c.json({ error: "Failed to update emoji", details: String(error) }, 500);
  }
});

// Get balance
app.get("/make-server-4053ac61/balance/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const balance = await kv.get(`balance:${userId}`) || { balance: 0, totalIncome: 0, totalExpenses: 0 };
    return c.json(balance);
  } catch (error) {
    console.error("Error getting balance:", error);
    return c.json({ error: "Failed to get balance", details: String(error) }, 500);
  }
});

// Add transaction (income or expense)
app.post("/make-server-4053ac61/transaction/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const { type, amount, description, category, date } = await c.req.json();
    
    if (!type || !amount || amount <= 0) {
      return c.json({ error: "Valid type and amount are required" }, 400);
    }

    // Create transaction
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      userId,
      type, // 'income' or 'expense'
      amount: parseFloat(amount),
      description: description || "",
      category: category || "",
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await kv.set(`transaction:${transactionId}`, transaction);

    // Update balance
    const balance = await kv.get(`balance:${userId}`) || { balance: 0, totalIncome: 0, totalExpenses: 0 };
    
    if (type === "income") {
      balance.balance += transaction.amount;
      balance.totalIncome += transaction.amount;
    } else if (type === "expense") {
      balance.balance -= transaction.amount;
      balance.totalExpenses += transaction.amount;
    }

    await kv.set(`balance:${userId}`, balance);

    return c.json({ success: true, transaction, balance });
  } catch (error) {
    console.error("Error adding transaction:", error);
    return c.json({ error: "Failed to add transaction", details: String(error) }, 500);
  }
});

// Get all transactions for a user
app.get("/make-server-4053ac61/transactions/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const allTransactions = await kv.getByPrefix("transaction:");
    
    const userTransactions = allTransactions
      .filter((t: any) => t.userId === userId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return c.json(userTransactions);
  } catch (error) {
    console.error("Error getting transactions:", error);
    return c.json({ error: "Failed to get transactions", details: String(error) }, 500);
  }
});

// Delete transaction
app.delete("/make-server-4053ac61/transaction/:transactionId", async (c) => {
  try {
    const transactionId = c.req.param("transactionId");
    const transaction = await kv.get(`transaction:${transactionId}`);
    
    if (!transaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    // Update balance
    const balance = await kv.get(`balance:${transaction.userId}`) || { balance: 0, totalIncome: 0, totalExpenses: 0 };
    
    if (transaction.type === "income") {
      balance.balance -= transaction.amount;
      balance.totalIncome -= transaction.amount;
    } else if (transaction.type === "expense") {
      balance.balance += transaction.amount;
      balance.totalExpenses -= transaction.amount;
    }

    await kv.set(`balance:${transaction.userId}`, balance);
    await kv.del(`transaction:${transactionId}`);

    return c.json({ success: true, balance });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return c.json({ error: "Failed to delete transaction", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
