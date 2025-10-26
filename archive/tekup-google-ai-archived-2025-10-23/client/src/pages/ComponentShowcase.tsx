/**
 * RenOS Design System - Component Showcase
 * 
 * Demo side til at teste alle primitive components
 */

import React from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Skeleton,
  SkeletonCard,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  toast,
  Toaster,
} from '@/design-system/primitives';

export const ComponentShowcase: React.FC = () => {
  const [inputValue, setInputValue] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            RenOS Design System
          </h1>
          <p className="text-lg text-gray-600">
            Primitive components showcase - Inspireret af Cursor, Linear & Stripe
          </p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              Multiple variants, sizes, and states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Variants */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="outline">Outline</Button>
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Sizes</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* States */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">States</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    isLoading={isLoading}
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => setIsLoading(false), 2000);
                    }}
                  >
                    {isLoading ? 'Loading...' : 'Click to load'}
                  </Button>
                  <Button disabled>Disabled</Button>
                  <Button
                    leftIcon={
                      <svg
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                      </svg>
                    }
                  >
                    With Icon
                  </Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>
              Text inputs with validation states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Default Input"
                  placeholder="Enter text..."
                  helperText="This is helper text"
                />
                
                <Input
                  label="With Icon"
                  placeholder="Search..."
                  leftIcon={
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                    </svg>
                  }
                />
                
                <Input
                  label="Success State"
                  value="Valid input"
                  success="Looks good!"
                  readOnly
                />
                
                <Input
                  label="Error State"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowError(e.target.value.length < 3);
                  }}
                  error={
                    showError && inputValue
                      ? 'Minimum 3 characters required'
                      : undefined
                  }
                  placeholder="Type at least 3 characters"
                />
              </div>

              <div className="space-y-4">
                <Input label="Disabled" disabled value="Can't edit this" />
                
                <Input
                  label="Large Size"
                  size="lg"
                  placeholder="Larger input field"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="brand">Brand</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="solid">Solid</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">With Dot</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" dot>
                    Active
                  </Badge>
                  <Badge variant="warning" dot>
                    Pending
                  </Badge>
                  <Badge variant="danger" dot>
                    Error
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Sizes</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge size="lg">Large</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Cards</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card elevation="sm">
              <CardHeader>
                <CardTitle>Small Elevation</CardTitle>
                <CardDescription>Subtle shadow effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Perfect for subtle content containers.
                </p>
              </CardContent>
            </Card>

            <Card elevation="md">
              <CardHeader>
                <CardTitle>Medium Elevation</CardTitle>
                <CardDescription>Moderate shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Great for main content cards.
                </p>
              </CardContent>
            </Card>

            <Card elevation="lg" interactive>
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Click or hover me!</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  This card responds to interaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skeletons */}
        <Card>
          <CardHeader>
            <CardTitle>Skeletons</CardTitle>
            <CardDescription>Loading state placeholders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Text</h4>
                <Skeleton height="20px" width="60%" />
                <Skeleton height="16px" lines={3} />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Card Skeleton
                </h4>
                <SkeletonCard />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Custom</h4>
                <div className="flex items-center gap-4">
                  <Skeleton variant="circle" width={64} height={64} />
                  <div className="flex-1 space-y-2">
                    <Skeleton height="24px" width="40%" />
                    <Skeleton height="16px" width="80%" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog/Modal */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog/Modal</CardTitle>
            <CardDescription>Modal dialogs with different sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent size="md">
                  <DialogHeader>
                    <DialogTitle>Welcome to RenOS</DialogTitle>
                    <DialogDescription>
                      This is a dialog component built on Radix UI
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <p className="text-sm text-gray-600">
                      Dialog components can contain forms, confirmations, or any content you need.
                      They're fully accessible and keyboard navigable.
                    </p>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="primary">Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Large Dialog</Button>
                </DialogTrigger>
                <DialogContent size="lg">
                  <DialogHeader>
                    <DialogTitle>Large Dialog Example</DialogTitle>
                    <DialogDescription>
                      Perfect for complex forms or detailed content
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <div className="space-y-4">
                      <Input label="Name" placeholder="Enter your name" />
                      <Input label="Email" type="email" placeholder="your@email.com" />
                      <Input label="Message" placeholder="Your message" />
                    </div>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="success">Submit</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* DropdownMenu */}
        <Card>
          <CardHeader>
            <CardTitle>Dropdown Menu</CardTitle>
            <CardDescription>Context menus and dropdowns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Options
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-danger-600">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>Toast notifications for user feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  toast({
                    title: 'Success!',
                    description: 'Your changes have been saved.',
                    variant: 'success',
                  });
                }}
              >
                Show Success Toast
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  toast({
                    title: 'Error',
                    description: 'Something went wrong. Please try again.',
                    variant: 'danger',
                  });
                }}
              >
                Show Error Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  toast({
                    title: 'Warning',
                    description: 'Please review your input before submitting.',
                    variant: 'warning',
                  });
                }}
              >
                Show Warning Toast
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  toast({
                    title: 'Information',
                    description: 'New features are now available!',
                    variant: 'info',
                  });
                }}
              >
                Show Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
};

export default ComponentShowcase;
