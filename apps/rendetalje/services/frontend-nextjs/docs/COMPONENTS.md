# RendetaljeOS Frontend Components

## Overview

Component library built with **React 18**, **TypeScript 5**, and **Tailwind CSS 3**. All components follow functional component patterns with hooks.

## Component Organization

```
src/components/
├── ui/                # Design system components
├── dashboard/         # Dashboard-specific components
├── customers/         # Customer management components
├── employee/          # Employee portal components
├── customer/          # Customer portal components
├── common/            # Shared components
├── providers/         # Context providers
└── landing/           # Marketing components
```

---

## UI Components (Design System)

**Location**: `src/components/ui/`

### Button

Reusable button component with variants and states.

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Save Changes
</Button>

<Button variant="secondary" leftIcon={<Plus />} isLoading={loading}>
  Add Customer
</Button>
```

---

### Card

Container component with header, body, and footer sections.

**Components**:
- `Card` - Main container
- `CardHeader` - Title and actions
- `CardBody` - Content area
- `CardFooter` - Footer area

**Props**:
```typescript
interface CardProps {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Card variant="elevated" padding="lg">
  <CardHeader>
    <h2>Customer Details</h2>
    <Button variant="ghost">Edit</Button>
  </CardHeader>
  <CardBody>
    <p>Customer information...</p>
  </CardBody>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

---

### Input

Form input component with validation support.

**Props**:
```typescript
interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
```

**Usage**:
```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  error={errors.email}
  required
/>
```

---

### Modal

Modal dialog component.

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Customer">
  <CustomerForm onSubmit={handleSubmit} />
</Modal>
```

---

### Badge

Status badge component.

**Props**:
```typescript
interface BadgeProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">Cancelled</Badge>
```

---

### Spinner

Loading spinner component.

**Props**:
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}
```

---

## Dashboard Components

**Location**: `src/components/dashboard/`

### OwnerDashboard

Main dashboard view for organization owners.

**Features**:
- KPI cards (revenue, jobs, team utilization)
- Revenue charts
- Team location map
- Notification center
- Auto-refresh every 30 seconds

**Usage**:
```tsx
<OwnerDashboard />
```

---

### KPICard

Key performance indicator card.

**Props**:
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}
```

**Usage**:
```tsx
<KPICard
  title="Total Revenue"
  value="125.450 kr."
  change={12.5}
  trend="up"
  icon={<DollarSign />}
  color="primary"
/>
```

---

### RevenueChart

Revenue visualization using Recharts.

**Props**:
```typescript
interface RevenueChartProps {
  data: RevenueData[];
  period?: 'day' | 'week' | 'month';
}
```

**Usage**:
```tsx
<RevenueChart data={revenueData} period="month" />
```

---

### TeamMap

Real-time team location tracking map.

**Props**:
```typescript
interface TeamMapProps {
  locations: TeamLocation[];
}
```

---

### NotificationCenter

Real-time notifications UI.

**Props**:
```typescript
interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}
```

---

## Customer Components

**Location**: `src/components/customers/`

### CustomerList

Data table with filtering and pagination.

**Features**:
- Search with debounce
- Advanced filters (city, status, satisfaction)
- Pagination
- Sort support
- Action buttons (view, edit, message)

**Props**:
```typescript
interface CustomerListProps {
  onSelectCustomer?: (customer: Customer) => void;
}
```

**Usage**:
```tsx
<CustomerList onSelectCustomer={(customer) => setSelected(customer)} />
```

---

### CustomerDetail

Customer profile view.

**Props**:
```typescript
interface CustomerDetailProps {
  customer: Customer;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

---

### CustomerForm

Create/edit customer form with validation.

**Props**:
```typescript
interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel?: () => void;
}
```

**Usage**:
```tsx
<CustomerForm
  customer={selectedCustomer}
  onSubmit={handleSubmit}
  onCancel={() => setModalOpen(false)}
/>
```

---

### CustomerAnalytics

Customer analytics dashboard.

**Features**:
- Satisfaction trends
- Revenue analysis
- Job history
- Segmentation

---

### CustomerCommunicationLog

Message history with customer.

**Props**:
```typescript
interface CustomerCommunicationLogProps {
  customerId: string;
  jobId?: string;
}
```

---

## Employee Components

**Location**: `src/components/employee/`

### TimeTracker

Professional time tracking component.

**Features**:
- Start/pause/stop controls
- Real-time elapsed display (HH:MM:SS)
- Break time management
- Overtime warnings
- Daily statistics
- Time entries list

**Props**:
```typescript
interface TimeTrackerProps {
  employeeId: string;
}
```

**Usage**:
```tsx
<TimeTracker employeeId={currentUser.id} />
```

---

### DailyJobList

Jobs assigned to employee for the day.

**Props**:
```typescript
interface DailyJobListProps {
  employeeId: string;
  date?: Date;
}
```

---

### PhotoDocumentation

Photo upload and documentation component.

**Props**:
```typescript
interface PhotoDocumentationProps {
  jobId: string;
  onPhotoUploaded?: (url: string) => void;
}
```

---

### CustomerSignature

Digital signature capture component.

**Props**:
```typescript
interface CustomerSignatureProps {
  onSignatureComplete: (signature: string) => void;
}
```

---

## Customer Portal Components

**Location**: `src/components/customer/`

### BookingConfirmation

Booking confirmation view.

---

### DateTimePicker

Date and time selection for bookings.

**Props**:
```typescript
interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  availableTimes?: string[];
}
```

---

### ServiceSelection

Service type selection component.

**Props**:
```typescript
interface ServiceSelectionProps {
  selected?: ServiceType;
  onSelect: (type: ServiceType) => void;
}
```

---

## Form Components

### LoginForm

Authentication form with validation.

**Features**:
- React Hook Form integration
- Zod schema validation
- Email/password fields
- Loading states
- Error display

**Usage**:
```tsx
<LoginForm />
```

---

## Provider Components

**Location**: `src/components/providers/`

### AuthProvider

Authentication context provider.

**Provides**:
```typescript
interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

**Usage**:
```tsx
// In app root
<AuthProvider>
  <App />
</AuthProvider>

// In components
const { user, isAuthenticated, login, logout } = useAuth();
```

---

### ToastProvider

Toast notification provider.

**Methods**:
```typescript
toastService.success('Saved successfully!');
toastService.error('Something went wrong');
toastService.loading('Processing...');
```

---

### Providers

Combines all providers.

**Usage**:
```tsx
<Providers>
  <App />
</Providers>
```

---

## Common Components

**Location**: `src/components/common/`

### ErrorBoundary

Error boundary wrapper.

**Usage**:
```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

## Component Patterns

### Client Components

All interactive components use `"use client"` directive:

```tsx
"use client";

import { useState } from 'react';

export function MyComponent() {
  const [state, setState] = useState();
  // ...
}
```

---

### TypeScript Props

All components have typed props:

```tsx
interface MyComponentProps {
  title: string;
  count: number;
  onAction?: () => void;
}

export function MyComponent({ title, count, onAction }: MyComponentProps) {
  // ...
}
```

---

### Icon Usage

Icons from `lucide-react`:

```tsx
import { Plus, Edit, Trash, Check } from 'lucide-react';

<Button leftIcon={<Plus size={16} />}>Add</Button>
```

---

### Styling Pattern

Tailwind utility classes:

```tsx
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
</div>
```

---

### Form Handling

React Hook Form + Zod:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

---

### State Management

Local state with hooks:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [data, setData] = useState<Customer[]>([]);
```

Global state with Zustand:

```tsx
import { useCustomersStore } from '@/store/customersStore';

const customers = useCustomersStore(state => state.customers);
const fetchCustomers = useCustomersStore(state => state.fetchCustomers);
```

---

## Best Practices

1. **Single Responsibility**: Each component does one thing well
2. **Prop Typing**: All props are typed with TypeScript
3. **Error Handling**: Handle loading and error states
4. **Accessibility**: Include ARIA labels and semantic HTML
5. **Performance**: Use `useMemo` and `useCallback` for expensive operations
6. **Testing**: Write tests for complex logic
7. **Documentation**: Document complex components

---

For state management details, see [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md).

For user flows, see [USER_FLOWS.md](./USER_FLOWS.md).
