export default async function TestPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Test Page - Tenant: {tenant}
      </h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-100 rounded-lg">
          <p className="text-blue-800">✅ React komponenter fungerer</p>
        </div>
        
        <div className="p-4 bg-green-100 rounded-lg">
          <p className="text-green-800">✅ Tailwind CSS fungerer</p>
        </div>
        
        <div className="p-4 bg-yellow-100 rounded-lg">
          <p className="text-yellow-800">✅ Next.js 15 async params fungerer</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-100 rounded">Card 1</div>
          <div className="p-4 bg-gray-100 rounded">Card 2</div>
          <div className="p-4 bg-gray-100 rounded">Card 3</div>
        </div>
      </div>
    </div>
  );
}
