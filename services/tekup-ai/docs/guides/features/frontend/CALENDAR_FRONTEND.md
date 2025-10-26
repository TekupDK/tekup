# Kalender Frontend - RenOS

Komplet kalender frontend side med integration til Google Calendar synkronisering og booking administration.

## 📋 Indholdsfortegnelse

- [Oversigt](#oversigt)
- [Funktioner](#funktioner)
- [Arkitektur](#arkitektur)
- [Komponenter](#komponenter)
- [API Integration](#api-integration)
- [Design System](#design-system)
- [Responsiv Design](#responsiv-design)
- [Performance](#performance)
- [Konfiguration](#konfiguration)
- [Brugsvejledning](#brugsvejledning)
- [Troubleshooting](#troubleshooting)

## 🎯 Oversigt

Dette dokument beskriver den nye kalender frontend side i RenOS, der giver en komplet kalender visning med integration til Google Calendar synkronisering og booking administration.

## ✨ Funktioner

### Kalender Visning
- ✅ **Månedlig visning** - Traditionel kalender grid med alle bookinger
- ✅ **Ugentlig visning** - 7-dages oversigt med detaljerede booking kort
- ✅ **Daglig visning** - Detaljeret liste over bookinger for en specifik dag
- ✅ **Responsiv design** - Fungerer perfekt på alle skærmstørrelser

### 2. **Google Calendar Integration**
- ✅ **Real-time sync status** - Viser sidste synkronisering og fejl
- ✅ **Manuel sync knap** - Mulighed for at synkronisere med Google Calendar
- ✅ **Google Calendar links** - Direkte links til bookinger i Google Calendar
- ✅ **Sync statistikker** - Antal events, bookinger og fejl

### 3. **Booking Administration**
- ✅ **Booking oprettelse** - Opret nye bookinger direkte fra kalenderen
- ✅ **Booking detaljer** - Klik på bookinger for at se fulde detaljer
- ✅ **Status filtre** - Filtrer bookinger efter status (alle, afventer, bekræftet, etc.)
- ✅ **Søgning og navigation** - Nem navigation mellem datoer

### 4. **UI/UX Features**
- ✅ **Moderne design** - Konsistent med resten af RenOS design
- ✅ **Animationer** - Smooth transitions og hover effekter
- ✅ **Loading states** - Proper loading indikatorer
- ✅ **Empty states** - Informative beskeder når der ikke er bookinger

## 📁 Implementerede Filer

### **Frontend Komponenter**
- ✅ `client/src/components/Calendar.tsx` - Hovedkalender komponent
- ✅ `client/src/components/ui/badge.tsx` - Badge komponent for status

### **Integration**
- ✅ `client/src/App.tsx` - Tilføjet kalender route
- ✅ `client/src/components/Layout.tsx` - Tilføjet kalender til navigation

## 🎨 Kalender Visninger

### **Månedlig Visning**
```typescript
// Viser hele måneden med bookinger i hver dag
const renderMonthView = () => {
  // 7x6 grid med alle dage i måneden
  // Bookinger vises som små kort i hver dag
  // Hover effekter og klik for detaljer
}
```

### **Ugentlig Visning**
```typescript
// Viser 7 dage med detaljerede booking kort
const renderWeekView = () => {
  // 7 kolonner med dag og dato
  // Store booking kort med alle detaljer
  // Nem oversigt over ugen
}
```

### **Daglig Visning**
```typescript
// Viser alle bookinger for en specifik dag
const renderDayView = () => {
  // Liste format med store booking kort
  // Sorteret efter tid
  // Komplet booking information
}
```

## 🔄 Google Calendar Sync Integration

### **Sync Status Visning**
```typescript
interface CalendarSyncStatus {
  lastSync: Date | null;        // Sidste synkronisering
  totalEvents: number;          // Antal Google Calendar events
  totalBookings: number;        // Antal database bookinger
  syncErrors: number;           // Antal sync fejl
}
```

### **Sync Funktioner**
- **Manuel Sync** - Klik for at synkronisere med Google Calendar
- **Real-time Status** - Viser sync status og fejl
- **Progress Indikator** - Viser når sync kører
- **Error Handling** - Proper fejlhåndtering og visning

## 📊 Booking Data Struktur

### **Booking Interface**
```typescript
interface Booking {
  id: string;                   // Unik booking ID
  leadId: string;               // Lead ID reference
  serviceType: string | null;   // Type af service
  startTime: Date;              // Start tid
  endTime: Date;                // Slut tid
  status: string;               // Booking status
  notes: string | null;         // Noter
  calendarEventId?: string;     // Google Calendar event ID
  calendarLink?: string;        // Link til Google Calendar
  lead: {                       // Lead information
    name: string | null;
    email: string | null;
    phone: string | null;
    taskType: string | null;
    address: string | null;
  };
}
```

## 🎛️ Kalender Kontroller

### **View Mode Toggle**
- **Måned** - Traditionel kalender visning
- **Uge** - 7-dages oversigt
- **Dag** - Detaljeret dag visning

### **Navigation**
- **Forrige/Næste** - Naviger mellem perioder
- **I dag** - Gå til dagens dato
- **Responsive** - Fungerer på alle enheder

### **Filtre**
- **Status Filter** - Filtrer efter booking status
- **Alle Status** - Vis alle bookinger
- **Specifik Status** - Afventer, bekræftet, gennemført, annulleret

## 🔗 API Integration

### **Backend Endpoints**
```typescript
// Hent bookinger
GET /api/dashboard/bookings

// Kalender sync status
GET /api/calendar-sync/status

// Synkroniser kalender
POST /api/calendar-sync/sync
```

### **Data Flow**
1. **Load Bookings** - Hent alle bookinger fra backend
2. **Load Sync Status** - Hent sync status og statistikker
3. **Render Calendar** - Vis kalender med bookinger
4. **Handle Interactions** - Klik, navigation, filtre
5. **Sync with Google** - Manuel sync når ønsket

## 🎨 Design System

### **Farver og Status**
```typescript
// Status farver (fra getStatusBadgeClass)
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
};
```

### **Komponenter**
- **Card** - Booking kort og containers
- **Badge** - Status badges
- **Button** - Alle knapper og interaktioner
- **Icons** - Lucide React ikoner

## 📱 Responsiv Design

### **Breakpoints**
- **Mobile** - < 768px (stacked layout)
- **Tablet** - 768px - 1024px (adjusted grid)
- **Desktop** - > 1024px (full grid)

### **Mobile Features**
- **Touch Navigation** - Swipe mellem perioder
- **Collapsible Sidebar** - Skjul navigation på mobile
- **Touch-friendly** - Store klik områder

## 🚀 Performance

### **Optimizations**
- **Memoized Filters** - useMemo for filtered bookings
- **Lazy Loading** - Load bookinger kun når nødvendigt
- **Efficient Rendering** - Minimal re-renders
- **Image Optimization** - Optimerede ikoner og assets

### **Loading States**
- **Initial Load** - Spinner mens bookinger indlæses
- **Sync Progress** - Progress bar under sync
- **Skeleton UI** - Placeholder content under load

## 🔧 Konfiguration

### **Environment Variables**
```env
VITE_API_URL=https://tekup-renos.onrender.com
```

### **API Configuration**
- **Base URL** - Konfigurerbar API URL
- **Error Handling** - Proper error boundaries
- **Retry Logic** - Automatisk retry ved fejl

## 📋 Brugsvejledning

### **Navigation til Kalender**
1. Åbn RenOS frontend
2. Klik på "Kalender" i navigationen
3. Vælg ønsket visning (Måned/Uge/Dag)

### **Opret Booking**
1. Klik på "Opret Booking" knappen
2. Udfyld booking information
3. Booking oprettes og synkroniseres med Google Calendar

### **Synkroniser med Google Calendar**
1. Klik på "Vis Sync Status" knappen
2. Klik på "Synkroniser" for at synkronisere
3. Vent på sync completion

### **Filtrer Bookinger**
1. Vælg ønsket status fra dropdown
2. Bookinger filtreres automatisk
3. Alle visninger opdateres

## 🐛 Troubleshooting

### **Common Issues**

1. **Bookinger vises ikke**
   - Check API connection
   - Verify backend er kørende
   - Check browser console for fejl

2. **Sync fejler**
   - Check Google Calendar credentials
   - Verify API permissions
   - Check network connection

3. **Performance problemer**
   - Check antal bookinger
   - Clear browser cache
   - Check network speed

### **Debug Commands**
```bash
# Start frontend
npm run dev

# Build frontend
npm run build

# Check TypeScript
npm run tsc
```

## 📚 Se Også

- [Calendar Sync Backend](./CALENDAR_SYNC_AND_CUSTOMER_IMPORT.md)
- [Booking Management](./CALENDAR_BOOKING.md)
- [Customer Database](./CUSTOMER_DATABASE.md)
- [API Reference](./API_REFERENCE.md)

