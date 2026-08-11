// src/services/deliveryAddress.service.ts
import { apiCall } from './api.config';
import type { DeliveryAddress } from '@/types/order';

/* =====================================================================
 * The buyer's saved shipping address.
 *
 * Stored on the USER, not per order, which is what makes the rest work:
 *   - captured once after the first bid, so re-bidding never asks again
 *   - auction settlement can attach it to the winning order
 *   - checkout prefills it, so repeat buyers confirm instead of retyping
 *
 * Orders still take their own copy at purchase time. An order has to
 * record where it was actually sent, and must not change if the buyer
 * later moves house.
 * ===================================================================== */

/* Re-exported, not redefined. `@/types/order` already owns this shape and
   AddressConfirmationModal is typed against it; declaring a second
   DeliveryAddress here would have let the two drift apart -- which is
   exactly how `state` ended up optional in one and required in the
   other. */
export type { DeliveryAddress } from '@/types/order';

/* Complete by the platform's own definition: the same fields
   AddressConfirmationModal validates, the DeliveryAddress type requires,
   and PUT /api/orders/:id/address enforces. Keeping these in step matters
   -- if checkout thought an address was complete and the order route
   disagreed, the failure would land after the buyer pressed Confirm. */
export function isCompleteAddress(address?: DeliveryAddress | null): boolean {
  if (!address) return false;
  return Boolean(
    address.fullName &&
      address.addressLine1 &&
      address.city &&
      address.state &&
      address.postalCode &&
      address.country
  );
}

class DeliveryAddressService {
  /* One in-memory copy per session. The post-bid prompt asks "do we have
     an address?" on every bid, and that should not become a round trip
     each time. Cleared by save() so it can never go stale. */
  private cached: DeliveryAddress | null | undefined;

  async get(force = false): Promise<DeliveryAddress | null> {
    if (!force && this.cached !== undefined) {
      return this.cached;
    }

    try {
      const response = await apiCall<{ deliveryAddress: DeliveryAddress | null }>(
        '/profilebuyer'
      );

      if (response.success && response.data) {
        this.cached = response.data.deliveryAddress ?? null;
        return this.cached;
      }
    } catch (error) {
      console.error('[DeliveryAddress] Failed to load address:', error);
    }

    // Deliberately NOT cached on failure: a network blip should not make
    // the app believe the buyer has no address and prompt them again.
    return null;
  }

  async save(address: DeliveryAddress): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall<{ deliveryAddress: DeliveryAddress }>(
        '/profilebuyer/delivery-address',
        {
          method: 'PUT',
          body: JSON.stringify(address),
        }
      );

      if (response.success && response.data) {
        this.cached = response.data.deliveryAddress;
        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Could not save your address',
      };
    } catch (error) {
      console.error('[DeliveryAddress] Failed to save address:', error);
      return { success: false, error: 'Could not save your address' };
    }
  }

  /** Call on logout: the next account must not inherit this one's address. */
  clear(): void {
    this.cached = undefined;
  }
}

export const deliveryAddressService = new DeliveryAddressService();
export default deliveryAddressService;
