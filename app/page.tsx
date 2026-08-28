import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      {/* Main Page Wrapper */}
      <div className="relative max-w-5xl mx-auto px-6 py-14">

        {/* Vertical MyDNR Watermark */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            select-none
            absolute
            hidden
            lg:block
            right-[1.5rem]
            top-14
            text-[5.5rem]
            xl:text-[6rem]
            font-bold
            tracking-[0.08em]
            whitespace-nowrap
            z-0
          "
          style={{
            writingMode: "vertical-rl",
            color: "transparent",
            WebkitTextStroke: "1.5px #60a5fa",
          }}
        >
          MyDNR
        </div>

        {/* Main Page Content */}
        <div className="relative z-10">

          {/* Hero Section */}
          <section className="text-center mb-14">

            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/mydnr-logo.png"
                alt="MyDNR South Africa"
                width={450}
                height={450}
                style={{
                  width: "auto",
                  height: "auto",
                }}
                priority
              />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              MyDNR South Africa
            </h1>

            <h2 className="text-xl md:text-2xl font-light text-slate-700 mb-7">
              A secure place to record your wishes.
            </h2>

            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              MyDNR helps you securely register your Do Not Resuscitate
              (DNR) request, so your wishes can be verified and your
              registered DNR document can be accessed by your loved ones
              when you may not be able to communicate them yourself.
            </p>

          </section>

          {/* Information Panel */}
          <section className="bg-slate-50 rounded-3xl p-9 md:p-11 mb-12 text-center">

            <h3 className="text-2xl font-semibold text-slate-800 mb-5">
              Decisions regarding end-of-life care are deeply personal.
            </h3>

            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              MyDNR has been designed to provide a respectful and secure
              way to store and retrieve DNR documentation while protecting
              personal information.
            </p>

          </section>

          {/* Service Cards */}
          <section className="grid md:grid-cols-3 gap-6">

            {/* Register */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">

              <div className="text-4xl mb-4">
                🛡️
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Register Your DNR Request
              </h3>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Securely register and store your signed DNR request and
                supporting identification, so your DNR document can be
                retrieved when it may be needed.
              </p>

              <p className="font-semibold text-slate-800 mb-6">
                Registration Fee: R400
              </p>

              <div className="mt-auto">
                <Link
                  href="/register"
                  className="block w-full bg-slate-900 text-white py-3 rounded-xl text-center font-medium"
                >
                  Register
                </Link>
              </div>

            </div>

            {/* Check */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">

              <div className="text-4xl mb-4">
                🔍
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Check if a DNR Exists
              </h3>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Verify whether a DNR record has been registered for a
                South African ID Number.
              </p>

              <p className="font-semibold text-slate-800 mb-6">
                Free Service
              </p>

              <div className="mt-auto">
                <Link
                  href="/check"
                  className="block w-full bg-slate-900 text-white py-3 rounded-xl text-center font-medium"
                >
                  Check
                </Link>
              </div>

            </div>

            {/* Request */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">

              <div className="text-4xl mb-4">
                ⬇️
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Request a Registered DNR Document
              </h3>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Request secure access to a registered DNR document when
                it is needed for someone you care about.
              </p>

              <p className="font-semibold text-slate-800 mb-6">
                Retrieval Fee: R100
              </p>

              <div className="mt-auto">
                <Link
                  href="/request-document"
                  className="block w-full bg-slate-900 text-white py-3 rounded-xl text-center font-medium"
                >
                  Request
                </Link>
              </div>

            </div>

          </section>

          {/* Revoke DNR Section */}
          <section className="mt-8">

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10">

              <div className="md:flex md:items-center md:justify-between gap-8">

                <div className="flex-1">

                  <div className="text-4xl mb-4">
                    ↩️
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Revoke Your DNR
                  </h3>

                  <p className="text-slate-600 leading-relaxed max-w-2xl">
                    DNR Wishes are deeply personal, if your wishes have changed, you can voluntarily revoke
                    your registered DNR. Your identity will need to be
                    verified before a revocation can be completed.
                  </p>

                  <p className="font-semibold text-slate-800 mt-4">
                    Free Service
                  </p>

                </div>

                <div className="mt-6 md:mt-0 md:w-56">

                  <Link
                    href="/revoke"
                    className="block w-full bg-slate-900 text-white py-3 rounded-xl text-center font-medium"
                  >
                    Revoke My DNR
                  </Link>

                </div>

              </div>

            </div>

          </section>

          {/* Footer */}
          <footer className="mt-16 text-center text-sm text-slate-500">
            <p>
              Secure registration, verification and retrieval of
              Do Not Resuscitate (DNR) requests in South Africa.
            </p>
          </footer>

        </div>

      </div>

    </main>
  );
}