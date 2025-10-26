import { logger } from "../logger";
import {
    createBookingWithCalendar,
    createBookingRecord,
    queryBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking,
    type CreateBookingWithCalendarInput,
} from "../services/calendarService";
import { checkDatabaseConnection } from "../services/databaseService";

/**
 * Test database booking persistence functions
 */
async function testDatabaseBooking(): Promise<void> {
    console.log("\n🧪 Testing Database Booking Persistence\n");
    console.log("━".repeat(80));

    try {
        // Step 1: Check database connection
        console.log("\n📊 Step 1: Checking database connection...");
        const isConnected = await checkDatabaseConnection();

        if (!isConnected) {
            console.log("❌ Database connection failed. Make sure DATABASE_URL is set.");
            console.log("\nExample:");
            console.log('DATABASE_URL="postgresql://user:password@localhost:5432/rendetalje"');
            process.exit(1);
        }

        console.log("✅ Database connection established");

        // Step 2: Create a booking with calendar event
        console.log("\n📅 Step 2: Creating booking with calendar event...");

        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 7); // 7 days from now
        startTime.setHours(10, 0, 0, 0); // 10:00 AM

        const endTime = new Date(startTime);
        endTime.setHours(12, 30, 0, 0); // 12:30 PM (2.5 hours later)

        const bookingInput: CreateBookingWithCalendarInput = {
            leadId: "test-lead-" + Date.now(),
            summary: "Fast rengøring - Test Booking",
            description: "Test booking created from database persistence test",
            startTime,
            endTime,
            location: "Testvej 123, 8000 Aarhus C",
            attendees: [
                {
                    email: "test@example.com",
                    displayName: "Test Customer",
                    responseStatus: "needsAction",
                },
            ],
            notes: "This is a test booking for database persistence validation",
        };

        const { booking, calendarEvent } = await createBookingWithCalendar(bookingInput);

        console.log("✅ Booking created successfully!");
        console.log(`   Booking ID: ${booking.id}`);
        console.log(`   Calendar Event ID: ${calendarEvent.id}`);
        console.log(`   Lead ID: ${booking.leadId}`);
        console.log(`   Start: ${booking.startTime.toLocaleString("da-DK")}`);
        console.log(`   End: ${booking.endTime.toLocaleString("da-DK")}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Dry Run: ${calendarEvent.dryRun ? "Yes (no actual calendar event)" : "No (real calendar event)"}`);

        // Step 3: Query the booking
        console.log("\n🔍 Step 3: Querying booking from database...");

        const foundBooking = await getBookingById(booking.id);

        if (!foundBooking) {
            throw new Error("Failed to find booking after creation");
        }

        console.log("✅ Booking found in database");
        console.log(`   ID: ${foundBooking.id}`);
        console.log(`   Created At: ${foundBooking.createdAt.toLocaleString("da-DK")}`);

        // Step 4: Update booking status
        console.log("\n🔄 Step 4: Updating booking status...");

        const updatedBooking = await updateBookingStatus(booking.id, {
            status: "confirmed",
            notes: "Customer confirmed via phone",
        });

        console.log("✅ Booking updated successfully!");
        console.log(`   New Status: ${updatedBooking.status}`);
        console.log(`   Updated At: ${updatedBooking.updatedAt.toLocaleString("da-DK")}`);

        // Step 5: Query all bookings for this lead
        console.log("\n📋 Step 5: Querying all bookings for lead...");

        const leadBookings = await queryBookings({ leadId: booking.leadId });

        console.log(`✅ Found ${leadBookings.length} booking(s) for lead ${booking.leadId}`);
        leadBookings.forEach((b, index) => {
            console.log(`   ${index + 1}. ${b.id} - ${b.status} - ${b.startTime.toLocaleString("da-DK")}`);
        });

        // Step 6: Query upcoming bookings
        console.log("\n📅 Step 6: Querying upcoming bookings...");

        const upcomingBookings = await queryBookings({
            startAfter: new Date(),
            status: "confirmed",
        });

        console.log(`✅ Found ${upcomingBookings.length} upcoming confirmed booking(s)`);

        // Step 7: Clean up - delete test booking
        console.log("\n🗑️  Step 7: Cleaning up test booking...");

        const deleted = await deleteBooking(booking.id);

        if (deleted) {
            console.log("✅ Test booking deleted successfully");
        } else {
            console.log("⚠️  Failed to delete test booking (may need manual cleanup)");
        }

        // Step 8: Test manual booking record creation (without calendar event)
        console.log("\n📝 Step 8: Testing manual booking record creation...");

        const manualBooking = await createBookingRecord({
            leadId: "test-lead-manual-" + Date.now(),
            startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
            status: "scheduled",
            notes: "Manual booking record without calendar event",
        });

        console.log("✅ Manual booking record created");
        console.log(`   ID: ${manualBooking.id}`);
        console.log(`   Lead ID: ${manualBooking.leadId}`);

        // Clean up manual booking
        await deleteBooking(manualBooking.id);
        console.log("✅ Manual booking cleaned up");

        console.log("\n━".repeat(80));
        console.log("\n✅ All database booking persistence tests completed successfully!\n");

    } catch (error) {
        logger.error({ error }, "Database booking test failed");
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    }
}

// Run the test
testDatabaseBooking().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
