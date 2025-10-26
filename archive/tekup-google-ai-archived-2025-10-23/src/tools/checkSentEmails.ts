import { prisma } from "../services/databaseService";

/**
 * Check emails sent today to see format issues
 */
async function checkSentEmails() {
    console.log("\n📧 Checking Auto-Sent Emails from Today\n");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Check EmailResponse table
        const sentEmails = await prisma.emailResponse.findMany({
            where: {
                status: "sent",
                sentAt: {
                    gte: today
                }
            },
            include: {
                lead: {
                    select: {
                        name: true,
                        email: true,
                        source: true,
                        taskType: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                sentAt: "desc"
            }
        });

        console.log(`✅ Found ${sentEmails.length} emails sent today\n`);
        console.log("━".repeat(80));

        if (sentEmails.length === 0) {
            console.log("No emails sent today.");

            // Check all sent emails
            const allSent = await prisma.emailResponse.findMany({
                where: {
                    status: "sent"
                },
                include: {
                    lead: {
                        select: {
                            name: true,
                            email: true,
                            source: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: {
                    sentAt: "desc"
                },
                take: 10
            });

            console.log(`\n📊 Last 10 sent emails (all time):\n`);

            allSent.forEach((email, index) => {
                console.log(`${index + 1}. ${email.recipientEmail}`);
                console.log(`   Lead: ${email.lead?.name || "Unknown"}`);
                console.log(`   Source: ${email.lead?.source || "Unknown"}`);
                console.log(`   Sent: ${email.sentAt?.toLocaleString("da-DK")}`);
                console.log(`   Subject: ${email.subject}`);
                console.log(`   Preview: ${email.body.substring(0, 150)}...`);
                console.log("━".repeat(80));
            });
        } else {
            sentEmails.forEach((email, index) => {
                console.log(`\n${index + 1}. EMAIL #${email.id}`);
                console.log(`   To: ${email.recipientEmail}`);
                console.log(`   Lead Name: ${email.lead?.name || "Unknown"}`);
                console.log(`   Lead Source: ${email.lead?.source || "Unknown"}`);
                console.log(`   Task Type: ${email.lead?.taskType || "Unknown"}`);
                console.log(`   Sent At: ${email.sentAt?.toLocaleString("da-DK")}`);
                console.log(`   Gmail Thread: ${email.gmailThreadId || "None"}`);
                console.log(`\n   Subject: ${email.subject}`);
                console.log(`\n   Body Preview (first 300 chars):`);
                console.log(`   ${email.body.substring(0, 300)}...`);
                console.log("\n" + "━".repeat(80));
            });

            console.log(`\n📊 Summary:`);
            console.log(`   Total sent today: ${sentEmails.length}`);

            const sources = sentEmails.reduce((acc, email) => {
                const source = email.lead?.source || "Unknown";
                acc[source] = (acc[source] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            console.log(`\n   By source:`);
            Object.entries(sources).forEach(([source, count]) => {
                console.log(`     ${source}: ${count}`);
            });
        }

        // Check EmailMessage table for AI generated
        const aiMessages = await prisma.emailMessage.findMany({
            where: {
                isAiGenerated: true,
                sentAt: {
                    gte: today
                }
            },
            orderBy: {
                sentAt: "desc"
            },
            take: 10
        });

        if (aiMessages.length > 0) {
            console.log(`\n\n🤖 AI Generated Messages Today: ${aiMessages.length}\n`);
            console.log("━".repeat(80));

            aiMessages.forEach((msg, index) => {
                console.log(`\n${index + 1}. AI MESSAGE #${msg.id}`);
                console.log(`   To: ${msg.to.join(", ")}`);
                console.log(`   From: ${msg.from}`);
                console.log(`   Subject: ${msg.subject}`);
                console.log(`   Model: ${msg.aiModel || "Unknown"}`);
                console.log(`   Sent: ${msg.sentAt.toLocaleString("da-DK")}`);
                console.log(`\n   Body Preview:`);
                console.log(`   ${msg.body.substring(0, 300)}...`);
                console.log("\n" + "━".repeat(80));
            });
        }

    } catch (error) {
        console.error("❌ Error checking emails:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSentEmails().catch(console.error);
