# 📋 CLAUDE CONNECTOR - QUICK REFERENCE CARD

**Print eller gem denne som reference**

---

## 🎯 CONNECTOR FORM FIELDS

| Field | Value |
|-------|-------|
| **Connector Name** | `billy mcp` |
| **Base URL** | `https://tekup-billy.onrender.com/api/v1` |
| **Description** | Billy.dk accounting integration via MCP |
| **OAuth Client ID** | `[LEAVE EMPTY]` |
| **OAuth Client Secret** | `[LEAVE EMPTY]` |

---

## 🔐 AUTHENTICATION HEADER

| Field | Value |
|-------|-------|
| **Header Name** | `X-API-Key` |
| **Header Value** | `bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b` |

---

## ✅ CHECKLIST

- [ ] Name: `billy mcp`
- [ ] Base URL: `https://tekup-billy.onrender.com/api/v1`
- [ ] OAuth fields: EMPTY
- [ ] Header `X-API-Key` added
- [ ] API Key value correct
- [ ] Trust checkbox CHECKED
- [ ] Saved connector

---

## 🧪 TEST COMMANDS

After saving, test with:

```
@billy what tools do you have?
```

```
@billy show me the last 5 invoices
```

```
@billy what is my organization info?
```

---

## 🔍 VERIFY SERVER

Open in browser:

```
https://tekup-billy.onrender.com/health
```

Should show:

```json
{
  "status": "healthy",
  "billy": {"connected": true}
}
```

---

## 🛠️ AVAILABLE TOOLS (13)

**Invoices:** 4 tools (list, get, create, send)  
**Customers:** 3 tools (list, get, create)  
**Products:** 2 tools (list, get)  
**Revenue:** 1 tool (calculate)  
**Organization:** 1 tool (get info)  
**Testing:** 2 tools (list/run scenarios)

---

## 📞 QUICK SUPPORT

**Health:** `https://tekup-billy.onrender.com/health`  
**Render:** `https://dashboard.render.com`  
**Docs:** See `CLAUDE_EXACT_SETUP.md`

---

**Status:** ✅ READY  
**Server:** ✅ LIVE  
**Last Check:** Oct 11, 2025
