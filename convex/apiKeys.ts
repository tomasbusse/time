"use node";

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import crypto from "crypto";

// Secure at-rest encryption for user API keys using AES-256-GCM.
// Set a base64-encoded 32-byte key via Convex env:
//   convex env set <deployment> API_KEYS_MASTER_KEY <base64-32-bytes>
// For backwards compatibility, we also accept API_KEY_ENCRYPTION_KEY.
const MASTER_KEY_B64 = process.env.API_KEYS_MASTER_KEY || process.env.API_KEY_ENCRYPTION_KEY;

if (!MASTER_KEY_B64) {
  console.warn("API_KEYS_MASTER_KEY is not set. API keys will be stored unencrypted.");
}

// AES-256-GCM encryption/decryption helpers with versioned payloads
const getKey = (): Buffer | null => {
  if (!MASTER_KEY_B64) return null;
  try {
    const key = Buffer.from(MASTER_KEY_B64, "base64");
    if (key.length !== 32) {
      console.warn("API_KEYS_MASTER_KEY must be 32 bytes (base64 encoded). Falling back to plaintext storage.");
      return null;
    }
    return key;
  } catch (e) {
    console.warn("Invalid API_KEYS_MASTER_KEY base64. Falling back to plaintext storage.");
    return null;
  }
};

const encrypt = (text: string) => {
  const key = getKey();
  if (!key) return text; // store plaintext if key missing (dev fallback)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${ciphertext.toString("base64")}:${tag.toString("base64")}`;
};

const decrypt = (blob: string) => {
  const key = getKey();
  if (!blob.startsWith("v1:")) {
    // Legacy support: if a legacy XOR key is set, attempt to decode
    const legacyKey = process.env.API_KEY_ENCRYPTION_KEY;
    if (legacyKey) {
      let result = "";
      for (let i = 0; i < blob.length; i++) {
        result += String.fromCharCode(blob.charCodeAt(i) ^ legacyKey.charCodeAt(i % legacyKey.length));
      }
      return result;
    }
    // Otherwise assume plaintext
    return blob;
  }
  if (!key) return blob; // cannot decode without master key
  const [, ivB64, ctB64, tagB64] = blob.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
};

export const saveApiKey = action({
  args: {
    serviceName: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, { serviceName, apiKey }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    const user = await ctx.runQuery(api.users.getUserByEmail, { email: identity.email! });
    if (!user) {
      throw new Error("User not found");
    }

    // Use internal query to get existing API key
    const keys = await ctx.runQuery(internal.internal.getUserApiKeys, { userId: user._id });
    const existing = keys.find((k: any) => k.serviceName === serviceName);

    const encryptedKey = encrypt(apiKey);
    const now = Date.now();

    if (existing) {
      await ctx.runMutation(internal.internal.updateApiKey, {
        apiKeyId: existing._id,
        apiKey: encryptedKey,
        updatedAt: now,
      });
    } else {
      await ctx.runMutation(internal.internal.insertApiKey, {
        userId: user._id,
        serviceName,
        apiKey: encryptedKey,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getApiKeys = action({
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const user = await ctx.runQuery(api.users.getUserByEmail, { email: identity.email! });
    if (!user) {
      return [];
    }

    // We need to create an internal query for this since we can't access db directly in actions
    const keys: any[] = await ctx.runQuery(internal.internal.getUserApiKeys, { userId: user._id });
      
    // Return a version of the keys without the actual key value for security
    return keys.map((k: any) => ({
        _id: k._id,
        serviceName: k.serviceName,
        isActive: k.isActive,
        lastTested: k.lastTested,
        testStatus: k.testStatus,
        testError: k.testError,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
        hasKey: !!k.apiKey,
    }));
  },
});

type ApiServiceConfig = {
    testEndpoint: string;
    testMethod: "GET" | "POST";
    getHeaders: (apiKey: string) => Record<string, string>;
    testBody?: any;
};

const API_SERVICES_CONFIG: Record<string, ApiServiceConfig> = {
  openrouter: {
    testEndpoint: "https://openrouter.ai/api/v1/models",
    testMethod: "GET",
    getHeaders: (apiKey: string) => ({ "Authorization": `Bearer ${apiKey}` }),
  },
  resend: {
    testEndpoint: "https://api.resend.com/domains",
    testMethod: "GET",
    getHeaders: (apiKey: string) => ({ "Authorization": `Bearer ${apiKey}` }),
  },
  openai: {
    testEndpoint: "https://api.openai.com/v1/models",
    testMethod: "GET",
    getHeaders: (apiKey: string) => ({ "Authorization": `Bearer ${apiKey}` }),
  },
  anthropic: {
    testEndpoint: "https://api.anthropic.com/v1/messages",
    testMethod: "POST",
    getHeaders: (apiKey: string) => ({
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    }),
    testBody: { "model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}] }
  },
  google: {
    testEndpoint: "https://www.googleapis.com/oauth2/v1/userinfo",
    testMethod: "GET",
    getHeaders: (apiKey: string) => ({ "Authorization": `Bearer ${apiKey}` }),
  },
  elevenlabs: {
    testEndpoint: "https://api.elevenlabs.io/v1/user",
    testMethod: "GET",
    getHeaders: (apiKey: string) => ({ "xi-api-key": apiKey }),
  }
};

export const testApiKey = action({
    args: {
        serviceName: v.string(),
    },
    handler: async (ctx, { serviceName }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          throw new Error("User not authenticated");
        }
        const user = await ctx.runQuery(api.users.getUserByEmail, { email: identity.email! });
        if (!user) {
          throw new Error("User not found");
        }

        // Use internal query to get API key
        const keys = await ctx.runQuery(internal.internal.getUserApiKeys, { userId: user._id });
        const apiKeyRecord = keys.find((k: any) => k.serviceName === serviceName);

        if (!apiKeyRecord) {
            throw new Error(`API key for ${serviceName} not found.`);
        }

        const apiKey = decrypt(apiKeyRecord.apiKey);
        const config = API_SERVICES_CONFIG[serviceName as keyof typeof API_SERVICES_CONFIG];

        if (!config) {
            throw new Error(`Configuration for service ${serviceName} not found.`);
        }

        let result = { success: false, status: 0, error: "Unknown error" };

        try {
            const response = await fetch(config.testEndpoint, {
                method: config.testMethod,
                headers: config.getHeaders(apiKey),
                body: config.testBody ? JSON.stringify(config.testBody) : undefined,
            });

            result = {
                success: response.ok,
                status: response.status,
                error: response.ok ? "" : await response.text(),
            };
        } catch (e: any) {
            result = { success: false, status: 500, error: e.message };
        }

        await ctx.runMutation(internal.internal.updateTestStatus, {
            apiKeyId: apiKeyRecord._id,
            testStatus: result.success ? "success" : "failed",
            testError: result.error,
            lastTested: Date.now(),
        });

        return result;
    }
});

export const getApiKey = action({
    args: {
        serviceName: v.string(),
    },
    handler: async (ctx: any, { serviceName }: { serviceName: string }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        const user = await ctx.runQuery(api.users.getUserByEmail, { email: identity.email! });
        if (!user) {
            return null;
        }
        // Use internal query for database access
        const keys: any[] = await ctx.runQuery(internal.internal.getUserApiKeys, { userId: user._id });
        return keys.find((k: any) => k.serviceName === serviceName) || null;
    }
});

export const updateTestStatus = action({
    args: {
        apiKeyId: v.id("apiKeys"),
        testStatus: v.union(v.literal("success"), v.literal("failed"), v.literal("untested")),
        testError: v.optional(v.string()),
    },
    handler: async (ctx, { apiKeyId, testStatus, testError }) => {
        await ctx.runMutation(internal.internal.updateTestStatus, {
            apiKeyId: apiKeyId,
            testStatus: testStatus,
            testError: testError,
            lastTested: Date.now(),
        });
    }
});