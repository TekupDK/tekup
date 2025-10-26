import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg font-display">T</span>
              </div>
              <span className="font-display font-bold text-xl">TekUp</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Din IT-partner i øjenhøjde. Vi hjælper danske SMV&apos;er med NIS2-efterlevelse,
              Copilot Ready implementering og Microsoft 365 governance.
            </p>
            <div className="flex space-x-4">
              <a href="https://linkedin.com/company/tekup-dk" className="text-gray-400 hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="https://facebook.com/tekup.dk" className="text-gray-400 hover:text-white transition-colors">
                Facebook
              </a>
              <a href="https://instagram.com/tekup.dk" className="text-gray-400 hover:text-white transition-colors">
                Instagram
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/services/nis2" className="hover:text-white transition-colors">NIS2 Compliance</Link></li>
              <li><Link href="/services/copilot" className="hover:text-white transition-colors">Copilot Ready</Link></li>
              <li><Link href="/services/m365" className="hover:text-white transition-colors">M365 Governance</Link></li>
              <li><Link href="/services/konsultation" className="hover:text-white transition-colors">Konsultation</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Kontakt</h3>
            <div className="space-y-2 text-gray-300">
              <p>kundeservice@tekup.dk</p>
              <p>+45 22 65 02 26</p>
              <p>Aarhus, Danmark</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 TekUp. Alle rettigheder forbeholdes.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privatlivspolitik" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privatlivspolitik
            </Link>
            <Link href="/vilkar" className="text-gray-400 hover:text-white text-sm transition-colors">
              Vilkår
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}