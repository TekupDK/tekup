aa# 🚀 RenOS Implementation Plan - Manglende Features\n\n\n\n**Dato:** 2. oktober 2025  
**Status:** Ready to implement  
**Estimated Total Time:** 15-20 timer\n\n
---
\n\n## 📋 Todo List Overview\n\n\n\n1. ✅ **Environment Variables** - 10 min → GIVER 85% FUNCTIONALITY\n\n2. 🔄 **Email Approval Workflow** - 6-8 timer\n\n3. 🔄 **Calendar Booking UI** - 6-8 timer\n\n4. 🔄 **Quote Generation UI** - 3-4 timer\n\n
---
\n\n## 1️⃣ QUICK FIX: Environment Variables (10 min)\n\n\n\n### Hvad Dette Fixer\n\n- ✅ Customer 360 email tråde vises\n\n- ✅ Calendar booking virker\n\n- ✅ Auto-response sender live emails (ikke dry-run)\n\n\n\n### Step-by-Step Guide\n\n\n\n#### A. Login til Render Dashboard\n\n1. Gå til: https://dashboard.render.com\n\n2. Find "tekup-renos" service (backend)\n\n3. Klik på servicen
\n\n#### B. Opdater Environment Variables\n\n1. Klik "Environment" tab i venstre sidebar\n\n2. Find eller tilføj disse variabler:
\n\n```bash\n\n# Critical Fix #1: Enable Live Mode\n\nRUN_MODE=production\n\n\n\n# Critical Fix #2: Enable Calendar Features (DEDICATED RenOS CALENDAR)\n\nGOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com\n\n\n\n# ✅ PERFEKT SETUP:\n\n# - Dedicated "RenOS Automatisk Booking" kalender\n\n# - Auto-accept enabled for non-conflicting invitations\n\n# - Shared with empire1266@gmail.com + info@rendetalje.dk\n\n# - Email notifications configured\n\n# - Timezone: Copenhagen (GMT+02:00)\n\n\n\n# Verify These Exist (fra tidligere):\n\nGOOGLE_PROJECT_ID=renos-465008\n\nGOOGLE_CLIENT_EMAIL=renos@renos-465008.iam.gserviceaccount.com\n\nGOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk\n\n```
\n\n3. Klik "Save Changes"\n\n4. Vent ~2 minutter på auto-redeploy
\n\n#### C. Kør Email Ingest (VIGTIG!)\n\nEfter redeploy, åbn i browser:\n\n\n\n```
https://tekup-renos.onrender.com/api/dashboard/email-ingest/stats\n\n```

**Forventet Output:**\n\n```json
{
  "latestRun": {
    "status": "completed",
    "totalEmails": 150,
    "newEmails": 150
  },
  "totalThreads": 150,
  "matchedThreads": 120,
  "unmatchedThreads": 30
}\n\n```
\n\n#### D. Verificer Customer 360\n\n1. Gå til: https://tekup-renos-1.onrender.com\n\n2. Klik "Customer 360"\n\n3. Vælg en kunde\n\n4. Du skulle nu se deres email tråde! 🎉

---
\n\n## 2️⃣ Email Approval Workflow (6-8 timer)\n\n\n\n### Overview\n\nAI-genererede emails skal godkendes manuelt før afsendelse.\n\n\n\n### Backend Implementation\n\n\n\n#### Step 1: Create API Routes (2 timer)\n\n\n\n**File: `src/api/emailApprovalRoutes.ts`**
\n\n```typescript
import { Router } from "express";
import { prisma } from "../services/databaseService";
import { gmailService } from "../services/gmailService";

const router = Router();

// GET /api/email-approval/pending - List all pending emails\n\nrouter.get("/pending", async (req, res) => {
  const pendingEmails = await prisma.emailResponse.findMany({
    where: { status: "pending" },
    include: {
      lead: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(pendingEmails);
});

// POST /api/email-approval/:id/approve - Approve and send email\n\nrouter.post("/:id/approve", async (req, res) => {
  const { id } = req.params;

  // Get email response
  const emailResponse = await prisma.emailResponse.findUnique({
    where: { id },
    include: { lead: true },
  });

  if (!emailResponse) {
    return res.status(404).json({ error: "Email not found" });
  }

  // Send via Gmail
  const result = await gmailService.sendEmail({
    to: emailResponse.recipientEmail,
    subject: emailResponse.subject,
    body: emailResponse.body,
    threadId: emailResponse.gmailThreadId || undefined,
  });

  // Update status
  await prisma.emailResponse.update({
    where: { id },
    data: {
      status: "sent",
      sentAt: new Date(),
      gmailMessageId: result.messageId,
    },
  });

  res.json({ success: true, messageId: result.messageId });
});

// POST /api/email-approval/:id/reject - Reject email\n\nrouter.post("/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  await prisma.emailResponse.update({
    where: { id },
    data: {
      status: "rejected",
      rejectedReason: reason,
    },
  });

  res.json({ success: true });
});

// PUT /api/email-approval/:id/edit - Edit email before approval\n\nrouter.put("/:id/edit", async (req, res) => {
  const { id } = req.params;
  const { subject, body } = req.body;

  const updated = await prisma.emailResponse.update({
    where: { id },
    data: { subject, body },
  });

  res.json(updated);
});

export default router;\n\n```

**Tilføj til `src/server.ts`:**
\n\n```typescript
import emailApprovalRouter from "./api/emailApprovalRoutes";

// ... existing routes ...
app.use("/api/email-approval", emailApprovalRouter);\n\n```

---
\n\n#### Step 2: Update Prisma Schema (hvis nødvendigt)\n\n\n\n**File: `prisma/schema.prisma`**

Verificer at `EmailResponse` model har disse felter:
\n\n```prisma
model EmailResponse {
  id              String   @id @default(cuid())
  leadId          String
  recipientEmail  String
  subject         String
  body            String   @db.Text
  status          String   @default("pending") // pending, approved, sent, rejected
  gmailThreadId   String?
  gmailMessageId  String?
  sentAt          DateTime?
  rejectedReason  String?
  aiModel         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  lead Lead @relation(fields: [leadId], references: [id])

  @@index([leadId])
  @@index([status])
}\n\n```

Kør migration:\n\n```bash
npx prisma db push\n\n```

---
\n\n### Frontend Implementation\n\n\n\n#### Step 3: Create Email Approval Component (3-4 timer)\n\n\n\n**File: `client/src/components/EmailApproval.tsx`**
\n\n```typescript
import { useState, useEffect } from "react";
import { Mail, Check, X, Edit2, Clock } from "lucide-react";

interface PendingEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  createdAt: string;
  lead: {
    name: string;
    customer?: {
      name: string;
    };
  };
}

export default function EmailApproval() {
  const [pendingEmails, setPendingEmails] = useState<PendingEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<PendingEmail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  useEffect(() => {
    fetchPendingEmails();
  }, []);

  const fetchPendingEmails = async () => {
    const res = await fetch("/api/email-approval/pending");
    const data = await res.json();
    setPendingEmails(data);
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Send denne email til kunden?")) return;

    await fetch(`/api/email-approval/${id}/approve`, {
      method: "POST",
    });

    fetchPendingEmails();
    setSelectedEmail(null);
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Hvorfor afviser du denne email?");
    if (!reason) return;

    await fetch(`/api/email-approval/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    fetchPendingEmails();
    setSelectedEmail(null);
  };

  const handleEdit = async () => {
    if (!selectedEmail) return;

    await fetch(`/api/email-approval/${selectedEmail.id}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: editedSubject,
        body: editedBody,
      }),
    });

    setIsEditing(false);
    fetchPendingEmails();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Godkendelse</h1>
        <p className="text-gray-600">
          {pendingEmails.length} emails venter på godkendelse
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email List */}\n\n        <div className="space-y-3">
          {pendingEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => {
                setSelectedEmail(email);
                setEditedSubject(email.subject);
                setEditedBody(email.body);
                setIsEditing(false);
              }}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                selectedEmail?.id === email.id ? "border-blue-500 bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {email.lead.customer?.name || email.lead.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(email.createdAt).toLocaleDateString("da-DK")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{email.subject}</p>
                </div>
              </div>
            </div>
          ))}

          {pendingEmails.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ingen emails venter på godkendelse</p>
            </div>
          )}
        </div>

        {/* Email Preview/Edit */}\n\n        {selectedEmail && (
          <div className="border rounded-lg p-6 bg-white">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Til: {selectedEmail.recipientEmail}
              </label>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emne:
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{selectedEmail.subject}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Besked:
              </label>
              {isEditing ? (
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedEmail.body}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Gem Ændringer
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuller
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleApprove(selectedEmail.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Godkend & Send
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Rediger
                  </button>
                  <button
                    onClick={() => handleReject(selectedEmail.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Afvis
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}\n\n```

---
\n\n#### Step 4: Add Route to App (5 min)\n\n\n\n**File: `client/src/App.tsx`**
\n\n```typescript
import EmailApproval from "./components/EmailApproval";

// ... in Routes ...
<Route path="/email-approval" element={<EmailApproval />} />\n\n```

**File: `client/src/components/Layout.tsx`**
\n\n```typescript
// Add to navigation
<Link to="/email-approval" className="...">
  <Mail className="w-5 h-5" />
  Email Godkendelse
  {pendingCount > 0 && (
    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
      {pendingCount}
    </span>
  )}
</Link>\n\n```

---
\n\n#### Step 5: Update Lead Monitor (1 time)\n\n\n\n**File: `src/services/leadMonitor.ts`**

Ændre auto-send logik til at oprette pending emails i stedet:
\n\n```typescript
// BEFORE:
await emailAutoResponseService.sendResponse(lead);

// AFTER:
await emailAutoResponseService.createPendingResponse(lead);\n\n```

**File: `src/services/emailAutoResponseService.ts`**
\n\n```typescript
async createPendingResponse(lead: ParsedLead): Promise<EmailResponse> {
  const emailContent = await this.generateResponse(lead);

  return prisma.emailResponse.create({
    data: {
      leadId: lead.id,
      recipientEmail: lead.email,
      subject: emailContent.subject,
      body: emailContent.body,
      status: "pending",
      aiModel: "gemini-2.0-flash-exp",
    },
  });
}\n\n```

---
\n\n## 3️⃣ Calendar Booking UI (6-8 timer)\n\n\n\n### Backend Implementation\n\n\n\n#### Step 1: Create Booking API Routes (3 timer)\n\n\n\n**File: `src/api/bookingRoutes.ts`**
\n\n```typescript
import { Router } from "express";
import { prisma } from "../services/databaseService";
import { calendarService } from "../services/calendarService";

const router = Router();

// GET /api/bookings - List all bookings\n\nrouter.get("/", async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      customer: true,
      lead: true,
    },
    orderBy: { scheduledAt: "desc" },
  });

  res.json(bookings);
});

// POST /api/bookings - Create new booking\n\nrouter.post("/", async (req, res) => {
  const { customerId, leadId, scheduledAt, estimatedDuration, serviceType, address } = req.body;

  // Check availability
  const isAvailable = await calendarService.checkAvailability(
    new Date(scheduledAt),
    estimatedDuration
  );

  if (!isAvailable) {
    return res.status(400).json({ error: "Time slot not available" });
  }

  // Create calendar event
  const event = await calendarService.createEvent({
    summary: `Rengøring - ${serviceType}`,\n\n    location: address,
    start: new Date(scheduledAt),
    duration: estimatedDuration,
  });

  // Create booking in database
  const booking = await prisma.booking.create({
    data: {
      customerId,
      leadId,
      scheduledAt: new Date(scheduledAt),
      estimatedDuration,
      serviceType,
      address,
      status: "scheduled",
      calendarEventId: event.id,
      calendarLink: event.htmlLink,
    },
    include: {
      customer: true,
    },
  });

  res.json(booking);
});

// PUT /api/bookings/:id - Update booking\n\nrouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, estimatedDuration, status } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  // Update calendar event if time changed
  if (scheduledAt && booking.calendarEventId) {
    await calendarService.updateEvent(booking.calendarEventId, {
      start: new Date(scheduledAt),
      duration: estimatedDuration || booking.estimatedDuration,
    });
  }

  // Update database
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      ...(estimatedDuration && { estimatedDuration }),
      ...(status && { status }),
    },
    include: { customer: true },
  });

  res.json(updated);
});

// DELETE /api/bookings/:id - Cancel booking\n\nrouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  // Delete calendar event
  if (booking.calendarEventId) {
    await calendarService.deleteEvent(booking.calendarEventId);
  }

  // Update status
  await prisma.booking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  res.json({ success: true });
});

// GET /api/bookings/availability/:date - Check availability for date\n\nrouter.get("/availability/:date", async (req, res) => {
  const { date } = req.params;
  const targetDate = new Date(date);

  const slots = await calendarService.getAvailableSlots(targetDate, 120); // 2 hour slots

  res.json({ date, slots });
});

export default router;\n\n```

**Tilføj til `src/server.ts`:**
\n\n```typescript
import bookingRouter from "./api/bookingRoutes";

app.use("/api/bookings", bookingRouter);\n\n```

---
\n\n### Frontend Implementation\n\n\n\n#### Step 2: Create Booking Modal Component (3-4 timer)\n\n\n\n**File: `client/src/components/BookingModal.tsx`**
\n\n```typescript
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  leadId?: string;
  onSuccess: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  customerId,
  leadId,
  onSuccess,
}: BookingModalProps) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(customerId || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(120);
  const [serviceType, setServiceType] = useState("Flytterengøring");
  const [address, setAddress] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (date) {
      fetchAvailableSlots(date);
    }
  }, [date]);

  const fetchCustomers = async () => {
    const res = await fetch("/api/dashboard/customers");
    const data = await res.json();
    setCustomers(data);
  };

  const fetchAvailableSlots = async (selectedDate: string) => {
    const res = await fetch(`/api/bookings/availability/${selectedDate}`);
    const data = await res.json();
    setAvailableSlots(data.slots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const scheduledAt = new Date(`${date}T${time}`);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer,
        leadId,
        scheduledAt,
        estimatedDuration: duration,
        serviceType,
        address,
      }),
    });

    if (response.ok) {
      onSuccess();
      onClose();
    } else {
      const error = await response.json();
      alert(error.error || "Failed to create booking");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Opret Booking</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selector */}\n\n          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Kunde
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Vælg kunde...</option>
              {customers.map((customer: any) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}\n\n          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Dato
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Available Time Slots */}\n\n          {availableSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Vælg tidspunkt
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot: any) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setTime(slot.time)}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      time === slot.time
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Time Input */}\n\n          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eller indtast tidspunkt manuelt
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Duration */}\n\n          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimeret varighed (minutter)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={60}>1 time</option>
              <option value={90}>1.5 timer</option>
              <option value={120}>2 timer</option>
              <option value={180}>3 timer</option>
              <option value={240}>4 timer</option>
            </select>
          </div>

          {/* Service Type */}\n\n          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ydelse
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="Flytterengøring">Flytterengøring</option>
              <option value="Fast rengøring">Fast rengøring</option>
              <option value="Erhvervsrengøring">Erhvervsrengøring</option>
              <option value="Kontorrengøring">Kontorrengøring</option>
              <option value="Vinduespudsning">Vinduespudsning</option>
            </select>
          </div>

          {/* Address */}\n\n          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Eksempel: Hovedgaden 123, 2100 København"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Actions */}\n\n          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Opret Booking
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuller
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}\n\n```

---
\n\n#### Step 3: Add to Bookings Page (30 min)\n\n\n\n**File: `client/src/components/Bookings.tsx`**
\n\n```typescript
import { useState } from "react";
import BookingModal from "./BookingModal";
import { Plus, Calendar, Clock, MapPin } from "lucide-react";

export default function Bookings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bookinger</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ny Booking
        </button>
      </div>

      {/* Booking List */}\n\n      <div className="space-y-3">
        {bookings.map((booking: any) => (
          <div key={booking.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  {booking.customer.name}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(booking.scheduledAt).toLocaleDateString("da-DK")}
                  </span>
                  <span>
                    <Clock className="w-4 h-4 inline mr-1" />
                    {new Date(booking.scheduledAt).toLocaleTimeString("da-DK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {booking.address}
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  booking.status === "scheduled"
                    ? "bg-blue-100 text-blue-800"
                    : booking.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBookings}
      />
    </div>
  );
}\n\n```

---
\n\n## 🎯 Implementation Timeline\n\n\n\n### Day 1 (2-3 timer)\n\n- ✅ Environment variables fix (10 min)\n\n- ✅ Email approval backend API (2 timer)\n\n- ✅ Test email approval endpoints\n\n\n\n### Day 2 (4-5 timer)\n\n- ✅ Email approval frontend UI (3-4 timer)\n\n- ✅ Integration testing\n\n- ✅ Update lead monitor\n\n\n\n### Day 3 (3-4 timer)\n\n- ✅ Booking backend API (3 timer)\n\n- ✅ Test booking endpoints\n\n\n\n### Day 4 (3-4 timer)\n\n- ✅ Booking frontend UI (3 timer)\n\n- ✅ Integration testing\n\n\n\n### Day 5 (2 timer)\n\n- ✅ Quote management UI (optional)\n\n- ✅ Final testing & deployment\n\n
---
\n\n## ✅ Testing Checklist\n\n\n\n### Email Approval\n\n- [ ] Pending emails vises i UI\n\n- [ ] Approve sender email via Gmail\n\n- [ ] Reject markerer email som rejected\n\n- [ ] Edit opdaterer email content\n\n- [ ] Badge viser antal pending emails\n\n\n\n### Calendar Booking\n\n- [ ] Create booking opretter calendar event\n\n- [ ] Availability check fungerer\n\n- [ ] Time slots vises korrekt\n\n- [ ] Update booking opdaterer calendar\n\n- [ ] Delete booking fjerner calendar event\n\n
---
\n\n## 🚀 Deployment Steps\n\n\n\n### 1. Backend Changes\n\n```bash\n\ngit add -A
git commit -m "feat: Add email approval and booking UI features"
git push origin main\n\n```
\n\n### 2. Wait for Render Deploy (~3 min)\n\n\n\n### 3. Test Environment Variables\n\n```bash\n\n# Verify RUN_MODE=production\n\ncurl https://tekup-renos.onrender.com/health\n\n\n\n# Run email ingest\n\ncurl https://tekup-renos.onrender.com/api/dashboard/email-ingest/stats\n\n```\n\n\n\n### 4. Test New Endpoints\n\n```bash\n\n# Email approval\n\ncurl https://tekup-renos.onrender.com/api/email-approval/pending\n\n\n\n# Bookings\n\ncurl https://tekup-renos.onrender.com/api/bookings\n\n```\n\n\n\n### 5. Verify Frontend\n\n- Open https://tekup-renos-1.onrender.com\n\n- Navigate to "Email Godkendelse"\n\n- Navigate to "Bookinger"\n\n- Test all features\n\n
---
\n\n## 📚 Documentation to Update\n\n\n\nAfter implementation:
\n\n1. **Update README.md** - Add new features section\n\n2. **Create USER_GUIDE.md** - Step-by-step for team\n\n3. **Update API docs** - New endpoints\n\n4. **Create VIDEO_TUTORIAL.md** - Screen recordings (optional)\n\n
---

**Ready to start?** Jeg kan begynde at implementere features eller guide dig gennem env var fix først! 🚀
