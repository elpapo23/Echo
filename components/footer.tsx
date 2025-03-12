import { EchoLogo } from "./echo-logo"

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <EchoLogo />
          </div>

          <div className="text-center md:text-right text-sm">
            <p className="mb-2">© {new Date().getFullYear()} Echo</p>
            <p className="text-gray-300 text-xs">
              Echo is a decentralized blockchain messenger built for secure, private communication.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

