/**
 * Core fetch wrapper.
 * @param {string} path
 * @param {RequestInit} [opts]
 * @returns {Promise<any>}
 */
export async function api(path, opts = {}) {
    const { headers, ...init } = opts;

    const res = await fetch(path, {
        ...init,
        headers: {
            Accept: 'application/json',
            // set JSON header only if we have a body and caller didn't set it
            ...(init.body && !(headers && headers['Content-Type']) && { 'Content-Type': 'application/json' }),
            ...headers,
        },
    });

    // Try to parse JSON (even on errors)
    let data = null;
    const text = await res.text();
    if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!res.ok) {
        // Surface Spring-style error messages when available
        const message =
            (data && (data.message || data.error)) ||
            res.statusText ||
            `HTTP ${res.status}`;
        const err = new Error(message);
        err.status = res.status;
        err.detail = data;
        throw err;
    }

    // 204 No Content
    if (res.status === 204 || text === '') return undefined;

    return data;
}

/** Build query string safely */
function qs(params = {}) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
    return entries.length ? `?${new URLSearchParams(entries).toString()}` : '';
}

/* ------------------------- Domain-specific calls ------------------------- */

/**
 * GET /api/items?name=...
 * @param {{ name?: string }} [opts]
 * @returns {Promise<Array<{id:number,name:string,amount:number,unit:string}>>}
 */
export function listItems(opts) {
    return api(`/api/items${qs(opts)}`);
}

/**
 * GET /api/items/{id}
 * @param {number} id
 * @returns {Promise<{id:number,name:string,amount:number,unit:string}>}
 */
export function getItem(id) {
    return api(`/api/items/${id}`);
}

/**
 * POST /api/items
 * Body: { name, amount }
 * Returns created item (Spring sends 201 Created + body)
 * @param {{name:string, amount:number, unit:string}} body
 * @returns {Promise<{id:number,name:string,amount:number,unit:string}>}
 */
export function createItem(body) {
    return api('/api/items', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * PATCH /api/items/{id}
 * Body: { name?, amount? }
 * Controller returns 201 Created + updated entity.
 * We accept 200/201 alike via `api()`.
 * @param {number} id
 * @param {{name?:string, amount?:number, unit?:string}} patch
 * @returns {Promise<{id:number,name:string,amount:number,unit:string}>}
 */
export function updateItem(id, patch) {
    return api(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
}

/**
 * DELETE /api/items/{id}
 * Controller returns 200 Ok.
 * We accept 200 via `api()`.
 * @param {number} id
 * @returns {Promise<{success:boolean, message?:string}>}
 */
export function deleteItem(id) {
    return api(`/api/items/${id}`, {
        method: 'DELETE'
    });
}

/* ----------------------------- example ----------------------------

import { listItems, getItem, createItem, updateItem } from '$lib/api';

// Load all:
const items = await listItems();

// Search by name:
const gloves = await listItems({ name: 'hand' });

// Create:
try {
  const created = await createItem({ name: 'New Thing', amount: 3 });
} catch (e) {
  if (e.status === 409) {
    // Duplicate name
    alert(e.message); // "Item with the specified name already exists"
  } else {
    console.error(e);
  }
}

// Update (partial):
await updateItem(123, { amount: 7 });

--------------------------------------------------------------------------- */
