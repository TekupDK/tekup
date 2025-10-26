import express, { Request, Response } from "express";
import { cache } from "../services/cacheService";
import { prisma } from "../services/databaseService";
import { updateCustomerStats } from "../services/customerService";
import { logger } from "../logger";
import { dashboardDataService } from "../services/dashboardDataService";
import { isLiveMode, isAutoResponseEnabled, isFollowUpEnabled, isEscalationEnabled } from "../config";

const router = express.Router();

/**
 * Dashboard API Routes
 * 
 * Provides data endpoints for the monitoring dashboard
 */

// Health check
router.get("/health", (_req: Request, res: Response) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

// Environment status - CRITICAL for safety monitoring
router.get("/environment/status", (_req: Request, res: Response) => {
    const autoResponseEnabled = isAutoResponseEnabled();
    const followUpEnabled = isFollowUpEnabled();
    const escalationEnabled = isEscalationEnabled();

    // Calculate risk level
    let riskLevel: 'safe' | 'caution' | 'danger' = 'safe';
    let warnings: string[] = [];

    if (isLiveMode) {
        if (autoResponseEnabled) {
            riskLevel = 'danger';
            warnings.push('AUTO-RESPONSE AKTIVERET I LIVE MODE - Emails sendes automatisk til kunder!');
        }
        if (followUpEnabled) {
            riskLevel = riskLevel === 'danger' ? 'danger' : 'caution';
            warnings.push('FOLLOW-UP AKTIVERET I LIVE MODE - Automatiske follow-up emails sendes.');
        }
        if (riskLevel === 'safe') {
            warnings.push('Live mode aktiv, men alle auto-send features er deaktiveret (sikkert).');
        }
    } else {
        warnings.push('Dry-run mode - Ingen emails sendes (100% sikkert).');
    }

    res.json({
        runMode: isLiveMode ? 'live' : 'dry-run',
        isLiveMode,
        features: {
            autoResponse: {
                enabled: autoResponseEnabled,
                safe: !autoResponseEnabled || !isLiveMode,
                description: 'Automatisk generering og afsendelse af email-svar til nye leads'
            },
            followUp: {
                enabled: followUpEnabled,
                safe: !followUpEnabled || !isLiveMode,
                description: 'Automatisk follow-up emails efter 3-5 dage uden respons'
            },
            escalation: {
                enabled: escalationEnabled,
                safe: true, // Always safe - only notifies Jonas
                description: 'Automatisk eskalering af konflikter til Jonas'
            }
        },
        riskLevel,
        warnings,
        recommendation: riskLevel === 'danger'
            ? 'DEAKTIVER AUTO-SEND NU - Gå til Render.com og sæt AUTO_RESPONSE_ENABLED=false'
            : riskLevel === 'caution'
                ? 'Vær opmærksom - automatiske emails sendes. Overvåg nøje.'
                : 'Alt er sikkert - ingen automatiske emails sendes.'
    });
});

// Email quality monitoring
router.get("/email-quality/recent", (_req: Request, res: Response) => {
    void (async () => {
        try {
            // Fetch recent pending email responses with potential quality issues
            const recentEmails = await prisma.emailResponse.findMany({
                where: {
                    status: {
                        in: ['pending', 'approved']
                    }
                },
                include: {
                    lead: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 20
            });

            // Apply quality checks to each email
            const emailsWithQuality = recentEmails.map(email => {
                const qualityIssues: string[] = [];
                let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

                // Check for placeholders
                const placeholderPattern = /\[(?:Ukendt|X|Y|navn|adresse)\]/gi;
                const placeholders = email.body?.match(placeholderPattern);
                if (placeholders && placeholders.length > 0) {
                    qualityIssues.push(`Placeholders: ${placeholders.join(", ")}`);
                    severity = 'critical';
                }

                // Check for after-hours times
                const afterHoursPattern = /kl\.\s*(1[8-9]|2[0-3]|0[0-7]):[0-5][0-9]/g;
                const afterHoursTimes = email.body?.match(afterHoursPattern);
                if (afterHoursTimes && afterHoursTimes.length > 0) {
                    qualityIssues.push(`Efter åbningstid: ${afterHoursTimes.join(", ")}`);
                    severity = severity === 'critical' ? 'critical' : 'high';
                }

                // Check for missing recipient name
                if (!email.body?.includes("Hej ") || email.body?.includes("Hej !")) {
                    qualityIssues.push("Mangler modtagers navn");
                    severity = severity === 'critical' || severity === 'high' ? severity : 'medium';
                }

                // Check for very short body
                if (email.body && email.body.length < 100) {
                    qualityIssues.push("Email er meget kort (< 100 tegn)");
                    severity = severity === 'critical' || severity === 'high' ? severity : 'medium';
                }

                // Check subject line
                if (!email.subject || email.subject.length < 5) {
                    qualityIssues.push("Emne-linje er tom eller for kort");
                    severity = 'high';
                }

                return {
                    id: email.id,
                    leadId: email.leadId,
                    recipientEmail: email.recipientEmail,
                    subject: email.subject,
                    bodyPreview: email.body?.substring(0, 200),
                    status: email.status,
                    createdAt: email.createdAt,
                    lead: email.lead,
                    qualityIssues,
                    severity,
                    hasIssues: qualityIssues.length > 0
                };
            });

            // Filter only emails with issues
            const problematicEmails = emailsWithQuality.filter(e => e.hasIssues);

            res.json({
                emails: problematicEmails,
                total: problematicEmails.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error({ error }, "Failed to fetch email quality data");
            res.status(500).json({
                error: "Failed to fetch email quality data"
            });
        }
    })();
});

// Email quality statistics
router.get("/email-quality/stats", (_req: Request, res: Response) => {
    void (async () => {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            // Fetch emails from last 7 days
            const recentEmails = await prisma.emailResponse.findMany({
                where: {
                    createdAt: {
                        gte: oneWeekAgo
                    }
                },
                select: {
                    id: true,
                    subject: true,
                    body: true,
                    status: true,
                    createdAt: true,
                    rejectedReason: true
                }
            });

            // Calculate stats
            let totalChecked = recentEmails.length;
            let totalIssues = 0;
            let criticalIssues = 0;
            let highIssues = 0;
            let mediumIssues = 0;
            let rejectedCount = recentEmails.filter(e => e.status === 'rejected').length;

            // Apply quality checks
            recentEmails.forEach(email => {
                let hasIssues = false;
                let severity: 'critical' | 'high' | 'medium' = 'medium';

                // Check for placeholders
                const placeholders = email.body?.match(/\[(?:Ukendt|X|Y|navn|adresse)\]/gi);
                if (placeholders && placeholders.length > 0) {
                    hasIssues = true;
                    severity = 'critical';
                }

                // Check for after-hours times
                const afterHoursTimes = email.body?.match(/kl\.\s*(1[8-9]|2[0-3]|0[0-7]):[0-5][0-9]/g);
                if (afterHoursTimes && afterHoursTimes.length > 0) {
                    hasIssues = true;
                    if (severity !== 'critical') severity = 'high';
                }

                // Check for missing name or short body
                if (!email.body?.includes("Hej ") || (email.body && email.body.length < 100)) {
                    hasIssues = true;
                    // Don't downgrade severity
                }

                if (hasIssues) {
                    totalIssues++;
                    if (severity === 'critical') criticalIssues++;
                    else if (severity === 'high') highIssues++;
                    else mediumIssues++;
                }
            });

            // Calculate percentages
            const qualityScore = totalChecked > 0
                ? Math.round(((totalChecked - totalIssues) / totalChecked) * 100)
                : 100;

            res.json({
                period: '7 days',
                totalChecked,
                totalIssues,
                issueBreakdown: {
                    critical: criticalIssues,
                    high: highIssues,
                    medium: mediumIssues
                },
                rejected: rejectedCount,
                qualityScore,
                last24Hours: {
                    checked: recentEmails.filter(e => e.createdAt >= oneDayAgo).length,
                    issues: recentEmails.filter(e => {
                        if (e.createdAt < oneDayAgo) return false;
                        const hasPlaceholders = e.body?.match(/\[(?:Ukendt|X|Y)\]/gi);
                        const hasAfterHours = e.body?.match(/kl\.\s*(1[8-9]|2[0-3]|0[0-7]):[0-5][0-9]/g);
                        return hasPlaceholders || hasAfterHours;
                    }).length
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error({ error }, "Failed to calculate email quality stats");
            res.status(500).json({
                error: "Failed to calculate email quality stats"
            });
        }
    })();
});

// Follow-up tracking
router.get("/follow-ups/pending", (_req: Request, res: Response) => {
    void (async () => {
        try {
            // Find leads needing follow-up based on lastFollowUpDate and status
            const now = new Date();
            const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

            // Get leads that need follow-up
            const pendingLeads = await prisma.lead.findMany({
                where: {
                    OR: [
                        {
                            // Never followed up but quote sent 5+ days ago
                            status: 'quote_sent',
                            lastFollowUpDate: null,
                            createdAt: {
                                lte: fiveDaysAgo
                            }
                        },
                        {
                            // Follow-up sent 5+ days ago, no response
                            status: {
                                in: ['awaiting_response', 'quote_sent']
                            },
                            lastFollowUpDate: {
                                lte: fiveDaysAgo
                            },
                            followUpAttempts: {
                                lt: 3
                            }
                        },
                        {
                            // Recent follow-up needed (3-5 days)
                            status: 'awaiting_response',
                            lastFollowUpDate: {
                                gte: fiveDaysAgo,
                                lte: threeDaysAgo
                            },
                            followUpAttempts: {
                                lt: 3
                            }
                        }
                    ]
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    lastFollowUpDate: 'asc' // Oldest first (most urgent)
                },
                take: 20
            });

            // Calculate days since last contact for each lead
            const leadsWithStats = pendingLeads.map(lead => {
                const lastContactDate = lead.lastFollowUpDate || lead.createdAt;
                const daysSinceContact = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

                // Determine urgency
                let urgency: 'high' | 'medium' | 'low' = 'low';
                if (daysSinceContact >= 10) urgency = 'high';
                else if (daysSinceContact >= 7) urgency = 'medium';

                return {
                    id: lead.id,
                    name: lead.name,
                    email: lead.email,
                    status: lead.status,
                    followUpAttempts: lead.followUpAttempts,
                    lastFollowUpDate: lead.lastFollowUpDate,
                    createdAt: lead.createdAt,
                    daysSinceContact,
                    urgency,
                    nextAttemptNumber: lead.followUpAttempts + 1,
                    customer: lead.customer
                };
            });

            res.json({
                leads: leadsWithStats,
                total: leadsWithStats.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error({ error }, "Failed to fetch pending follow-ups");
            res.status(500).json({
                error: "Failed to fetch pending follow-ups"
            });
        }
    })();
});

// Follow-up statistics
router.get("/follow-ups/stats", (_req: Request, res: Response) => {
    void (async () => {
        try {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Total follow-ups sent
            const totalFollowUpsSent = await prisma.lead.count({
                where: {
                    followUpAttempts: {
                        gt: 0
                    }
                }
            });

            // Follow-ups needing attention (5+ days since last contact)
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            const needingAttention = await prisma.lead.count({
                where: {
                    status: {
                        in: ['awaiting_response', 'quote_sent']
                    },
                    OR: [
                        {
                            lastFollowUpDate: {
                                lte: fiveDaysAgo
                            },
                            followUpAttempts: {
                                lt: 3
                            }
                        },
                        {
                            lastFollowUpDate: null,
                            createdAt: {
                                lte: fiveDaysAgo
                            }
                        }
                    ]
                }
            });

            // Success rate (leads that converted after follow-up)
            const followedUpLeads = await prisma.lead.findMany({
                where: {
                    followUpAttempts: {
                        gt: 0
                    },
                    lastFollowUpDate: {
                        gte: thirtyDaysAgo
                    }
                },
                select: {
                    id: true,
                    status: true,
                    followUpAttempts: true
                }
            });

            const convertedLeads = followedUpLeads.filter(
                lead => lead.status === 'converted' || lead.status === 'won'
            );

            const successRate = followedUpLeads.length > 0
                ? Math.round((convertedLeads.length / followedUpLeads.length) * 100)
                : 0;

            // Average attempts before conversion
            const avgAttempts = convertedLeads.length > 0
                ? Math.round(
                    convertedLeads.reduce((sum, lead) => sum + lead.followUpAttempts, 0) / convertedLeads.length
                )
                : 0;

            // Last 7 days activity
            const recentFollowUps = await prisma.lead.count({
                where: {
                    lastFollowUpDate: {
                        gte: oneWeekAgo
                    }
                }
            });

            // Breakdown by attempt number
            const attempt1 = await prisma.lead.count({
                where: { followUpAttempts: 1, lastFollowUpDate: { gte: thirtyDaysAgo } }
            });
            const attempt2 = await prisma.lead.count({
                where: { followUpAttempts: 2, lastFollowUpDate: { gte: thirtyDaysAgo } }
            });
            const attempt3 = await prisma.lead.count({
                where: { followUpAttempts: { gte: 3 }, lastFollowUpDate: { gte: thirtyDaysAgo } }
            });

            res.json({
                period: '30 days',
                totalFollowUpsSent,
                needingAttention,
                successRate,
                avgAttempts,
                recentActivity: {
                    last7Days: recentFollowUps
                },
                attemptBreakdown: {
                    attempt1,
                    attempt2,
                    attempt3Plus: attempt3
                },
                converted: convertedLeads.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error({ error }, "Failed to calculate follow-up stats");
            res.status(500).json({
                error: "Failed to calculate follow-up stats"
            });
        }
    })();
});

// Rate limiting monitoring
router.get("/rate-limits/status", (_req: Request, res: Response) => {
    void (async () => {
        try {
            // Import rate limit functions from emailGateway
            const { getRateLimitStatus } = await import("../services/emailGateway");

            // Track common sources
            const sources = [
                'email-auto-response',
                'follow-up-service',
                'quote-service',
                'manual-send',
                'escalation-service'
            ];

            const limits = sources.map(source => {
                const status = getRateLimitStatus(source);
                const maxPerWindow = 10;
                const usagePercent = Math.round((status.count / maxPerWindow) * 100);

                return {
                    source,
                    current: status.count,
                    max: maxPerWindow,
                    remaining: status.remaining,
                    usagePercent,
                    windowStart: status.windowStart,
                    status: status.count >= maxPerWindow ? 'blocked' :
                        status.count >= 8 ? 'warning' :
                            'ok'
                };
            });

            // Calculate totals
            const totalSent = limits.reduce((sum, l) => sum + l.current, 0);
            const totalCapacity = limits.reduce((sum, l) => sum + l.max, 0);
            const totalRemaining = limits.reduce((sum, l) => sum + l.remaining, 0);

            // Overall system status
            const systemStatus = limits.some(l => l.status === 'blocked') ? 'blocked' :
                limits.some(l => l.status === 'warning') ? 'warning' :
                    'ok';

            res.json({
                limits,
                summary: {
                    totalSent,
                    totalCapacity,
                    totalRemaining,
                    systemStatus,
                    window: '5 minutes',
                    maxPerSource: 10
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error({ error }, "Failed to fetch rate limit status");
            res.status(500).json({
                error: "Failed to fetch rate limit status"
            });
        }
    })();
});

// Rate limit history (from EmailResponse table)
router.get("/rate-limits/history", (_req: Request, res: Response) => {
    void (async () => {
        try {
            // Get email sends from last 24 hours grouped by hour
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const recentEmails = await prisma.emailResponse.findMany({
                where: {
                    createdAt: {
                        gte: twentyFourHoursAgo
                    },
                    status: {
                        in: ['sent', 'approved']
                    }
                },
                select: {
                    createdAt: true,
                    aiModel: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            // Group by hour
            const hourlyData = new Map<string, number>();
            recentEmails.forEach(email => {
                const hour = new Date(email.createdAt).toISOString().substring(0, 13) + ':00:00';
                hourlyData.set(hour, (hourlyData.get(hour) || 0) + 1);
            });

            // Convert to array
            const history = Array.from(hourlyData.entries()).map(([hour, count]) => ({
                timestamp: hour,
                count,
                status: count >= 50 ? 'exceeded' : // 50 per hour limit
                    count >= 40 ? 'warning' :
                        'ok'
            }));

            // Calculate stats
            const totalSent = recentEmails.length;
            const avgPerHour = Math.round(totalSent / 24);
            const peakHour = history.length > 0
                ? history.reduce((max, curr) => curr.count > max.count ? curr : max, history[0])
                : null;

            res.json({
                history,
                stats: {
                    totalSent24h: totalSent,
                    avgPerHour,
                    peakHour: peakHour ? {
                        timestamp: peakHour.timestamp,
                        count: peakHour.count
                    } : null
                },
                limits: {
                    perHour: 50,
                    per5Min: 10
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error({ error }, "Failed to fetch rate limit history");
            res.status(500).json({
                error: "Failed to fetch rate limit history"
            });
        }
    })();
});

// Dashboard overview stats
router.get("/stats/overview", (req: Request, res: Response) => {
    void (async () => {
        try {
            const period = req.query.period as string || "30d";
            const now = new Date();
            let currentStartDate: Date;
            let previousStartDate: Date;
            let previousEndDate: Date;

            // Calculate date ranges based on period
            switch (period) {
                case "7d":
                    currentStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                    previousEndDate = currentStartDate;
                    break;
                case "30d":
                    currentStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                    previousEndDate = currentStartDate;
                    break;
                case "90d":
                    currentStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                    previousEndDate = currentStartDate;
                    break;
                default:
                    currentStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                    previousEndDate = currentStartDate;
            }

            // Get current period stats
            const [
                totalCustomers,
                totalLeads,
                totalBookings,
                totalQuotes,
                activeConversations,
            ] = await Promise.all([
                prisma.customer.count({ where: { status: "active" } }),
                prisma.lead.count(),
                prisma.booking.count(),
                prisma.quote.count(),
                prisma.conversation.count({ where: { status: "active" } }),
            ]);

            // Get previous period stats for comparison
            const [
                previousCustomers,
                previousLeads,
                previousBookings,
                previousQuotes,
            ] = await Promise.all([
                prisma.customer.count({
                    where: {
                        status: "active",
                        createdAt: { gte: previousStartDate, lt: previousEndDate }
                    }
                }),
                prisma.lead.count({
                    where: { createdAt: { gte: previousStartDate, lt: previousEndDate } }
                }),
                prisma.booking.count({
                    where: { createdAt: { gte: previousStartDate, lt: previousEndDate } }
                }),
                prisma.quote.count({
                    where: { createdAt: { gte: previousStartDate, lt: previousEndDate } }
                }),
            ]);

            // Calculate percentage changes
            const calculateChange = (current: number, previous: number): number => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            const customersChange = calculateChange(totalCustomers, previousCustomers);
            const leadsChange = calculateChange(totalLeads, previousLeads);
            const bookingsChange = calculateChange(totalBookings, previousBookings);
            const quotesChange = calculateChange(totalQuotes, previousQuotes);

            // Calculate total revenue from accepted quotes
            const acceptedQuotes = await prisma.quote.findMany({
                where: { status: "accepted" },
                select: { total: true },
            });
            const totalRevenue = acceptedQuotes.reduce(
                (sum, quote) => sum + quote.total,
                0
            );

            res.json({
                customers: totalCustomers,
                leads: totalLeads,
                bookings: totalBookings,
                quotes: totalQuotes,
                conversations: activeConversations,
                revenue: totalRevenue,
                customersChange,
                leadsChange,
                bookingsChange,
                quotesChange,
            });
        } catch (error) {
            logger.error({ error }, "Failed to fetch overview stats");
            res.status(500).json({ error: "Failed to fetch overview stats" });
        }
    })();
});

// Recent leads
router.get("/leads/recent", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const leads = await prisma.lead.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    customer: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    quotes: {
                        select: {
                            status: true,
                            total: true,
                        },
                    },
                    bookings: {
                        select: {
                            status: true,
                            startTime: true,
                        },
                    },
                },
            });

            res.json(leads);
        } catch (error) {
            logger.error({ error }, "Failed to fetch recent leads");
            res.status(500).json({ error: "Failed to fetch leads" });
        }
    })();
});

// Lead pipeline stats (by status)
router.get("/leads/pipeline", (req: Request, res: Response) => {
    void (async () => {
        try {
            const pipeline = await prisma.lead.groupBy({
                by: ["status"],
                _count: true,
            });

            const formatted = pipeline.map((item) => ({
                status: item.status,
                count: item._count,
            }));

            res.json(formatted);
        } catch (error) {
            logger.error({ error }, "Failed to fetch lead pipeline");
            res.status(500).json({ error: "Failed to fetch pipeline" });
        }
    })();
});

// Recent bookings
router.get("/bookings/recent", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const bookings = await prisma.booking.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            taskType: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

            res.json(bookings);
        } catch (error) {
            logger.error({ error }, "Failed to fetch recent bookings");
            res.status(500).json({ error: "Failed to fetch bookings" });
        }
    })();
});

// Upcoming bookings
router.get("/bookings/upcoming", (req: Request, res: Response) => {
    void (async () => {
        try {
            const now = new Date();

            // Helper: Extract a best-effort customer object from free-form notes when relations are missing
            const extractCustomerFromNotes = (notes?: string): { id: null; name?: string; email?: string } | null => {
                if (!notes) return null;

                // Try to extract email from mailto links first
                const mailtoMatch = notes.match(/mailto:([^"'>\s]+)/i);
                const emailFromMailto = mailtoMatch?.[1]?.trim();

                // Fallback: plain email pattern anywhere in text
                const plainEmailMatch = notes.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
                const email = (emailFromMailto || plainEmailMatch?.[0])?.trim();

                // Extract name from "Kunde: <name>" pattern; optionally ignore anything inside parentheses
                // Examples:
                //  "Kunde: Juliane Wibroe (Juliane Andersen)"
                //  "Kunde: Hans Henrik Schou og Jytte"
                const kundeLineMatch = notes.match(/Kunde:\s*([^\n<]+)/i); // stop at newline or tag start
                let rawName = kundeLineMatch?.[1]?.trim();
                if (rawName) {
                    // Remove trailing parentheses block, keep the main display name
                    rawName = rawName.replace(/\s*\([^)]*\)\s*$/, "").trim();
                }

                if (!rawName && email) {
                    // As a last resort, use local-part as pseudo name
                    rawName = email.split("@")[0].replace(/[._-]+/g, " ");
                }

                if (!rawName && !email) return null;
                return { id: null, name: rawName || undefined, email: email || undefined };
            };

            const bookings = await prisma.booking.findMany({
                where: {
                    startTime: { gte: now },
                    status: { in: ["scheduled", "confirmed"] },
                },
                orderBy: { startTime: "asc" },
                take: 20,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            taskType: true,
                            address: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

            // Post-process to ensure a customer object is available when possible
            const enriched = bookings.map((b) => {
                const directCustomer = b.customer;
                const leadCustomer = b.lead?.customer;
                // Safely read optional notes without using any
                const notesVal: string | undefined = (b as { notes?: string | null }).notes ?? undefined;
                const fallback = (!directCustomer && !leadCustomer) ? extractCustomerFromNotes(notesVal) : null;

                // Compose a synthetic customer precedence: direct > lead.customer > parsed-notes
                const displayCustomer = directCustomer || leadCustomer || fallback || null;

                // Return a shallow-cloned object with "customer" ensured (id may be null for fallback)
                return {
                    ...b,
                    customer: displayCustomer,
                };
            });

            res.json(enriched);
        } catch (error) {
            logger.error({ error }, "Failed to fetch upcoming bookings");
            res.status(500).json({ error: "Failed to fetch bookings" });
        }
    })();
});

// Email activity stats
router.get("/emails/activity", (req: Request, res: Response) => {
    void (async () => {
        try {
            const days = parseInt(req.query.days as string) || 7;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const messages = await prisma.emailMessage.findMany({
                where: {
                    sentAt: { gte: startDate },
                },
                select: {
                    direction: true,
                    isAiGenerated: true,
                    aiModel: true,
                    sentAt: true,
                },
            });

            // Group by day and direction
            const activity = messages.reduce((acc, msg) => {
                const day = msg.sentAt.toISOString().split("T")[0];
                if (!acc[day]) {
                    acc[day] = { inbound: 0, outbound: 0, aiGenerated: 0 };
                }
                if (msg.direction === "inbound") {
                    acc[day].inbound++;
                } else {
                    acc[day].outbound++;
                    if (msg.isAiGenerated) {
                        acc[day].aiGenerated++;
                    }
                }
                return acc;
            }, {} as Record<string, { inbound: number; outbound: number; aiGenerated: number }>);

            res.json(activity);
        } catch (error) {
            logger.error({ error }, "Failed to fetch email activity");
            res.status(500).json({ error: "Failed to fetch email activity" });
        }
    })();
});

// AI performance metrics
router.get("/ai/metrics", (req: Request, res: Response) => {
    void (async () => {
        try {
            const totalMessages = await prisma.emailMessage.count({
                where: { isAiGenerated: true },
            });

            const byModel = await prisma.emailMessage.groupBy({
                by: ["aiModel"],
                where: { isAiGenerated: true },
                _count: true,
            });

            const modelStats = byModel.map((item) => ({
                model: item.aiModel || "unknown",
                count: item._count,
            }));

            res.json({
                total: totalMessages,
                byModel: modelStats,
            });
        } catch (error) {
            logger.error({ error }, "Failed to fetch AI metrics");
            res.status(500).json({ error: "Failed to fetch AI metrics" });
        }
    })();
});

// Cache statistics
router.get("/cache/stats", (_req: Request, res: Response) => {
    try {
        const stats = cache.getStats();
        const hitRate = cache.getHitRate();

        res.json({
            hits: stats.hits,
            misses: stats.misses,
            size: stats.size,
            hitRate: (hitRate * 100).toFixed(2) + "%",
        });
    } catch (error) {
        logger.error({ error }, "Failed to fetch cache stats");
        res.status(500).json({ error: "Failed to fetch cache stats" });
    }
});

// Top customers by revenue
router.get("/customers/top", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const customers = await prisma.customer.findMany({
                where: { status: "active" },
                orderBy: { totalRevenue: "desc" },
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    totalLeads: true,
                    totalBookings: true,
                    totalRevenue: true,
                    lastContactAt: true,
                },
            });

            res.json(customers);
        } catch (error) {
            logger.error({ error }, "Failed to fetch top customers");
            res.status(500).json({ error: "Failed to fetch customers" });
        }
    })();
});

// Revenue over time
router.get("/revenue/timeline", (req: Request, res: Response) => {
    void (async () => {
        try {
            const days = parseInt(req.query.days as string) || 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const quotes = await prisma.quote.findMany({
                where: {
                    status: "accepted",
                    updatedAt: { gte: startDate },
                },
                select: {
                    total: true,
                    updatedAt: true,
                },
                orderBy: { updatedAt: "asc" },
            });

            // Group by day
            const timeline = quotes.reduce((acc, quote) => {
                const day = quote.updatedAt.toISOString().split("T")[0];
                if (!acc[day]) {
                    acc[day] = 0;
                }
                acc[day] += quote.total;
                return acc;
            }, {} as Record<string, number>);

            res.json(timeline);
        } catch (error) {
            logger.error({ error }, "Failed to fetch revenue timeline");
            res.status(500).json({ error: "Failed to fetch revenue timeline" });
        }
    })();
});

// System health
router.get("/system/health", (req: Request, res: Response) => {
    void (async () => {
        try {
            // Check database connection
            await prisma.$queryRaw`SELECT 1`;

            const cacheStats = cache.getStats();

            res.json({
                status: "healthy",
                database: "connected",
                cache: {
                    size: cacheStats.size,
                    hitRate: cache.getHitRate(),
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error }, "Health check failed");
            res.status(500).json({
                status: "unhealthy",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    })();
});

// Revenue chart data
router.get("/revenue", (req: Request, res: Response) => {
    void (async () => {
        try {
            const period = (req.query.period as '24h' | '7d' | '30d' | '90d') || '7d';
            const data = await dashboardDataService.getRevenueTrend(period);
            res.json(data);
        } catch (error) {
            logger.error({ error }, "Failed to fetch revenue data");
            res.status(500).json({ error: "Failed to fetch revenue data" });
        }
    })();
});

// Service distribution chart data - Rendetalje.dk actual categories
router.get("/services", (req: Request, res: Response) => {
    void (async () => {
        try {
            const serviceDistribution = await dashboardDataService.getServiceDistribution();
            res.json(serviceDistribution);
        } catch (error) {
            logger.error({ error }, "Failed to fetch service distribution");
            res.status(500).json({ error: "Failed to fetch service distribution" });
        }
    })();
});

// Quote status tracking - NEW for dashboard upgrade
router.get("/quotes/status-tracking", (req: Request, res: Response) => {
    void (async () => {
        try {
            // Group quotes by status
            const quotesByStatus = await prisma.quote.groupBy({
                by: ["status"],
                _count: true,
                _sum: {
                    total: true,
                },
            });

            // Get recent quotes with full details
            const recentQuotes = await prisma.quote.findMany({
                take: 10,
                orderBy: { updatedAt: "desc" },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            });

            // Calculate conversion rate
            const totalQuotes = await prisma.quote.count();
            const acceptedQuotes = await prisma.quote.count({
                where: { status: "accepted" },
            });
            const conversionRate =
                totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

            // Calculate average quote value
            const avgQuoteValue =
                quotesByStatus.reduce((sum, s) => sum + (s._sum.total || 0), 0) /
                (totalQuotes || 1);

            res.json({
                byStatus: quotesByStatus.map((s) => ({
                    status: s.status,
                    count: s._count,
                    totalValue: s._sum.total || 0,
                })),
                recentQuotes,
                metrics: {
                    totalQuotes,
                    acceptedQuotes,
                    conversionRate: Math.round(conversionRate * 10) / 10,
                    avgQuoteValue: Math.round(avgQuoteValue),
                },
            });
        } catch (error) {
            logger.error({ error }, "Failed to fetch quote status tracking");
            res.status(500).json({ error: "Failed to fetch quote tracking data" });
        }
    })();
});

// Get all customers
router.get("/customers", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const status = req.query.status as string;

            const customers = await prisma.customer.findMany({
                where: status ? { status } : undefined,
                take: limit,
                orderBy: { lastContactAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    status: true,
                    totalLeads: true,
                    totalBookings: true,
                    totalRevenue: true,
                    lastContactAt: true,
                },
            });

            res.json(customers);
        } catch (error) {
            logger.error({ error }, "Failed to fetch customers");
            res.status(500).json({ error: "Failed to fetch customers" });
        }
    })();
});

// Create new customer
router.post("/customers", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { name, email, phone, address, companyName, notes } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Name is required" });
            }

            const customer = await prisma.customer.create({
                data: {
                    name,
                    email,
                    phone,
                    address,
                    companyName,
                    notes,
                    status: "active",
                    totalLeads: 0,
                    totalBookings: 0,
                    totalRevenue: 0,
                },
            });

            logger.info({ customerId: customer.id }, "Customer created via API");

            // Return customer with full statistics
            res.status(201).json({
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                status: customer.status,
                totalLeads: 0,
                totalBookings: 0,
                totalRevenue: 0,
                lastContactAt: customer.lastContactAt,
            });
        } catch (error) {
            logger.error({ error }, "Failed to create customer");
            res.status(500).json({ error: "Failed to create customer" });
        }
    })();
});

// Update customer
router.put("/customers/:id", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const { name, email, phone, address, companyName, notes, status } = req.body;

            const customer = await prisma.customer.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(email !== undefined && { email }),
                    ...(phone !== undefined && { phone }),
                    ...(address !== undefined && { address }),
                    ...(companyName !== undefined && { companyName }),
                    ...(notes !== undefined && { notes }),
                    ...(status && { status }),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    status: true,
                    totalLeads: true,
                    totalBookings: true,
                    totalRevenue: true,
                    lastContactAt: true,
                },
            });

            logger.info({ customerId: id }, "Customer updated via API");
            res.json(customer);
        } catch (error) {
            logger.error({ error }, "Failed to update customer");
            res.status(500).json({ error: "Failed to update customer" });
        }
    })();
});

// Delete customer
router.delete("/customers/:id", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;

            await prisma.customer.delete({
                where: { id },
            });

            logger.info({ customerId: id }, "Customer deleted via API");
            res.json({ success: true });
        } catch (error) {
            logger.error({ error }, "Failed to delete customer");
            res.status(500).json({ error: "Failed to delete customer" });
        }
    })();
});

// Email ingest endpoints
router.get("/email-ingest/stats", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { runEmailIngest } = await import("../services/emailIngestWorker");
            const stats = await runEmailIngest();

            res.json({
                success: true,
                stats,
                message: `Email ingest completed: ${stats.newThreads} new threads, ${stats.matchedThreads} matched`
            });
        } catch (error) {
            logger.error({ error }, "Email ingest failed");
            res.status(500).json({ error: "Email ingest failed" });
        }
    })();
});

// Customer 360 endpoints
router.get("/customers/:id/threads", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            const threads = await prisma.emailThread.findMany({
                where: { customerId: id },
                include: {
                    messages: {
                        orderBy: { sentAt: "desc" },
                        take: 1, // Latest message only
                    },
                },
                orderBy: { lastMessageAt: "desc" },
                take: limit,
                skip: offset,
            });

            const total = await prisma.emailThread.count({
                where: { customerId: id },
            });

            res.json({
                threads,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            logger.error({ error }, "Failed to fetch customer threads");
            res.status(500).json({ error: "Failed to fetch customer threads" });
        }
    })();
});

// Get customer leads (Customer 360)
router.get("/customers/:id/leads", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit as string) || 50;

            const leads = await prisma.lead.findMany({
                where: { customerId: id },
                include: {
                    quotes: {
                        select: {
                            id: true,
                            status: true,
                            total: true,
                        },
                    },
                    bookings: {
                        select: {
                            id: true,
                            status: true,
                            scheduledAt: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });

            res.json({ leads, total: leads.length });
        } catch (error) {
            logger.error({ error, customerId: req.params.id }, "Failed to fetch customer leads");
            res.status(500).json({ error: "Failed to fetch customer leads" });
        }
    })();
});

// Get customer bookings (Customer 360)
router.get("/customers/:id/bookings", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit as string) || 50;

            const bookings = await prisma.booking.findMany({
                where: { customerId: id },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            taskType: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });

            res.json({ bookings, total: bookings.length });
        } catch (error) {
            logger.error({ error, customerId: req.params.id }, "Failed to fetch customer bookings");
            res.status(500).json({ error: "Failed to fetch customer bookings" });
        }
    })();
});

router.get("/threads/:id/messages", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const expand = req.query.expand as string;

            const thread = await prisma.emailThread.findUnique({
                where: { id },
                include: {
                    messages: {
                        orderBy: { sentAt: "asc" },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            if (!thread) {
                return res.status(404).json({ error: "Thread not found" });
            }

            let messages = thread.messages;

            // If expand=body requested, include full message bodies
            if (expand === "body") {
                messages = messages.map(msg => ({
                    ...msg,
                    body: msg.body, // Include full body
                }));
            }

            res.json({
                thread,
                messages,
            });
        } catch (error) {
            logger.error({ error }, "Failed to fetch thread messages");
            res.status(500).json({ error: "Failed to fetch thread messages" });
        }
    })();
});

router.post("/threads/:id/reply", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const { body, dryRun = true } = req.body;

            const thread = await prisma.emailThread.findUnique({
                where: { id },
                include: { customer: true },
            });

            if (!thread) {
                return res.status(404).json({ error: "Thread not found" });
            }

            if (!thread.customer?.email) {
                return res.status(400).json({ error: "No customer email found" });
            }

            // Create reply message
            const replyMessage = await prisma.emailMessage.create({
                data: {
                    gmailThreadId: thread.gmailThreadId || "",
                    threadId: id,
                    from: "Rendetalje.dk <info@rendetalje.dk>",
                    to: [thread.customer.email],
                    subject: `Re: ${thread.subject}`,
                    body,
                    direction: "outbound",
                    isAiGenerated: false,
                    sentAt: new Date(),
                },
            });

            // If not dry run, actually send the email
            if (!dryRun) {
                const { sendGenericEmail } = await import("../services/gmailService");

                await sendGenericEmail({
                    to: thread.customer.email,
                    subject: `Re: ${thread.subject}`,
                    body,
                    threadId: thread.gmailThreadId,
                });

                // Update message status
                await prisma.emailMessage.update({
                    where: { id: replyMessage.id },
                    data: { status: "sent" },
                });
            }

            res.json({
                success: true,
                message: dryRun ? "Reply drafted" : "Reply sent",
                reply: replyMessage,
            });
        } catch (error) {
            logger.error({ error }, "Failed to send reply");
            res.status(500).json({ error: "Failed to send reply" });
        }
    })();
});

// Get unmatched threads for manual review
router.get("/threads/unmatched", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;

            const threads = await prisma.emailThread.findMany({
                where: { isMatched: false },
                include: {
                    messages: {
                        orderBy: { sentAt: "desc" },
                        take: 1,
                    },
                },
                orderBy: { lastMessageAt: "desc" },
                take: limit,
            });

            res.json({ threads });
        } catch (error) {
            logger.error({ error }, "Failed to fetch unmatched threads");
            res.status(500).json({ error: "Failed to fetch unmatched threads" });
        }
    })();
});

// Manually link thread to customer
router.post("/threads/:id/link-customer", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const { customerId } = req.body;

            const thread = await prisma.emailThread.update({
                where: { id },
                data: {
                    customerId,
                    isMatched: true,
                    matchedAt: new Date(),
                    matchedBy: "manual",
                    confidence: 1.0,
                },
            });

            res.json({ thread });
        } catch (error) {
            logger.error({ error }, "Failed to link thread to customer");
            res.status(500).json({ error: "Failed to link thread to customer" });
        }
    })();
});

// Get all leads
router.get("/leads", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const status = req.query.status as string;

            const leads = await prisma.lead.findMany({
                where: status ? { status } : undefined,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    customer: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            });

            res.json(leads);
        } catch (error) {
            logger.error({ error }, "Failed to fetch leads");
            res.status(500).json({ error: "Failed to fetch leads" });
        }
    })();
});

// Create new lead
router.post("/leads", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { name, email, phone, source, taskType, squareMeters, address, customerId } = req.body;

            const lead = await prisma.lead.create({
                data: {
                    name,
                    email,
                    phone,
                    source,
                    taskType,
                    squareMeters,
                    address,
                    customerId,
                    status: "new",
                },
            });

            // Update customer statistics if lead is linked to customer
            if (lead.customerId) {
                await updateCustomerStats(lead.customerId);
                logger.debug(
                    { customerId: lead.customerId, leadId: lead.id },
                    "Updated customer stats after lead creation via API"
                );
            }

            logger.info({ leadId: lead.id }, "Lead created via API");
            res.json(lead);
        } catch (error) {
            logger.error({ error }, "Failed to create lead");
            res.status(500).json({ error: "Failed to create lead" });
        }
    })();
});

// Update lead (full update, not just status)
router.put("/leads/:id", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const { name, email, phone, source, taskType, squareMeters, address, status } = req.body;

            const lead = await prisma.lead.update({
                where: { id },
                data: {
                    name,
                    email,
                    phone,
                    source,
                    taskType,
                    squareMeters,
                    address,
                    status,
                },
            });

            res.json(lead);
        } catch (error) {
            logger.error({ error }, "Failed to update lead");
            res.status(500).json({ error: "Failed to update lead" });
        }
    })();
});

// Delete lead
router.delete("/leads/:id", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;

            await prisma.lead.delete({
                where: { id },
            });

            logger.info({ leadId: id }, "Lead deleted via API");
            res.json({ success: true });
        } catch (error) {
            logger.error({ error }, "Failed to delete lead");
            res.status(500).json({ error: "Failed to delete lead" });
        }
    })();
});

// Convert lead to customer
router.post("/leads/:id/convert", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;

            const lead = await prisma.lead.findUnique({ where: { id } });
            if (!lead) {
                return res.status(404).json({ error: "Lead not found" });
            }

            // Create customer from lead data
            const customer = await prisma.customer.create({
                data: {
                    name: lead.name || "Unknown Customer",
                    email: lead.email,
                    phone: lead.phone,
                    address: lead.address,
                    status: "active",
                },
            });

            // Update lead to link to customer and mark as converted
            await prisma.lead.update({
                where: { id },
                data: {
                    customerId: customer.id,
                    status: "converted",
                },
            });

            logger.info({ leadId: id, customerId: customer.id }, "Lead converted to customer");
            res.json({ customer, lead });
        } catch (error) {
            logger.error({ error }, "Failed to convert lead");
            res.status(500).json({ error: "Failed to convert lead" });
        }
    })();
});

// Get all bookings
router.get("/bookings", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const status = req.query.status as string;

            const bookings = await prisma.booking.findMany({
                where: status ? { status } : undefined,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            taskType: true,
                            address: true,
                        },
                    },
                },
            });

            res.json(bookings);
        } catch (error) {
            logger.error({ error }, "Failed to fetch bookings");
            res.status(500).json({ error: "Failed to fetch bookings" });
        }
    })();
});

// Get all quotes
router.get("/quotes", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const status = req.query.status as string;

            const quotes = await prisma.quote.findMany({
                where: status ? { status } : undefined,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            taskType: true,
                        },
                    },
                },
            });

            res.json(quotes);
        } catch (error) {
            logger.error({ error }, "Failed to fetch quotes");
            res.status(500).json({ error: "Failed to fetch quotes" });
        }
    })();
});

// Create new quote
router.post("/quotes", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { leadId, hourlyRate, estimatedHours, vatRate, notes, validUntil } = req.body;

            if (!leadId) {
                return res.status(400).json({ error: "leadId is required" });
            }

            const subtotal = (hourlyRate || 0) * (estimatedHours || 0);
            const vatDecimal = (vatRate || 25) / 100; // Convert percentage to decimal
            const total = subtotal * (1 + vatDecimal);

            const quote = await prisma.quote.create({
                data: {
                    leadId,
                    hourlyRate: hourlyRate || 0,
                    estimatedHours: estimatedHours || 0,
                    subtotal,
                    vatRate: vatRate || 25,
                    total,
                    notes,
                    validUntil: validUntil ? new Date(validUntil as string) : null,
                    status: "draft",
                },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            taskType: true,
                        },
                    },
                },
            });

            logger.info({ quoteId: quote.id, leadId }, "Quote created via API");
            res.status(201).json(quote);
        } catch (error) {
            logger.error({ error }, "Failed to create quote");
            res.status(500).json({ error: "Failed to create quote" });
        }
    })();
});

// Update quote
router.put("/quotes/:id", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const { hourlyRate, estimatedHours, vatRate, notes, validUntil, status } = req.body;

            // Recalculate totals if pricing changed
            let updateData: Record<string, unknown> = {
                ...(notes !== undefined && { notes }),
                ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil as string) : null }),
                ...(status && { status }),
            };

            if (hourlyRate !== undefined || estimatedHours !== undefined || vatRate !== undefined) {
                const quote = await prisma.quote.findUnique({ where: { id } });
                if (!quote) {
                    return res.status(404).json({ error: "Quote not found" });
                }

                const newHourlyRate = hourlyRate !== undefined ? hourlyRate : quote.hourlyRate;
                const newEstimatedHours = estimatedHours !== undefined ? estimatedHours : quote.estimatedHours;
                const newVatRate = vatRate !== undefined ? vatRate : quote.vatRate;

                const subtotal = newHourlyRate * newEstimatedHours;
                const vatDecimal = newVatRate / 100; // Convert percentage to decimal
                const total = subtotal * (1 + vatDecimal);

                updateData = {
                    ...updateData,
                    ...(hourlyRate !== undefined && { hourlyRate }),
                    ...(estimatedHours !== undefined && { estimatedHours }),
                    ...(vatRate !== undefined && { vatRate }),
                    subtotal,
                    total,
                };
            }

            const quote = await prisma.quote.update({
                where: { id },
                data: updateData,
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            taskType: true,
                        },
                    },
                },
            });

            logger.info({ quoteId: id }, "Quote updated via API");
            res.json(quote);
        } catch (error) {
            logger.error({ error }, "Failed to update quote");
            res.status(500).json({ error: "Failed to update quote" });
        }
    })();
});

// Delete quote
router.delete("/quotes/:id", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;

            await prisma.quote.delete({
                where: { id },
            });

            logger.info({ quoteId: id }, "Quote deleted via API");
            res.json({ success: true });
        } catch (error) {
            logger.error({ error }, "Failed to delete quote");
            res.status(500).json({ error: "Failed to delete quote" });
        }
    })();
});

// Send quote via email
router.post("/quotes/:id/send", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const { customMessage } = req.body;

            const quote = await prisma.quote.findUnique({
                where: { id },
                include: {
                    lead: true,
                },
            });

            if (!quote) {
                return res.status(404).json({ error: "Quote not found" });
            }

            if (!quote.lead.email) {
                return res.status(400).json({ error: "Lead has no email address" });
            }

            // Import Gmail service functions
            const { sendGenericEmail } = await import("../services/gmailService");

            // Create email body
            const emailBody = `
Hej ${quote.lead.name || ""},

${customMessage || "Her er dit tilbud fra Rendetalje:"}

Service: ${quote.lead.taskType || "Rengøring"}
Timepris: ${quote.hourlyRate} DKK
Estimerede timer: ${quote.estimatedHours}
Subtotal: ${quote.subtotal.toFixed(2)} DKK
Moms (${quote.vatRate.toFixed(0)}%): ${(quote.subtotal * quote.vatRate / 100).toFixed(2)} DKK
Total: ${quote.total.toFixed(2)} DKK

${quote.notes ? `\nNoter:\n${quote.notes}` : ""}

${quote.validUntil ? `\nDette tilbud er gyldigt til: ${new Date(quote.validUntil).toLocaleDateString("da-DK")}` : ""}

Venlig hilsen,
        Rendetalje
        `.trim();

            // Send email
            await sendGenericEmail({
                to: quote.lead.email,
                subject: `Tilbud fra Rendetalje - ${quote.lead.taskType || "Rengøring"}`,
                body: emailBody,
            });        // Update quote status
            await prisma.quote.update({
                where: { id },
                data: { status: "sent" },
            });

            logger.info({ quoteId: id, email: quote.lead.email }, "Quote sent via email");
            res.json({ success: true, message: "Quote sent successfully" });
        } catch (error) {
            logger.error({ error }, "Failed to send quote");
            res.status(500).json({ error: "Failed to send quote" });
        }
    })();
});

// =====================================
// CONFLICT & ESCALATION ENDPOINTS
// =====================================

/**
 * Get recent escalations (conflicts escalated to Jonas)
 */
router.get("/escalations/recent", (req: Request, res: Response) => {
    void (async () => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const escalations = await prisma.escalation.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            taskType: true,
                            customer: {
                                select: { name: true }
                            }
                        }
                    }
                }
            });

            res.json(escalations);
        } catch (error) {
            logger.error({ error }, "Failed to fetch escalations");
            res.status(500).json({ error: "Failed to fetch escalations" });
        }
    })();
});

/**
 * Get escalation statistics
 */
router.get("/escalations/stats", (req: Request, res: Response) => {
    void (async () => {
        try {
            const period = req.query.period as string || "30d";
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case "7d":
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "30d":
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            const [total, critical, high, medium, low, resolved] = await Promise.all([
                prisma.escalation.count({ where: { createdAt: { gte: startDate } } }),
                prisma.escalation.count({
                    where: {
                        severity: "critical",
                        createdAt: { gte: startDate }
                    }
                }),
                prisma.escalation.count({
                    where: {
                        severity: "high",
                        createdAt: { gte: startDate }
                    }
                }),
                prisma.escalation.count({
                    where: {
                        severity: "medium",
                        createdAt: { gte: startDate }
                    }
                }),
                prisma.escalation.count({
                    where: {
                        severity: "low",
                        createdAt: { gte: startDate }
                    }
                }),
                prisma.escalation.count({
                    where: {
                        resolvedAt: { not: null },
                        createdAt: { gte: startDate }
                    }
                }),
            ]);

            res.json({
                total,
                bySeverity: {
                    critical,
                    high,
                    medium,
                    low
                },
                resolved,
                unresolved: total - resolved,
                resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0"
            });
        } catch (error) {
            logger.error({ error }, "Failed to fetch escalation stats");
            res.status(500).json({ error: "Failed to fetch escalation stats" });
        }
    })();
});

/**
 * Mark escalation as resolved
 */
router.post("/escalations/:id/resolve", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { id } = req.params;
            const { resolution } = req.body;

            await prisma.escalation.update({
                where: { id },
                data: {
                    resolvedAt: new Date(),
                    resolution: resolution || "Resolved manually"
                }
            });

            logger.info({ escalationId: id }, "Escalation marked as resolved");
            res.json({ success: true, message: "Escalation resolved" });
        } catch (error) {
            logger.error({ error }, "Failed to resolve escalation");
            res.status(500).json({ error: "Failed to resolve escalation" });
        }
    })();
});

// Tool Discovery Endpoint (ADK-inspired)
// Provides list of all available agent capabilities
router.get("/tools", (_req: Request, res: Response) => {
    void (async () => {
        try {
            const { toolRegistry } = await import("../tools/registry");

            // Get all available tools
            const tools = await toolRegistry.getAllTools();

            // Get statistics
            const stats = await toolRegistry.getStatistics();

            // Validate registry
            const validation = await toolRegistry.validate();

            res.json({
                success: true,
                tools: tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    category: t.category || "uncategorized",
                    parameters: t.parameters,
                    required_permissions: t.required_permissions || [],
                })),
                statistics: stats,
                validation,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error }, "Failed to fetch tools");
            res.status(500).json({
                success: false,
                error: "Failed to fetch tools from registry",
            });
        }
    })();
});

// Tool Execution Endpoint (for testing)
router.post("/tools/execute", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { toolName, parameters } = req.body;

            if (!toolName) {
                res.status(400).json({
                    success: false,
                    error: "Missing toolName parameter",
                });
                return;
            }

            const { toolRegistry, createToolContext } = await import("../tools");

            // Create tool context for execution
            const context = createToolContext({
                session_id: "api-session",
                user_id: "dashboard-user",
                app_name: "renos",
            });

            // Execute tool
            const result = await toolRegistry.executeTool(
                toolName as string,
                (parameters as Record<string, unknown>) || {},
                context
            );

            res.json({
                success: result.status === "success",
                result,
                tool: toolName,
                context_actions: context.actions,
                state_changes: context.state,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error }, "Tool execution failed");
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Tool execution failed",
            });
        }
    })();
});

export default router;
