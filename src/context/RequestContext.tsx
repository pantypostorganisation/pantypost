// src/context/RequestContext.tsx
"use client";

/* =====================================================================
 * WHY THIS FILE CHANGED
 *
 * This context used to be the only place custom requests existed. It kept
 * them in React state and persisted to `panty_custom_requests` via
 * storageService — and storage.service.ts lists that key under
 * SESSION_ONLY, so it went to sessionStorage.
 *
 * The result was that a request lived only in the tab of the person who
 * created it:
 *
 *   - The buyer created a request. A chat message went to the backend, so
 *     the seller saw the message — but the request *object*, which carries
 *     status and whose turn it is, stayed in the buyer's tab.
 *   - The seller's getRequestsForUser(seller, 'seller') read their own
 *     sessionStorage, found nothing, and rendered no Accept / Decline /
 *     counter-offer controls at all.
 *   - addRequest was called in exactly one place (useBuyerMessages), so
 *     the seller side never even created a local record.
 *   - Closing the tab wiped every request the buyer had made.
 *
 * The negotiation could therefore never complete between two real people.
 *
 * Requests now live in Mongo behind /api/custom-requests, and the server
 * enforces turn-taking against `pendingWith`. The public shape of this
 * context is deliberately unchanged so the existing hooks keep working —
 * the methods just became async and now reconcile against the server.
 * ===================================================================== */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  customRequestsService,
  getThreadId,
  type CustomRequest,
  type RequestStatus,
} from "@/services/customRequests.service";

// Re-exported so existing imports from this module keep resolving.
export type { CustomRequest, RequestStatus };

type RequestContextType = {
  requests: CustomRequest[];
  setRequests: React.Dispatch<React.SetStateAction<CustomRequest[]>>;
  addRequest: (req: Partial<CustomRequest> & { id: string; seller: string }) => Promise<CustomRequest | null>;
  getRequestsForUser: (username: string, role: "buyer" | "seller") => CustomRequest[];
  getRequestById: (id: string) => CustomRequest | undefined;
  respondToRequest: (
    id: string,
    status: RequestStatus,
    response?: string,
    updateFields?: Partial<Pick<CustomRequest, "title" | "price" | "tags" | "description">>,
    modifiedBy?: string
  ) => Promise<boolean>;
  markRequestAsPaid: (id: string, orderId?: string) => Promise<boolean>;
  getActiveRequestsForThread: (buyer: string, seller: string) => CustomRequest[];
  getLatestRequestInThread: (buyer: string, seller: string) => CustomRequest | undefined;
  refreshRequests: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const useRequests = () => {
  const ctx = useContext(RequestContext);
  if (!ctx) throw new Error("useRequests must be used within a RequestProvider");
  return ctx;
};

export const RequestProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against two loads racing and the slower one winning.
  const loadIdRef = useRef(0);

  const refreshRequests = useCallback(async () => {
    if (!user?.username) {
      setRequests([]);
      return;
    }

    const loadId = ++loadIdRef.current;
    setIsLoading(true);

    try {
      const list = await customRequestsService.list();
      // A newer load started while we were waiting — discard this result.
      if (loadId !== loadIdRef.current) return;
      setRequests(list);
      setError(null);
    } catch (err) {
      if (loadId !== loadIdRef.current) return;
      console.error("[RequestContext] Failed to load requests:", err);
      setError("Could not load custom requests");
    } finally {
      if (loadId === loadIdRef.current) setIsLoading(false);
    }
  }, [user?.username]);

  // Load on sign-in, clear on sign-out.
  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  /* There is no websocket event for request changes yet, so the other
     party's accept/decline would otherwise not appear until a full
     reload. Refreshing when the tab regains focus is the cheap version of
     that — the messages hooks already use the same trick. */
  useEffect(() => {
    if (!user?.username) return;

    const onFocus = () => {
      if (document.visibilityState === "visible") refreshRequests();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user?.username, refreshRequests]);

  /** Merge one server record into local state, replacing any existing copy. */
  const upsert = useCallback((req: CustomRequest) => {
    setRequests((prev) => {
      const index = prev.findIndex((r) => r.id === req.id);
      if (index === -1) return [req, ...prev];
      const next = [...prev];
      next[index] = req;
      return next;
    });
  }, []);

  const addRequest = useCallback(
    async (req: Partial<CustomRequest> & { id: string; seller: string }) => {
      const result = await customRequestsService.create({
        id: req.id,
        seller: req.seller,
        title: req.title || "",
        description: req.description || "",
        price: Number(req.price) || 0,
        tags: req.tags || [],
        originalMessageId: req.originalMessageId || req.id,
      });

      if (result.success && result.data) {
        upsert(result.data);
        setError(null);
        return result.data;
      }

      console.error("[RequestContext] Create failed:", result.message);
      setError(result.message || "Could not create request");
      return null;
    },
    [upsert]
  );

  const getRequestsForUser = useCallback(
    (username: string, role: "buyer" | "seller") => requests.filter((r) => r[role] === username),
    [requests]
  );

  const getRequestById = useCallback((id: string) => requests.find((r) => r.id === id), [requests]);

  const markRequestAsPaid = useCallback(
    async (id: string, orderId?: string) => {
      const result = await customRequestsService.markPaid(id, orderId);

      if (result.success && result.data) {
        upsert(result.data);
        setError(null);
        return true;
      }

      console.error("[RequestContext] Mark paid failed:", result.message);
      setError(result.message || "Could not mark request as paid");
      refreshRequests();
      return false;
    },
    [upsert, refreshRequests]
  );

  /**
   * Signature kept from the original so useBuyerMessages / useSellerMessages
   * need no changes. `modifiedBy` is now ignored — the server takes the
   * actor from the auth token, which is the only trustworthy source.
   */
  const respondToRequest = useCallback(
    async (
      id: string,
      status: RequestStatus,
      response?: string,
      updateFields?: Partial<Pick<CustomRequest, "title" | "price" | "tags" | "description">>,
      modifiedBy?: string
    ) => {
      // The server derives the actor from the auth token, so this argument
      // no longer decides anything. Callers still pass it; warn in dev if
      // it disagrees, since that means a caller still believes the client
      // gets to choose who acted.
      if (process.env.NODE_ENV === "development" && modifiedBy && user?.username && modifiedBy !== user.username) {
        console.warn(
          `[RequestContext] respondToRequest called with modifiedBy="${modifiedBy}" but the signed-in user is "${user.username}". The server uses the token, so this argument is ignored.`
        );
      }

      if (status === "paid") {
        // Payment has its own endpoint with its own guards.
        return markRequestAsPaid(id);
      }

      if (status !== "accepted" && status !== "rejected" && status !== "edited") {
        console.error("[RequestContext] Unsupported status:", status);
        return false;
      }

      const result = await customRequestsService.respond(id, {
        status,
        response,
        title: updateFields?.title,
        description: updateFields?.description,
        price: updateFields?.price,
        tags: updateFields?.tags,
      });

      if (result.success && result.data) {
        upsert(result.data);
        setError(null);
        return true;
      }

      // A 409 here is the server refusing an out-of-turn action. Surface
      // it and re-sync, because our copy is evidently behind.
      console.error("[RequestContext] Respond failed:", result.message);
      setError(result.message || "Could not update request");
      refreshRequests();
      return false;
    },
    [upsert, refreshRequests, markRequestAsPaid, user?.username]
  );

  const getActiveRequestsForThread = useCallback(
    (buyer: string, seller: string) => {
      const key = getThreadId(buyer, seller);
      return requests.filter(
        (r) =>
          (r.threadId === key || r.messageThreadId === key) &&
          r.status !== "rejected" &&
          r.status !== "paid"
      );
    },
    [requests]
  );

  const getLatestRequestInThread = useCallback(
    (buyer: string, seller: string) => {
      const key = getThreadId(buyer, seller);
      return requests
        .filter((r) => r.threadId === key || r.messageThreadId === key)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
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
        refreshRequests,
        isLoading,
        error,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};
