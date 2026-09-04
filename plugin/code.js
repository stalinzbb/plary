"use strict";
const API_BASE = "https://project-plary.vercel.app";
const VERSION = "1.0.11";
figma.showUI(__html__, { width: 360, height: 540, themeColors: true });
let authPollInterval = null;
// Private-plugin mode only (see DECISIONS.md 2026-09-02): the file key comes
// straight from figma.fileKey, which needs enablePrivatePluginApi in manifest.json.
let resolvedFileKey = null;
function resolveFileKey() {
    var _a;
    // Guarded: Figma throws (rather than returning undefined) in some contexts, and an
    // uncaught throw here kills init() — the UI never leaves the login screen.
    try {
        resolvedFileKey = (_a = figma.fileKey) !== null && _a !== void 0 ? _a : null;
    }
    catch (_b) {
        resolvedFileKey = null;
    }
}
function nodeIsPrototype(node) {
    var _a, _b;
    const page = figma.currentPage;
    if (page.flowStartingPoints.some((p) => p.nodeId === node.id))
        return true;
    if (((_a = page.prototypeStartNode) === null || _a === void 0 ? void 0 : _a.id) === node.id)
        return true;
    // Interactions usually live on nested elements (buttons, overlays), not the
    // top frame — walk descendants looking for any reaction.
    // ponytail: capped at 500 nodes so giant frames stay fast; a prototype with
    // its first interaction deeper than that reads as "screen" (override in UI)
    let visited = 0;
    const stack = [node];
    while (stack.length > 0 && visited < 500) {
        const n = stack.pop();
        visited++;
        if ("reactions" in n && ((_b = n.reactions) === null || _b === void 0 ? void 0 : _b.length) > 0)
            return true;
        if ("children" in n) {
            for (const child of n.children) {
                stack.push(child);
            }
        }
    }
    return false;
}
function detectSelection(node) {
    let detectedUrl = null;
    let detectedKind = "screen";
    if (node) {
        if (nodeIsPrototype(node)) {
            detectedKind = "prototype";
        }
        if (resolvedFileKey) {
            const nodeId = toUrlNodeId(node.id);
            const pageName = encodeURIComponent(figma.currentPage.name);
            detectedUrl =
                detectedKind === "prototype"
                    ? buildPrototypeUrl(node, resolvedFileKey)
                    : `https://www.figma.com/design/${resolvedFileKey}/${pageName}?node-id=${nodeId}`;
        }
    }
    return { detectedUrl, detectedKind };
}
function clearAuthPoll() {
    if (authPollInterval !== null) {
        clearInterval(authPollInterval);
        authPollInterval = null;
    }
}
// Token was rejected by the server (expired, or revoked via Settings -> Regenerate).
// Drop it and fall back to the login screen; init() re-runs in the no-token branch,
// which makes no authenticated calls, so this can't loop.
async function handleTokenRejected() {
    await figma.clientStorage.deleteAsync("plary_token");
    figma.ui.postMessage({ type: "token-expired" });
    await init();
}
async function startPluginAuth() {
    try {
        const res = await fetch(`${API_BASE}/api/plugin/auth/init`, { method: "POST" });
        if (!res.ok)
            throw new Error("init failed");
        const { session_id } = await res.json();
        figma.ui.postMessage({ type: "open-auth-url", url: API_BASE + "/plugin/auth?session=" + session_id });
        figma.ui.postMessage({ type: "auth-polling", status: "connecting" });
        let failures = 0;
        authPollInterval = setInterval(async () => {
            try {
                const pollRes = await fetch(`${API_BASE}/api/plugin/auth/poll?session=${session_id}`);
                if (!pollRes.ok) {
                    failures++;
                    return;
                }
                const data = await pollRes.json();
                failures = 0;
                if (data.status === "ready" && data.token) {
                    clearAuthPoll();
                    await figma.clientStorage.setAsync("plary_token", data.token);
                    figma.ui.postMessage({ type: "auth-success", token: data.token });
                    // Re-run init to load collections and OAuth status with the new token
                    await init();
                }
                else if (data.status === "expired") {
                    clearAuthPoll();
                    figma.ui.postMessage({ type: "auth-expired" });
                }
                // "pending" — keep polling
            }
            catch (_a) {
                failures++;
                if (failures >= 3) {
                    clearAuthPoll();
                    figma.ui.postMessage({ type: "auth-error", error: "Connection lost. Check your internet and try again." });
                }
            }
        }, 2000);
    }
    catch (_a) {
        figma.ui.postMessage({ type: "auth-error", error: "Can't reach Plary. Check your internet connection." });
    }
}
async function init() {
    var _a;
    const token = await figma.clientStorage.getAsync("plary_token");
    const selection = figma.currentPage.selection;
    const node = selection.length === 1 ? selection[0] : null;
    resolveFileKey();
    const { detectedUrl, detectedKind } = detectSelection(node);
    // A 401 from either bootstrap call means the stored token is expired or revoked;
    // a throw or 5xx means Plary is unreachable or broken. Both used to be swallowed,
    // leaving the UI to conclude "Figma account required".
    let tokenRejected = false;
    let bootstrapError = null;
    // Fetch existing collections for datalist suggestions
    let collections = [];
    if (token) {
        try {
            const res = await fetch(`${API_BASE}/api/collections`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok)
                collections = await res.json();
            else if (res.status === 401)
                tokenRejected = true;
            else if (res.status >= 500)
                bootstrapError = "server";
        }
        catch (_b) {
            bootstrapError = "network";
        }
    }
    // Check Figma OAuth connection status (non-fatal)
    let figmaConnected = false;
    let figmaHealth = null;
    let figmaOAuthUser = null;
    let plaryUserEmail = null;
    if (token) {
        try {
            const res = await fetch(`${API_BASE}/api/figma/oauth/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                figmaConnected = data.connected;
                figmaHealth = (_a = data.health) !== null && _a !== void 0 ? _a : null;
                if (data.figma_user)
                    figmaOAuthUser = data.figma_user;
                if (data.plary_user_email)
                    plaryUserEmail = data.plary_user_email;
            }
            else if (res.status === 401) {
                tokenRejected = true;
            }
            else if (res.status >= 500) {
                bootstrapError = "server";
            }
        }
        catch (_c) {
            bootstrapError = "network";
        }
    }
    if (tokenRejected)
        return handleTokenRejected();
    // Detect active Figma desktop user for mismatch detection
    let currentUser = null;
    try {
        const u = figma.currentUser;
        if (u)
            currentUser = { id: u.id, name: u.name, photoUrl: u.photoUrl };
    }
    catch ( /* currentuser permission */_d) { /* currentuser permission */ }
    // Compare identities to detect account mismatch
    let accountMismatch = false;
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) && figmaOAuthUser && currentUser.id !== figmaOAuthUser.id) {
        accountMismatch = true;
    }
    // Only allow saves when Figma OAuth is connected (data-integrity gate)
    const canSave = figmaConnected && !accountMismatch;
    figma.ui.postMessage({
        type: "init",
        apiBase: API_BASE,
        version: VERSION,
        token: token !== null && token !== void 0 ? token : null,
        node: node
            ? { id: node.id, name: node.name, type: node.type }
            : null,
        pageName: figma.currentPage.name,
        fileKey: resolvedFileKey,
        fileKeyError: resolvedFileKey ? null : "This build needs enablePrivatePluginApi in manifest.json",
        detectedUrl,
        collections,
        detectedKind,
        figmaConnected,
        figmaHealth,
        figmaOAuthUser,
        plaryUserEmail,
        currentUser,
        accountMismatch,
        canSave,
        bootstrapError,
    });
}
init();
// Re-detect when the user changes their selection
figma.on("selectionchange", () => {
    const node = figma.currentPage.selection.length === 1
        ? figma.currentPage.selection[0]
        : null;
    const { detectedUrl, detectedKind } = detectSelection(node);
    figma.ui.postMessage({
        type: "selection-changed",
        node: node ? { id: node.id, name: node.name, type: node.type } : null,
        pageName: figma.currentPage.name,
        detectedUrl,
        detectedKind,
    });
});
function toUrlNodeId(nodeId) {
    return nodeId.replace(":", "-");
}
function buildPrototypeUrl(node, fileKey) {
    const nodeId = toUrlNodeId(node.id);
    const queryParams = [`node-id=${encodeURIComponent(nodeId)}`];
    const flowStart = figma.currentPage.flowStartingPoints.find((point) => point.nodeId === node.id);
    const prototypeStartNode = figma.currentPage.prototypeStartNode;
    if (flowStart || (prototypeStartNode === null || prototypeStartNode === void 0 ? void 0 : prototypeStartNode.id) === node.id) {
        queryParams.push(`starting-point-node-id=${encodeURIComponent(nodeId)}`);
    }
    return `https://www.figma.com/proto/${fileKey}/${encodeURIComponent(figma.currentPage.name)}?${queryParams.join("&")}`;
}
figma.ui.onmessage = async (msg) => {
    if (msg.type === "save-token") {
        await figma.clientStorage.setAsync("plary_token", msg.token);
        figma.ui.postMessage({ type: "token-saved" });
        // Re-run init so collections and OAuth status load with the new token —
        // without this, saves stay disabled until the plugin is reopened
        await init();
    }
    else if (msg.type === "start-plugin-auth") {
        await startPluginAuth();
    }
    else if (msg.type === "cancel-plugin-auth") {
        clearAuthPoll();
    }
    else if (msg.type === "logout") {
        clearAuthPoll();
        const stored = await figma.clientStorage.getAsync("plary_token");
        if (stored) {
            // Best-effort: revoke server-side so a copied token stops working too.
            // ponytail: bumps the version for every device, so logging out here also
            // logs out the plugin on the user's other machines. Acceptable for now.
            try {
                await fetch(`${API_BASE}/api/token`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${stored}` },
                });
            }
            catch ( /* offline: local logout still proceeds */_a) { /* offline: local logout still proceeds */ }
        }
        await figma.clientStorage.deleteAsync("plary_token");
        figma.ui.postMessage({ type: "logged-out" });
    }
    else if (msg.type === "save-prototype") {
        await savePrototype(msg);
    }
    else if (msg.type === "close") {
        figma.closePlugin();
    }
};
function errorKind(e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Failed to fetch") || msg.includes("Network")) {
        return "network";
    }
    if (msg.startsWith("401") || msg.startsWith("403")) {
        return "auth";
    }
    if (msg.startsWith("5")) {
        return "server";
    }
    return "unknown";
}
async function savePrototype(msg) {
    var _a, _b, _c, _d, _e;
    const token = msg.token || (await figma.clientStorage.getAsync("plary_token"));
    if (!token || !msg.title) {
        figma.ui.postMessage({
            type: "save-error",
            error: "Token and title are required.",
        });
        return;
    }
    const selection = figma.currentPage.selection;
    const node = selection.length === 1 ? selection[0] : null;
    const fileKey = resolvedFileKey !== null && resolvedFileKey !== void 0 ? resolvedFileKey : undefined;
    if (!fileKey) {
        figma.ui.postMessage({
            type: "save-error",
            error: "This build needs enablePrivatePluginApi in manifest.json",
        });
        return;
    }
    let currentFigmaUserId = null;
    try {
        currentFigmaUserId = (_b = (_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
    }
    catch ( /* non-fatal */_f) { /* non-fatal */ }
    const body = {
        title: msg.title,
        description: msg.description || null,
        figma_url: msg.figmaUrl || null,
        figma_file_key: fileKey !== null && fileKey !== void 0 ? fileKey : null,
        figma_node_id: (_c = node === null || node === void 0 ? void 0 : node.id) !== null && _c !== void 0 ? _c : null,
        thumbnail_url: null, // uploaded async after save
        kind: (_d = msg.kind) !== null && _d !== void 0 ? _d : 'prototype',
        collection_names: ((_e = msg.collectionNames) === null || _e === void 0 ? void 0 : _e.length) ? msg.collectionNames : undefined,
        figma_user_id: currentFigmaUserId,
    };
    try {
        const res = await fetch(`${API_BASE}/api/prototypes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
        }
        const prototype = await res.json();
        figma.ui.postMessage({
            type: "save-success",
            id: prototype.id,
            title: prototype.title,
        });
        // Upload thumbnail asynchronously — don't block the save
        if (node) {
            uploadAndPatchThumbnail(token, prototype.id, node);
        }
    }
    catch (e) {
        const kind = errorKind(e);
        const detail = e instanceof Error ? e.message : JSON.stringify(e);
        let message;
        switch (kind) {
            case "network":
                message = "Can't reach Plary. Check your internet connection and try again.";
                break;
            case "auth":
                // 401 = the token itself is bad; 403 = the token is fine but Figma isn't
                // connected (or needs reconnecting). Only the first is a re-login.
                if (detail.includes("invalid_token") || detail.startsWith("401")) {
                    await handleTokenRejected(); // UI moves to the login screen
                    return;
                }
                if (detail.includes("figma_needs_reconnect")) {
                    message = "Reconnect your Figma account in Plary Settings, then try again.";
                }
                else {
                    message = "Connect your Figma account in Plary Settings before saving.";
                }
                break;
            case "server":
                message = "Something went wrong on the server. Try again in a moment.";
                break;
            default:
                message = detail || "Save failed. Try again.";
        }
        figma.ui.postMessage({ type: "save-error", error: message });
    }
}
async function uploadAndPatchThumbnail(token, prototypeId, node) {
    try {
        const bytes = await node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: 2 },
        });
        const urlRes = await fetch(`${API_BASE}/api/uploads/thumbnail-url`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!urlRes.ok)
            return;
        const { signedUrl, publicUrl } = await urlRes.json();
        const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            body: bytes,
            headers: { "Content-Type": "image/png" },
        });
        if (!uploadRes.ok)
            return;
        // Patch the prototype with the thumbnail URL
        await fetch(`${API_BASE}/api/prototypes/${prototypeId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ thumbnail_url: publicUrl }),
        });
    }
    catch (_a) {
        // Non-fatal: prototype is already saved without thumbnail
    }
}
