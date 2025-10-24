"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCustomersStore } from "@/store/customersStore-v2";
import { LoadingState } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

export default function CustomersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    customers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    fetchCustomers,
    createCustomer,
    deleteCustomer,
  } = useCustomersStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Fetch customers
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated, fetchCustomers]);

  // Filter customers by search
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.includes(query) ||
      customer.companyName?.toLowerCase().includes(query)
    );
  });

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createCustomer({
        name: formData.get("name") as string,
        email: (formData.get("email") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        companyName: (formData.get("companyName") as string) || undefined,
        cvr: (formData.get("cvr") as string) || undefined,
        address: {
          street: (formData.get("street") as string) || undefined,
          city: (formData.get("city") as string) || undefined,
          postal_code: (formData.get("postal_code") as string) || undefined,
          country: "Denmark",
        },
        notes: (formData.get("notes") as string) || undefined,
      });

      setIsModalOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      // Error toast already shown by store
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (confirm(`Er du sikker på du vil slette kunde: ${name}?`)) {
      await deleteCustomer(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center"
              >
                ← Tilbage til dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>+ Opret kunde</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <Input
            label="Søg kunde"
            placeholder="Søg efter navn, email, telefon eller virksomhed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Customers Grid */}
        <LoadingState
          isLoading={isLoading}
          error={error}
          isEmpty={filteredCustomers.length === 0}
          loadingMessage="Henter kunder..."
          emptyMessage="Ingen kunder fundet. Opret din første kunde!"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardBody>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {customer.name}
                      </h3>
                      {customer.companyName && (
                        <p className="text-sm text-gray-600">
                          {customer.companyName}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => alert("Edit functionality coming soon")}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Rediger"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteCustomer(customer.id, customer.name)
                        }
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Slet"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📧</span>
                        <a
                          href={`mailto:${customer.email}`}
                          className="hover:text-blue-600"
                        >
                          {customer.email}
                        </a>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📱</span>
                        <a
                          href={`tel:${customer.phone}`}
                          className="hover:text-blue-600"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    )}

                    {customer.address?.street && (
                      <div className="flex items-start text-gray-600">
                        <span className="mr-2">📍</span>
                        <div>
                          <p>{customer.address.street}</p>
                          {customer.address.postal_code &&
                            customer.address.city && (
                              <p>
                                {customer.address.postal_code}{" "}
                                {customer.address.city}
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    {customer.cvr && (
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">🏢</span>
                        <span>CVR: {customer.cvr}</span>
                      </div>
                    )}
                  </div>

                  {customer.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 italic">
                        {customer.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400">
                    Oprettet:{" "}
                    {new Date(customer.createdAt).toLocaleDateString("da-DK")}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </LoadingState>
      </main>

      {/* Create Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Opret ny kunde"
        size="lg"
      >
        <form onSubmit={handleCreateCustomer}>
          <div className="space-y-4">
            <Input
              label="Navn"
              name="name"
              placeholder="F.eks. Lars Hansen"
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="lars@example.com"
            />

            <Input
              label="Telefon"
              name="phone"
              type="tel"
              placeholder="12345678"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Virksomhed"
                name="companyName"
                placeholder="Virksomhedsnavn ApS"
              />

              <Input label="CVR" name="cvr" placeholder="12345678" />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Adresse</h4>

              <div className="space-y-3">
                <Input
                  label="Vej"
                  name="street"
                  placeholder="Eksempelvej 123"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Postnummer"
                    name="postal_code"
                    placeholder="1234"
                  />

                  <Input label="By" name="city" placeholder="København" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Noter
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Interne noter om kunden..."
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Annuller
            </Button>
            <Button type="submit">Opret kunde</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
