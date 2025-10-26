const { prisma } = require("./src/services/databaseService");
console.log("Available models:", Object.keys(prisma));

// Check if TaskExecution model exists
if (prisma.taskExecution) {
    console.log("taskExecution model exists");
} else {
    console.log("taskExecution model doesn't exist");
}

// Try other variants
console.log("Trying different casing/naming conventions:");
if (prisma.TaskExecution) {
    console.log("TaskExecution model exists");
}
if (prisma.task_execution) {
    console.log("task_execution model exists");
}
if (prisma.task_executions) {
    console.log("task_executions model exists");
}
if (prisma.taskExecutions) {
    console.log("taskExecutions model exists");
}