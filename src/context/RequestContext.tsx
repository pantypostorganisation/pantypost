// src/context/RequestContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { storageService } from "@/services";
import { sanitizeStrict, sanitizeUsername } from "@/utils/security/sanitization";
import { messageSchemas } from "@/utils/validation/schemas";
import { z } from "zod";

export type RequestStatus = "pending" | "accepted" | "rejected" | "edited" | "paid";

export type CustomRequest = {
  id: string;
  buyer: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: RequestStatus;
  date: string;
  response?: string;
  paid?: boolean;

  // Message-linked flow
  messageThreadId?: string; // Conversation key
  lastModifiedBy?: string;
  originalMessageId?: string;
  lastEditedBy?: string;
  pendingWith?: string;
};

// --- Validation schemas ---
const requestSchema = z.object({
  title: messageSchemas.customRequest.shape.title,
  description: messageSchemas.customRequest.shape.description,
  price: messageSchemas.customRequest.shape.price,
  tags: z.array(z.string().max(30)).max(10).optional(),
});

const responseSchema = z.string().min(1).max(500);

// --- Helpers ---
const STORAGE_KEY = "panty_custom_requests";

// Keep thread IDs consistent with MessageContext (sorted usernames)
const getConversationKey = (a: string, b: string) =>
  [a, b].map((u) => (sanitizeUsername(u) || "").trim()).sort().join("-");

// Normalize + sanitize a request object safely
const normalizeRequest = (req: CustomRequest): CustomRequest => {
  const buyer = sanitizeUsername(req.buyer) || req.buyer;
  const seller = sanitizeUsername(req.seller) || req.seller;

  const validated = requestSchema.safeParse({
    title: req.title,
    description: req.description,
    price: req.price,
    tags: req.tags,
  });

  // If validation fails, keep best-effort sanitized values (prevents throw inside context)
  const safeTitle = sanitizeStrict(validated.success ? validated.data.title : req.title || "");
  const safeDesc = sanitizeStrict(validated.success ? validated.data.description : req.description || "");
  const safePrice = validated.success ? validated.data.price : Number(req.price) || 0;
  const safeTags =
    (validated.success ? validated.data.tags : req.tags) ? (validated.success ? validated.data.tags : req.tags)!.map((t) => sanitizeStrict(t).slice(0, 30)) : [];

  const threadId = req.messageThreadId || getConversationKey(buyer, seller);

  return {
    ...req,
    buyer,
    seller,
    title: safeTitle,
    description: safeDesc,
    price: safePrice,
    tags: safeTags,
    messageThreadId: threadId,
    lastModifiedBy: sanitizeUsername(req.lastModifiedBy || buyer) || buyer,
    originalMessageId: req.originalMessageId || req.id,
    lastEditedBy: sanitizeUsername(req.lastEditedBy || buyer) || buyer,
    pendingWith: sanitizeUsername(req.pendingWith || seller) || seller,
  };
};

type RequestContextType = {
  requests: CustomRequest[];
  setRequests: React.Dispatch<React.SetStateAction<CustomRequest[]>>;
  addRequest: (req: CustomRequest) => void;
  getRequestsForUser: (username: string, role: "buyer" | "seller") => CustomRequest[];
  getRequestById: (id: string) => CustomRequest | undefined;
  respondToRequest: (
    id: string,
    status: RequestStatus,
    response?: string,
    updateFields?: Partial<Pick<CustomRequest, "title" | "price" | "tags" | "description">>,
    modifiedBy?: string
  ) => void;
  markRequestAsPaid: (id: string) => void;
  getActiveRequestsForThread: (buyer: string, seller: string) => CustomRequest[];
  getLatestRequestInThread: (buyer: string, seller: string) => CustomRequest | undefined;
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const useRequests = () => {
  const ctx = useContext(RequestContext);
  if (!ctx) throw new Error("useRequests must be used within a RequestProvider");
  return ctx;
};

export const RequestProvider = ({ children }: { children: React.ReactNode }) => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === "undefined" || isInitialized) return;

      try {
        const stored = await storageService.getItem<CustomRequest[]>(STORAGE_KEY, []);
        const sanitized = (stored || []).map((raw: any) =>
          normalizeRequest({
            ...raw,
            // defaults if missing (keeps backward compat)
            response: raw.response ? sanitizeStrict(raw.response) : undefined,
            messageThreadId: raw.messageThreadId || getConversationKey(raw.buyer, raw.seller),
            lastModifiedBy: raw.lastModifiedBy || raw.buyer,
            originalMessageId: raw.originalMessageId || raw.id,
            lastEditedBy: raw.lastEditedBy || raw.buyer,
            pendingWith: raw.pendingWith || raw.seller,
          })
        );
        setRequests(sanitized);
      } catch (err) {
        console.error("[RequestContext] Failed to load:", err);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, [isInitialized]);

  // Persist on change
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized) {
      storageService.setItem(STORAGE_KEY, requests).catch((e) =>
        console.error("[RequestContext] Persist error:", e)
      );
    }
  }, [requests, isInitialized]);

  // --- Actions ---
  const addRequest = useCallback((req: CustomRequest) => {
    // Validate incoming request first
    const validation = requestSchema.safeParse({
      title: req.title,
      description: req.description,
      price: req.price,
      tags: req.tags,
    });

    if (!validation.success) {
      console.error("[RequestContext] Invalid request data:", validation.error);
      return;
    }

    const sanitized = normalizeRequest({
      ...req,
      title: validation.data.title,
      description: validation.data.description,
      price: validation.data.price,
      tags: validation.data.tags || [],
    });

    setRequests((prev) => {
      // Deduplicate by id; if exists, treat as update
      const exists = prev.some((r) => r.id === sanitized.id);
      if (exists) {
        return prev.map((r) => (r.id === sanitized.id ? { ...r, ...sanitized } : r));
      }
      return [...prev, sanitized];
    });
  }, []);

  const getRequestsForUser = useCallback(
    (username: string, role: "buyer" | "seller") => {
      const u = sanitizeUsername(username) || username;
      return requests.filter((r) => r[role] === u);
    },
    [requests]
  );

  const getRequestById = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests]
  );

  const respondToRequest = useCallback(
    (
      id: string,
      status: RequestStatus,
      response?: string,
      updateFields?: Partial<Pick<CustomRequest, "title" | "price" | "tags" | "description">>,
      modifiedBy?: string
    ) => {
      // Validate response if present
      if (response) {
        const resVal = responseSchema.safeParse(response);
        if (!resVal.success) {
          console.error("[RequestContext] Invalid response:", resVal.error);
          return;
        }
      }

      // Validate updates if present
      if (updateFields) {
        const updVal = requestSchema.partial().safeParse(updateFields);
        if (!updVal.success) {
          console.error("[RequestContext] Invalid update fields:", updVal.error);
          return;
        }
      }

      const editor = sanitizeUsername(modifiedBy || "") || modifiedBy;

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;

          // Determine pendingWith / lastEditedBy
          let pendingWith = r.pendingWith;
          let lastEditedBy = r.lastEditedBy;

          if (status === "edited" && editor) {
            // If edited, hand over to the other party
            pendingWith = editor === r.buyer ? r.seller : r.buyer;
            lastEditedBy = editor;
          } else if (status === "accepted" || status === "rejected") {
            pendingWith = undefined;
          }

          // Apply sanitized updates
          const updated: CustomRequest = {
            ...r,
            status,
            response: response ? sanitizeStrict(response) : r.response,
            lastModifiedBy: editor || r.lastModifiedBy,
            lastEditedBy: status === "edited" ? lastEditedBy : r.lastEditedBy,
            pendingWith,
            ...(updateFields
              ? {
                  title: updateFields.title ? sanitizeStrict(updateFields.title) : r.title,
                  description: updateFields.description ? sanitizeStrict(updateFields.description) : r.description,
                  price: typeof updateFields.price === "number" ? updateFields.price : r.price,
                  tags: updateFields.tags
                    ? updateFields.tags.map((t) => sanitizeStrict(t).slice(0, 30))
                    : r.tags,
                }
              : {}),
          };

          return normalizeRequest(updated); // ensure threadId & names remain normalized
        })
      );
    },
    []
  );

  const markRequestAsPaid = useCallback((id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "paid",
              paid: true,
              pendingWith: undefined,
            }
          : r
      )
    );
  }, []);

  const getActiveRequestsForThread = useCallback(
    (buyer: string, seller: string) => {
      const key = getConversationKey(buyer, seller);
      return requests.filter(
        (r) =>
          r.messageThreadId === key &&
          r.status !== "rejected" &&
          r.status !== "paid"
      );
    },
    [requests]
  );

  const getLatestRequestInThread = useCallback(
    (buyer: string, seller: string) => {
      const key = getConversationKey(buyer, seller);
      const thread = requests
        .filter((r) => r.messageThreadId === key)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return thread[0];
    },
    [requests]
  );

  return (
    <RequestContext.Provider
      value={{
        requests,
        setRequests,
        addRequest,
        getRequestsForUser,
        getRequestById,
        respondToRequest,
        markRequestAsPaid,
        getActiveRequestsForThread,
        getLatestRequestInThread,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};
