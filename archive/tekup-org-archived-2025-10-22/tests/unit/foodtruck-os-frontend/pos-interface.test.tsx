import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosInterface } from '../../../apps/foodtruck-os-frontend/src/components/pos/PosInterface';
import { useQuery, useMutation } from 'react-query';

// Mock react-query
jest.mock('react-query');
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;

describe('PosInterface', () => {
  const mockMenuItems = [
    {
      id: '1',
      name: 'Burger',
      description: 'Klassisk burger',
      price: 85,
      category: 'Main',
      allergens: ['gluten'],
      ingredients: ['beef', 'bun'],
      available: true,
    },
    {
      id: '2',
      name: 'Pommes Frites',
      description: 'Sprøde pommes frites',
      price: 35,
      category: 'Sides',
      allergens: [],
      ingredients: ['potatoes'],
      available: true,
    },
  ];

  const mockMutate = jest.fn();
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: mockMenuItems,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    } as any);

    jest.clearAllMocks();
  });

  it('should render menu items correctly', () => {
    render(<PosInterface />);

    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Pommes Frites')).toBeInTheDocument();
    expect(screen.getByText('85 DKK')).toBeInTheDocument();
    expect(screen.getByText('35 DKK')).toBeInTheDocument();
  });

  it('should add items to cart when clicked', async () => {
    const user = userEvent.setup();
    render(<PosInterface />);

    const burgerButton = screen.getByText('Burger').closest('button');
    await user.click(burgerButton!);

    expect(screen.getByText('Kurv')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // quantity
  });

  it('should calculate Danish VAT correctly (25%)', async () => {
    const user = userEvent.setup();
    render(<PosInterface />);

    // Add burger to cart
    const burgerButton = screen.getByText('Burger').closest('button');
    await user.click(burgerButton!);

    // Check calculations
    const subtotal = 85 - (85 * 0.25); // Remove VAT from total
    const vatAmount = 85 * 0.25; // 25% VAT
    
    expect(screen.getByText(`${subtotal.toFixed(2)} DKK`)).toBeInTheDocument();
    expect(screen.getByText(`${vatAmount.toFixed(2)} DKK`)).toBeInTheDocument();
    expect(screen.getByText('85.00 DKK')).toBeInTheDocument(); // Total
  });

  it('should filter items by category', async () => {
    const user = userEvent.setup();
    render(<PosInterface />);

    // Click on Main category
    const mainCategoryButton = screen.getByText('Main');
    await user.click(mainCategoryButton);

    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.queryByText('Pommes Frites')).not.toBeInTheDocument();
  });

  it('should process payment when payment button is clicked', async () => {
    const user = userEvent.setup();
    render(<PosInterface />);

    // Add item to cart
    const burgerButton = screen.getByText('Burger').closest('button');
    await user.click(burgerButton!);

    // Click Dankort payment
    const dankortButton = screen.getByText('Dankort');
    await user.click(dankortButton);

    expect(mockMutate).toHaveBeenCalledWith({
      items: expect.arrayContaining([
        expect.objectContaining({
          menuItemId: '1',
          name: 'Burger',
          price: 85,
          quantity: 1,
        }),
      ]),
      paymentMethod: 'DANKORT',
      totalAmount: 85,
      vatAmount: 85 * 0.25,
    });
  });

  it('should update item quantities correctly', async () => {
    const user = userEvent.setup();
    render(<PosInterface />);

    // Add burger to cart
    const burgerButton = screen.getByText('Burger').closest('button');
    await user.click(burgerButton!);

    // Increase quantity
    const increaseButton = screen.getByText('+');
    await user.click(increaseButton);

    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByText('170.00 DKK')).toBeInTheDocument(); // 85 * 2
  });

  it('should remove items when quantity reaches 0', async () => {
    const user = userEvent.setup();
    render(<PosInterface />);

    // Add burger to cart
    const burgerButton = screen.getByText('Burger').closest('button');
    await user.click(burgerButton!);

    // Decrease quantity to 0
    const decreaseButton = screen.getByText('-');
    await user.click(decreaseButton);

    expect(screen.getByText('Kurven er tom')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<PosInterface />);

    // Should render without crashing during loading
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('should display all payment methods', async () => {
    const user = userEvent.setup();
    render(<PosInterface />);

    // Add item to cart first
    const burgerButton = screen.getByText('Burger').closest('button');
    await user.click(burgerButton!);

    expect(screen.getByText('Dankort')).toBeInTheDocument();
    expect(screen.getByText('MobilePay')).toBeInTheDocument();
    expect(screen.getByText('Kontant')).toBeInTheDocument();
  });
});
