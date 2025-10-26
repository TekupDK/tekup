import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

/**
 * CSS Spacing Assertions
 * Validates design system consistency across components
 */

interface SpacingTest {
    component: JSX.Element;
    testId: string;
    targetSelector: string;
    expectedGap: { min: number; max: number };
    description: string;
}

describe('CSS Spacing: Design Token Compliance', () => {
    /**
     * Helper function to measure gap between two elements
     */
    const measureGap = (element1: HTMLElement, element2: HTMLElement): number => {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        return Math.round(rect2.top - rect1.bottom);
    };

    it('Dashboard card title-to-content spacing is 16-20px', () => {
        const TestCard = () => (
            <div className="stat-card">
                <h3 data-testid="card-title">Kunder</h3>
                <div data-testid="card-content">Content here</div>
            </div>
        );

        render(<TestCard />);

        const title = screen.getByTestId('card-title');
        const content = screen.getByTestId('card-content');
        const gap = measureGap(title, content);

        expect(gap).toBeGreaterThanOrEqual(16); // Design token: --space-3
        expect(gap).toBeLessThanOrEqual(20);
    });

    it('Button padding follows 12px/16px standard', () => {
        const TestButton = () => (
            <button data-testid="primary-button" className="btn-primary">
                Test Button
            </button>
        );

        render(<TestButton />);

        const button = screen.getByTestId('primary-button');
        const styles = window.getComputedStyle(button);

        const paddingTop = parseInt(styles.paddingTop);
        const paddingBottom = parseInt(styles.paddingBottom);
        const paddingLeft = parseInt(styles.paddingLeft);
        const paddingRight = parseInt(styles.paddingRight);

        // Vertical padding: 12px
        expect(paddingTop).toBeGreaterThanOrEqual(10);
        expect(paddingTop).toBeLessThanOrEqual(14);
        expect(paddingBottom).toBeGreaterThanOrEqual(10);
        expect(paddingBottom).toBeLessThanOrEqual(14);

        // Horizontal padding: 16px
        expect(paddingLeft).toBeGreaterThanOrEqual(14);
        expect(paddingLeft).toBeLessThanOrEqual(18);
        expect(paddingRight).toBeGreaterThanOrEqual(14);
        expect(paddingRight).toBeLessThanOrEqual(18);
    });

    it('Form field spacing is consistent (8px)', () => {
        const TestForm = () => (
            <form data-testid="test-form">
                <div data-testid="field-1" className="form-field">
                    <label>Email</label>
                    <input type="email" />
                </div>
                <div data-testid="field-2" className="form-field">
                    <label>Password</label>
                    <input type="password" />
                </div>
            </form>
        );

        render(<TestForm />);

        const field1 = screen.getByTestId('field-1');
        const field2 = screen.getByTestId('field-2');
        const gap = measureGap(field1, field2);

        expect(gap).toBeGreaterThanOrEqual(6); // --space-2: 8px
        expect(gap).toBeLessThanOrEqual(10);
    });

    it('Typography line-height is readable (1.5-1.8)', () => {
        const TestTypography = () => (
            <div>
                <p data-testid="body-text" className="text-body">
                    Dette er brødtekst der skal være læsbar og følge design systemets regler.
                </p>
            </div>
        );

        render(<TestTypography />);

        const text = screen.getByTestId('body-text');
        const styles = window.getComputedStyle(text);
        const fontSize = parseFloat(styles.fontSize);
        const lineHeight = parseFloat(styles.lineHeight);
        const ratio = lineHeight / fontSize;

        expect(ratio).toBeGreaterThanOrEqual(1.4);
        expect(ratio).toBeLessThanOrEqual(1.9);
    });

    it('Card border-radius follows design system (8px)', () => {
        const TestCard = () => (
            <div data-testid="glass-card" className="glass-card">
                Card content
            </div>
        );

        render(<TestCard />);

        const card = screen.getByTestId('glass-card');
        const styles = window.getComputedStyle(card);
        const borderRadius = parseInt(styles.borderRadius);

        expect(borderRadius).toBeGreaterThanOrEqual(6);
        expect(borderRadius).toBeLessThanOrEqual(10);
    });

    it('Grid gap between dashboard cards is 24px', () => {
        const TestGrid = () => (
            <div className="grid grid-cols-3 gap-6" data-testid="card-grid">
                <div data-testid="card-1" className="stat-card">Card 1</div>
                <div data-testid="card-2" className="stat-card">Card 2</div>
            </div>
        );

        render(<TestGrid />);

        const grid = screen.getByTestId('card-grid');
        const styles = window.getComputedStyle(grid);
        const gap = parseInt(styles.gap);

        expect(gap).toBeGreaterThanOrEqual(20); // gap-6 = 24px
        expect(gap).toBeLessThanOrEqual(28);
    });

    it('Container max-width is 1440px on large screens', () => {
        const TestContainer = () => (
            <div data-testid="main-container" className="container mx-auto">
                Main content
            </div>
        );

        render(<TestContainer />);

        const container = screen.getByTestId('main-container');
        const styles = window.getComputedStyle(container);
        const maxWidth = parseInt(styles.maxWidth);

        // Allow some flexibility for different screen sizes
        expect(maxWidth).toBeGreaterThanOrEqual(1200);
        expect(maxWidth).toBeLessThanOrEqual(1536);
    });
});

describe('CSS Spacing: Motion Sensitivity', () => {
    it('prefers-reduced-motion disables transitions', () => {
        // Mock matchMedia for prefers-reduced-motion
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                onchange: null,
                addListener: () => { },
                removeListener: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => true,
            }),
        });

        const TestElement = () => (
            <button data-testid="animated-button" className="btn-primary">
                Click me
            </button>
        );

        render(<TestElement />);

        const button = screen.getByTestId('animated-button');
        const styles = window.getComputedStyle(button);

        // When prefers-reduced-motion is enabled, transitions should be minimal
        const transitionDuration = parseFloat(styles.transitionDuration);
        expect(transitionDuration).toBeLessThan(0.1); // < 100ms
    });
});

describe('CSS Spacing: Accessibility', () => {
    it('focus outlines are visible and sized properly', () => {
        const TestButton = () => (
            <button data-testid="focusable-button" className="btn-primary">
                Focus me
            </button>
        );

        render(<TestButton />);

        const button = screen.getByTestId('focusable-button');
        button.focus();

        const styles = window.getComputedStyle(button);
        const outlineWidth = parseInt(styles.outlineWidth);

        // Focus outline should be at least 2px (WCAG 2.1)
        expect(outlineWidth).toBeGreaterThanOrEqual(2);
    });

    it('minimum touch target size is 44×44px (WCAG 2.1)', () => {
        const TestButton = () => (
            <button data-testid="touch-button" className="btn-primary">
                Tap me
            </button>
        );

        render(<TestButton />);

        const button = screen.getByTestId('touch-button');
        const rect = button.getBoundingClientRect();

        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
    });
});
