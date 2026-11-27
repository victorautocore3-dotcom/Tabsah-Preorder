import {
  FLUTTERWAVE_CURRENCY,
  FLUTTERWAVE_PUBLIC_KEY,
  FLUTTERWAVE_VERIFY_FUNCTION_URL,
} from '../config/flutterwave';
import { SUPABASE_PUBLISHABLE_KEY, supabase } from '../config/supabase';

const FLUTTERWAVE_SCRIPT_SRC = 'https://checkout.flutterwave.com/v3.js';

export interface FlutterwaveCallbackPayload {
  status?: string;
  transaction_id?: number | string;
  tx_ref?: string;
  flw_ref?: string;
  amount?: number;
  currency?: string;
}

interface FlutterwaveModalHandle {
  close?: () => void;
}

interface FlutterwaveCheckoutOptions {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    name: string;
    phone: string;
    phone_number: string;
  };
  customizations: {
    title: string;
    description: string;
  };
  callback: (data: FlutterwaveCallbackPayload) => void;
  onclose: (incomplete?: boolean) => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: FlutterwaveCheckoutOptions) => FlutterwaveModalHandle | void;
    closePaymentModal?: () => void;
  }
}

export interface OpenFlutterwaveParams {
  tx_ref: string;
  amount: number;
  customer: {
    email: string;
    name: string;
    phone: string;
  };
  description: string;
}

export type FlutterwaveModalOutcome =
  | {
      status: 'callback';
      transaction_id: string;
      tx_ref: string;
      rawStatus?: string;
    }
  | {
      status: 'closed';
    }
  | {
      status: 'load_error';
      error: string;
    };

const FLUTTERWAVE_LOAD_TIMEOUT_MS = 15000;

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Removes stuck Flutterwave overlays/iframes and restores page scrolling.
 * When removePreload is false, preserves a hidden healthy #flwpugpaidid preload iframe.
 */
export function cleanupFlutterwaveDom(options?: { removePreload?: boolean }): void {
  if (typeof document === 'undefined') return;
  const removePreload = options?.removePreload ?? true;

  try {
    const spinnerById = document.getElementById('rve_spinner_container_0999');
    if (spinnerById && spinnerById.parentNode) {
      spinnerById.parentNode.removeChild(spinnerById);
    }

    document.querySelectorAll('.spinner-container').forEach((el) => {
      if (
        el.id === 'rve_spinner_container_0999' ||
        el.querySelector('#rve_spinner_0999, .svg-spinner')
      ) {
        el.parentNode?.removeChild(el);
      }
    });

    const iframes = document.querySelectorAll<HTMLIFrameElement>(
      'iframe[name="checkout"], iframe#flwpugpaidid, iframe[src*="flutterwave.com"]'
    );
    iframes.forEach((frame) => {
      const isHiddenPreload =
        frame.id === 'flwpugpaidid' &&
        (frame.style.opacity === '0' || frame.style.zIndex === '-1');

      if (removePreload || !isHiddenPreload) {
        frame.parentNode?.removeChild(frame);
      }
    });

    if (document.body && document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
  } catch {
    // Cleanup is best-effort
  }
}

/**
 * Dynamically loads Flutterwave inline checkout v3.js once without duplicating the script tag.
 */
export function loadFlutterwaveScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Flutterwave checkout can only open in a browser.'));
  }

  if (typeof window.FlutterwaveCheckout === 'function') {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${FLUTTERWAVE_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      if (typeof window.FlutterwaveCheckout === 'function') {
        resolve();
        return;
      }
      if (existingScript.dataset.flwFailed === 'true') {
        existingScript.parentNode?.removeChild(existingScript);
      } else {
        const timeoutId = window.setTimeout(() => {
          scriptLoadPromise = null;
          reject(new Error('Flutterwave checkout script timed out. Please try again.'));
        }, FLUTTERWAVE_LOAD_TIMEOUT_MS);

        existingScript.addEventListener(
          'load',
          () => {
            window.clearTimeout(timeoutId);
            if (typeof window.FlutterwaveCheckout === 'function') {
              resolve();
            } else {
              existingScript.dataset.flwFailed = 'true';
              scriptLoadPromise = null;
              reject(new Error('Flutterwave checkout failed to initialize.'));
            }
          },
          { once: true }
        );
        existingScript.addEventListener(
          'error',
          () => {
            window.clearTimeout(timeoutId);
            existingScript.dataset.flwFailed = 'true';
            scriptLoadPromise = null;
            reject(new Error('Could not load Flutterwave checkout script.'));
          },
          { once: true }
        );
        return;
      }
    }

    const script = document.createElement('script');
    script.src = FLUTTERWAVE_SCRIPT_SRC;
    script.async = true;

    const timeoutId = window.setTimeout(() => {
      script.dataset.flwFailed = 'true';
      scriptLoadPromise = null;
      reject(new Error('Flutterwave checkout script timed out. Please try again.'));
    }, FLUTTERWAVE_LOAD_TIMEOUT_MS);

    script.onload = () => {
      window.clearTimeout(timeoutId);
      if (typeof window.FlutterwaveCheckout === 'function') {
        resolve();
      } else {
        script.dataset.flwFailed = 'true';
        scriptLoadPromise = null;
        reject(new Error('Flutterwave checkout failed to initialize.'));
      }
    };
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      script.dataset.flwFailed = 'true';
      scriptLoadPromise = null;
      reject(new Error('Could not load Flutterwave checkout script.'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Opens the Flutterwave checkout modal and resolves with either the callback payload
 * (which MUST still be verified on the server) or a closed/error state.
 */
export async function openFlutterwaveCheckout(
  params: OpenFlutterwaveParams
): Promise<FlutterwaveModalOutcome> {
  const cleanTxRef = String(params.tx_ref ?? '').trim();
  const cleanAmount = Number(params.amount);
  const cleanEmail = String(params.customer.email ?? '').trim();
  const cleanName = String(params.customer.name ?? '').trim() || 'Customer';
  const cleanPhone = String(params.customer.phone ?? '').trim();
  const cleanDescription = String(params.description ?? '').trim() || 'Pre-order payment';

  if (!cleanTxRef) {
    return {
      status: 'load_error',
      error: 'Missing payment reference. Please try again.',
    };
  }
  if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
    return {
      status: 'load_error',
      error: 'Invalid payment amount for this order. Please refresh and try again.',
    };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      status: 'load_error',
      error: 'Your account email is missing or invalid. Please check your account details and try again.',
    };
  }

  try {
    await loadFlutterwaveScript();
  } catch (err) {
    cleanupFlutterwaveDom({ removePreload: true });
    return {
      status: 'load_error',
      error:
        err instanceof Error
          ? err.message
          : 'Could not open Flutterwave checkout. Please check your connection and try again.',
    };
  }

  if (typeof window.FlutterwaveCheckout !== 'function') {
    cleanupFlutterwaveDom({ removePreload: true });
    return {
      status: 'load_error',
      error: 'Flutterwave checkout is currently unavailable. Please try again.',
    };
  }

  // Clear any leftover broken overlay or visible stale checkout iframe before opening a new modal.
  cleanupFlutterwaveDom({ removePreload: false });

  const existingPreloadEl = document.getElementById('flwpugpaidid');
  const preloadFrameWindow =
    existingPreloadEl instanceof HTMLIFrameElement ? existingPreloadEl.contentWindow : null;

  return new Promise<FlutterwaveModalOutcome>((resolve) => {
    let settled = false;
    let modalReady = false;
    let modalHandle: FlutterwaveModalHandle | void;
    let loadTimeoutId: number | null = null;
    let observer: MutationObserver | null = null;

    const cleanupListeners = () => {
      if (loadTimeoutId !== null) {
        window.clearTimeout(loadTimeoutId);
        loadTimeoutId = null;
      }
      window.removeEventListener('message', handleWindowMessage);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };

    const closeModalBestEffort = () => {
      try {
        if (modalHandle && typeof modalHandle.close === 'function') {
          modalHandle.close();
        } else if (typeof window.closePaymentModal === 'function') {
          window.closePaymentModal();
        }
      } catch {
        // Modal close cleanup is best-effort
      }
    };

    const finish = (outcome: FlutterwaveModalOutcome, forceRemovePreload = false) => {
      if (settled) return;
      settled = true;
      cleanupListeners();

      if (outcome.status === 'load_error') {
        closeModalBestEffort();
        cleanupFlutterwaveDom({ removePreload: true });
      } else if (forceRemovePreload) {
        cleanupFlutterwaveDom({ removePreload: true });
      } else {
        window.setTimeout(() => {
          cleanupFlutterwaveDom({ removePreload: false });
        }, 120);
      }

      resolve(outcome);
    };

    const handleWindowMessage = (event: MessageEvent) => {
      const origin = typeof event.origin === 'string' ? event.origin.toLowerCase() : '';
      if (!origin.includes('flutterwave.com') && !origin.includes('ravepay.co')) {
        return;
      }

      // Ignore boot messages from the hidden #flwpugpaidid preload frame before checkout starts.
      if (
        preloadFrameWindow &&
        event.source === preloadFrameWindow &&
        !document.getElementById('rve_spinner_container_0999')
      ) {
        return;
      }

      const data = event.data as { name?: string } | null | undefined;
      const msgName = data && typeof data.name === 'string' ? data.name : '';

      if (
        msgName === 'allcontentloaded' ||
        msgName === 'modalready' ||
        msgName === 'opop' ||
        msgName === 'vbvcomplete' ||
        msgName === 'closeiframe'
      ) {
        modalReady = true;
        if (loadTimeoutId !== null) {
          window.clearTimeout(loadTimeoutId);
          loadTimeoutId = null;
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);

    if (typeof MutationObserver !== 'undefined' && document.body) {
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLIFrameElement && node.name === 'checkout') {
              node.addEventListener(
                'error',
                () => {
                  if (!modalReady) {
                    finish({
                      status: 'load_error',
                      error:
                        'The Flutterwave payment window did not start. Your order is still saved as Awaiting payment, and you can try again.',
                    });
                  }
                },
                { once: true }
              );
            }
          });
        }
      });
      observer.observe(document.body, { childList: true });
    }

    loadTimeoutId = window.setTimeout(() => {
      if (!modalReady && !settled) {
        finish({
          status: 'load_error',
          error:
            'The Flutterwave payment window did not start (connection blocked or timed out). Your order is still saved as Awaiting payment, and you can try again.',
        });
      }
    }, FLUTTERWAVE_LOAD_TIMEOUT_MS);

    try {
      modalHandle = window.FlutterwaveCheckout!({
        public_key: FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: cleanTxRef,
        amount: cleanAmount,
        currency: FLUTTERWAVE_CURRENCY,
        payment_options: 'card',
        customer: {
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          phone_number: cleanPhone,
        },
        customizations: {
          title: 'Pre Order With Tabsah',
          description: cleanDescription,
        },
        callback: (data: FlutterwaveCallbackPayload) => {
          modalReady = true;
          const transactionId =
            data && data.transaction_id !== undefined && data.transaction_id !== null
              ? String(data.transaction_id)
              : '';
          const txRef =
            data && typeof data.tx_ref === 'string' && data.tx_ref.trim()
              ? data.tx_ref.trim()
              : cleanTxRef;

          closeModalBestEffort();
          finish({
            status: 'callback',
            transaction_id: transactionId,
            tx_ref: txRef,
            rawStatus: typeof data?.status === 'string' ? data.status : undefined,
          });
        },
        onclose: () => {
          finish({ status: 'closed' });
        },
      });
    } catch (err) {
      finish({
        status: 'load_error',
        error:
          err instanceof Error
            ? err.message
            : 'The Flutterwave payment window did not start. Please try again.',
      });
    }
  });
}

/**
 * Verifies a Flutterwave payment via the Supabase Edge Function.
 * Returns true ONLY when the HTTP response is ok AND JSON contains { ok: true }.
 * Any network error, non-2xx status, or ok: false returns false and never throws.
 */
export async function verifyFlutterwavePayment(params: {
  transaction_id: string | number;
  reference: string;
}): Promise<boolean> {
  try {
    const transactionId = String(params.transaction_id ?? '').trim();
    const reference = String(params.reference ?? '').trim();

    if (!transactionId || !reference) {
      return false;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    };

    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    } catch {
      // Continue without bearer token if session retrieval fails
    }

    const response = await fetch(FLUTTERWAVE_VERIFY_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        transaction_id: transactionId,
        reference,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const body: unknown = await response.json().catch(() => null);
    return Boolean(
      body &&
        typeof body === 'object' &&
        'ok' in body &&
        (body as { ok?: unknown }).ok === true
    );
  } catch {
    return false;
  }
}
