/**
 * Standardized status color mapping using theme variables
 * Ensures consistent styling across all components
 */

export const getStatusBadgeClass = (status: string): string => {
    const statusLower = status.toLowerCase();

    // Lead statuses
    if (statusLower.includes('new') || statusLower.includes('ny')) {
        return 'bg-primary/10 text-primary border border-primary/20';
    }
    if (statusLower.includes('contacted') || statusLower.includes('kontaktet')) {
        return 'bg-accent/10 text-accent border border-accent/20';
    }
    if (statusLower.includes('qualified') || statusLower.includes('kvalificeret')) {
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
    }
    if (statusLower.includes('quoted') || statusLower.includes('tilbud')) {
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    }
    if (statusLower.includes('won') || statusLower.includes('vundet')) {
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
    }
    if (statusLower.includes('lost') || statusLower.includes('tabt')) {
        return 'bg-destructive/10 text-destructive border border-destructive/20';
    }

    // Booking statuses
    if (statusLower.includes('scheduled') || statusLower.includes('planlagt')) {
        return 'bg-primary/10 text-primary border border-primary/20';
    }
    if (statusLower.includes('confirmed') || statusLower.includes('bekræftet')) {
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
    }
    if (statusLower.includes('pending') || statusLower.includes('afventer')) {
        return 'bg-accent/10 text-accent border border-accent/20';
    }
    if (statusLower.includes('completed') || statusLower.includes('gennemført')) {
        return 'bg-muted/50 text-muted-foreground border border-muted/30';
    }
    if (statusLower.includes('cancelled') || statusLower.includes('annulleret')) {
        return 'bg-destructive/10 text-destructive border border-destructive/20';
    }

    // Default
    return 'bg-muted/50 text-muted-foreground border border-muted/30';
};

export const getStatusIcon = (status: string): string => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('confirmed') || statusLower.includes('bekræftet') || statusLower.includes('won')) {
        return '✓';
    }
    if (statusLower.includes('cancelled') || statusLower.includes('annulleret') || statusLower.includes('lost')) {
        return '✕';
    }
    if (statusLower.includes('pending') || statusLower.includes('afventer') || statusLower.includes('new')) {
        return '⏳';
    }
    if (statusLower.includes('completed') || statusLower.includes('gennemført')) {
        return '✓';
    }

    return '●';
};
