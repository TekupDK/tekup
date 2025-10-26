/**
 * Cleaning Plan Builder Component
 * 
 * Interactive UI for creating and managing cleaning plans with task checklists
 * Part of Phase 1 - Sprint 1: Rengøringsplaner
 */

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, Clock, DollarSign, Save } from "lucide-react";

interface CleaningTask {
    id?: string;
    name: string;
    description?: string;
    category: string;
    estimatedTime: number;
    isRequired: boolean;
    pricePerTask?: number;
    sortOrder: number;
    isCompleted?: boolean;
}

interface CleaningPlan {
    id?: string;
    customerId: string;
    name: string;
    description?: string;
    serviceType: string;
    frequency: "once" | "weekly" | "biweekly" | "monthly";
    isTemplate: boolean;
    squareMeters?: number;
    address?: string;
    notes?: string;
    estimatedDuration?: number;
    estimatedPrice?: number;
    tasks: CleaningTask[];
}

interface Customer {
    id: string;
    name: string;
    email?: string;
    address?: string;
}

interface CleaningPlanBuilderProps {
    customers: Customer[];
    onSave: (plan: CleaningPlan) => Promise<void>;
    onCancel: () => void;
    existingPlan?: CleaningPlan;
}

const SERVICE_TYPES = [
    "Fast Rengøring",
    "Flytterengøring",
    "Hovedrengøring",
    "Engangsopgave",
];

const TASK_CATEGORIES = [
    "Cleaning",
    "Kitchen",
    "Bathroom",
    "Windows",
    "Special",
];

export default function CleaningPlanBuilder({
    customers,
    onSave,
    onCancel,
    existingPlan,
}: CleaningPlanBuilderProps) {
    const [plan, setPlan] = useState<CleaningPlan>(
        existingPlan || {
            customerId: "",
            name: "",
            description: "",
            serviceType: "Fast Rengøring",
            frequency: "once",
            isTemplate: false,
            tasks: [],
        }
    );

    const [newTask, setNewTask] = useState<Partial<CleaningTask>>({
        name: "",
        category: "Cleaning",
        estimatedTime: 15,
        isRequired: true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [taskTemplates, setTaskTemplates] = useState<Record<string, CleaningTask[]>>({});
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

    // Fetch task templates on mount
    useEffect(() => {
        fetchTaskTemplates();
    }, []);

    // Recalculate totals when tasks change
    useEffect(() => {
        calculateTotals();
    }, [plan.tasks]);

    // Calculate price when service type or square meters change
    useEffect(() => {
        if (plan.serviceType && plan.squareMeters) {
            calculatePrice();
        }
    }, [plan.serviceType, plan.squareMeters]);

    const fetchTaskTemplates = async () => {
        try {
            const response = await fetch("/api/cleaning-plans/templates/tasks");
            const data = await response.json();
            if (data.success) {
                setTaskTemplates(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch task templates:", err);
        }
    };

    const calculatePrice = async () => {
        try {
            const response = await fetch("/api/cleaning-plans/calculate-price", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceType: plan.serviceType,
                    squareMeters: plan.squareMeters,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setCalculatedPrice(data.data.estimatedPrice);
            }
        } catch (err) {
            console.error("Failed to calculate price:", err);
        }
    };

    const calculateTotals = () => {
        const estimatedDuration = plan.tasks.reduce(
            (sum, task) => sum + task.estimatedTime,
            0
        );
        const estimatedPrice = plan.tasks.reduce(
            (sum, task) => sum + (task.pricePerTask || 0),
            0
        );
        setPlan((prev) => ({ ...prev, estimatedDuration, estimatedPrice }));
    };

    const loadTemplateForServiceType = (serviceType: string) => {
        const templates = taskTemplates[serviceType];
        if (templates) {
            setPlan((prev) => ({
                ...prev,
                serviceType,
                tasks: templates.map((t, idx) => ({
                    ...t,
                    sortOrder: idx,
                })),
            }));
        } else {
            setPlan((prev) => ({ ...prev, serviceType, tasks: [] }));
        }
    };

    const addTask = () => {
        if (!newTask.name || !newTask.category) {
            setError("Task name and category are required");
            return;
        }

        const task: CleaningTask = {
            name: newTask.name,
            description: newTask.description,
            category: newTask.category || "Cleaning",
            estimatedTime: newTask.estimatedTime || 15,
            isRequired: newTask.isRequired !== undefined ? newTask.isRequired : true,
            pricePerTask: newTask.pricePerTask,
            sortOrder: plan.tasks.length,
        };

        setPlan((prev) => ({
            ...prev,
            tasks: [...prev.tasks, task],
        }));

        // Reset new task form
        setNewTask({
            name: "",
            category: "Cleaning",
            estimatedTime: 15,
            isRequired: true,
        });
        setError("");
    };

    const removeTask = (index: number) => {
        setPlan((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((_, i) => i !== index),
        }));
    };

    const moveTask = (index: number, direction: "up" | "down") => {
        const tasks = [...plan.tasks];
        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= tasks.length) return;

        [tasks[index], tasks[newIndex]] = [tasks[newIndex], tasks[index]];
        tasks.forEach((task, idx) => {
            task.sortOrder = idx;
        });

        setPlan((prev) => ({ ...prev, tasks }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Validation
            if (!plan.customerId) {
                throw new Error("Please select a customer");
            }
            if (!plan.name) {
                throw new Error("Please enter a plan name");
            }
            if (plan.tasks.length === 0) {
                throw new Error("Please add at least one task");
            }

            await onSave(plan);
        } catch (err: any) {
            setError(err.message || "Failed to save cleaning plan");
        } finally {
            setLoading(false);
        }
    };

    const selectedCustomer = customers.find((c) => c.id === plan.customerId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 z-10 bg-white border-b p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {existingPlan ? "Rediger Rengøringsplan" : "Opret Rengøringsplan"}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kunde *
                            </label>
                            <select
                                value={plan.customerId}
                                onChange={(e) =>
                                    setPlan({ ...plan, customerId: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Vælg kunde</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Plan Navn *
                            </label>
                            <input
                                type="text"
                                value={plan.name}
                                onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="f.eks. Ugentlig Kontorrengøring"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Type *
                            </label>
                            <select
                                value={plan.serviceType}
                                onChange={(e) => loadTemplateForServiceType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {SERVICE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Frekvens
                            </label>
                            <select
                                value={plan.frequency}
                                onChange={(e) =>
                                    setPlan({
                                        ...plan,
                                        frequency: e.target.value as CleaningPlan["frequency"],
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="once">Én gang</option>
                                <option value="weekly">Ugentlig</option>
                                <option value="biweekly">Hver 14. dag</option>
                                <option value="monthly">Månedlig</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kvadratmeter
                            </label>
                            <input
                                type="number"
                                value={plan.squareMeters || ""}
                                onChange={(e) =>
                                    setPlan({
                                        ...plan,
                                        squareMeters: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="150"
                            />
                            {calculatedPrice && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Estimeret pris: {calculatedPrice} DKK
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse
                            </label>
                            <input
                                type="text"
                                value={plan.address || ""}
                                onChange={(e) => setPlan({ ...plan, address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={selectedCustomer?.address || "Indtast adresse"}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Beskrivelse
                        </label>
                        <textarea
                            value={plan.description || ""}
                            onChange={(e) => setPlan({ ...plan, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Valgfri beskrivelse af planen"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Noter
                        </label>
                        <textarea
                            value={plan.notes || ""}
                            onChange={(e) => setPlan({ ...plan, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Specielle instruktioner eller bemærkninger"
                        />
                    </div>

                    {/* Tasks Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Opgaver ({plan.tasks.length})
                        </h3>

                        {/* Task List */}
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                            {plan.tasks.map((task, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 bg-gray-50 p-3 rounded-md"
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            type="button"
                                            onClick={() => moveTask(index, "up")}
                                            disabled={index === 0}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveTask(index, "down")}
                                            disabled={index === plan.tasks.length - 1}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            ▼
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{task.name}</div>
                                        <div className="text-sm text-gray-600 flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {task.estimatedTime} min
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                {task.category}
                                            </span>
                                            {task.isRequired && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                                    Påkrævet
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeTask(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Task */}
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-3">Tilføj Opgave</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        value={newTask.name || ""}
                                        onChange={(e) =>
                                            setNewTask({ ...newTask, name: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Opgave navn"
                                    />
                                </div>

                                <div>
                                    <select
                                        value={newTask.category || "Cleaning"}
                                        onChange={(e) =>
                                            setNewTask({ ...newTask, category: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {TASK_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <input
                                        type="number"
                                        value={newTask.estimatedTime || 15}
                                        onChange={(e) =>
                                            setNewTask({
                                                ...newTask,
                                                estimatedTime: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tid (minutter)"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newTask.isRequired !== false}
                                            onChange={(e) =>
                                                setNewTask({ ...newTask, isRequired: e.target.checked })
                                            }
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Påkrævet</span>
                                    </label>

                                    <button
                                        type="button"
                                        onClick={addTask}
                                        className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tilføj
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {plan.tasks.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium">
                                            {plan.tasks.length} opgaver
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium">
                                            {plan.estimatedDuration} min ({Math.round((plan.estimatedDuration || 0) / 60)} timer)
                                        </span>
                                    </div>
                                    {plan.estimatedPrice && plan.estimatedPrice > 0 && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium">
                                                {plan.estimatedPrice} DKK
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 border-t pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                            Annuller
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Gemmer..." : "Gem Plan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
