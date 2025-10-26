export function ContactSection() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">
          Contact Form with Flow API Integration - Coming Soon
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          Multi-step contact form with validation and integration with your Flow API for lead capture.
        </p>
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-12 bg-primary-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  )
}