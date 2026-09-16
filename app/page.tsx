import Image from "next/image";
import Link from "next/link";

const services = [
  {
    eyebrow: "Secure registration",
    title: "Register Your DNR",
    description:
      "Record and securely store your signed DNR request and supporting identification, so your wishes can be retrieved when they may be needed.",
    price: "Registration Fee: R400",
    href: "/register",
    cta: "Register my DNR",
    icon: "✓",
  },
  {
    eyebrow: "Free verification",
    title: "Check if a DNR Exists",
    description:
      "Quickly verify whether a DNR record has been registered for a South African ID Number.",
    price: "Free Service",
    href: "/check",
    cta: "Check a DNR",
    icon: "⌕",
  },
  {
    eyebrow: "Secure retrieval",
    title: "Request a DNR Document",
    description:
      "Request secure access to a registered DNR document when it is needed for someone you care about.",
    price: "Retrieval Fee: R100",
    href: "/request-document",
    cta: "Request document",
    icon: "↓",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7fbff] text-slate-900">
      {/* Header */}
      <header className="relative z-30 border-b border-blue-100/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:h-24 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="MyDNR home">
            <Image
              src="/images/mydnr-logo.png"
              alt="MyDNR South Africa"
              width={220}
              height={82}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-9 text-base font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="transition hover:text-blue-700">How it works</a>
            <a href="#services" className="transition hover:text-blue-700">Services</a>
            <a href="#about" className="transition hover:text-blue-700">About</a>
            <Link
              href="/register"
              className="rounded-xl bg-blue-700 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Get Started
            </Link>
          </nav>

          <Link
            href="/register"
            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm md:hidden"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#dcebf7] lg:min-h-[780px]">
        {/* South Africa hero photography — content remains live HTML above it. */}
        <Image
          src="/images/mydnr-hero-sa.png"
          alt="South African coastal landscape at sunset"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-30 object-cover object-center"
        />

        {/* Readability treatment: light behind the message, warmer/clearer over the scenery. */}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(248,252,255,0.96)_0%,rgba(248,252,255,0.90)_30%,rgba(248,252,255,0.62)_47%,rgba(15,23,42,0.08)_68%,rgba(15,23,42,0.18)_100%)]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_55%,rgba(15,23,42,0.20)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-[#f7fbff] via-[#f7fbff]/55 to-transparent" />

        <div className="relative mx-auto grid max-w-[1500px] items-start px-5 pb-14 pt-10 sm:px-10 sm:py-16 lg:min-h-[780px] lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-14 lg:py-24">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-blue-700 sm:mb-5 sm:text-base">
              Plan today. Peace tomorrow.
            </p>

            <h1 className="max-w-3xl text-[3rem] font-bold leading-[0.94] tracking-tight text-slate-950 sm:text-6xl lg:text-[5rem]">
              MyDNR<br />
              <span className="text-blue-800">South Africa</span>
            </h1>

            <p className="mt-6 max-w-2xl text-2xl font-bold leading-8 text-slate-900 sm:text-3xl sm:leading-10">
                A secure place to record your{" "}
                <br className="hidden sm:block" />
                Do Not Resuscitate (DNR) wishes.
            </p>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-2xl sm:leading-9">
              MyDNR helps you securely register your DNR request, so your wishes can be verified and your registered document can be accessed by your loved ones when you may not be able to communicate them yourself.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-blue-700 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Register My DNR
              </Link>
              <Link
                href="/check"
                className="rounded-xl border border-blue-200 bg-white/80 px-8 py-4 text-center text-lg font-semibold text-blue-800 shadow-sm backdrop-blur transition hover:bg-white"
              >
                Check if a DNR Exists
              </Link>
            </div>

            <div className="mt-7 flex flex-col items-start gap-1.5 text-sm font-medium text-slate-600 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3 sm:text-base">
              <span>✓ Secure registration</span>
              <span>✓ POPIA-conscious</span>
              <span>✓ South African service</span>
            </div>
          </div>

          <div className="hidden lg:block" aria-hidden="true">
            <div className="ml-auto max-w-lg rounded-[2rem] border border-white/70 bg-white/28 p-9 shadow-2xl shadow-slate-900/10 backdrop-blur-[3px]">
              <p className="font-serif text-4xl italic leading-snug text-white drop-shadow-md">
                “Some decisions are deeply personal. Making them known can be an act of care.”
              </p>
              <div className="mt-6 h-px w-16 bg-white/70" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
                Clarity • Dignity • Peace of mind
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose */}
      <section id="about" className="mx-auto max-w-5xl px-5 py-12 text-center sm:px-8 sm:py-16 lg:pt-24 lg:pb-14">
        <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-700">A deeply personal decision</p>
        <h2 className="mx-auto mt-3 max-w-4xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Your wishes matter. Make them known before it matters.
        </h2>
        <p className="mx-auto mt-4 max-w-4xl text-lg leading-8 text-slate-600 sm:mt-5 sm:text-xl sm:leading-9">
          MyDNR provides a respectful and secure way to register, verify and retrieve DNR documentation while protecting personal information.
        </p>
      </section>

      {/* Services */}
      <section id="services" className="border-y border-blue-100 bg-white py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:mb-10 md:mb-12 md:flex-row md:items-end">
            <div>
              <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-700">MyDNR services</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple when it needs to be.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 md:text-right">
              Choose what you need. Each journey is designed to be clear, calm and easy to complete.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-3 lg:gap-8">
            {services.map((service) => (
              <article
                key={service.title}
                className="group flex flex-col rounded-[1.5rem] border border-blue-100 bg-[#fbfdff] p-7 shadow-[0_12px_40px_rgba(15,45,80,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,45,80,0.11)] sm:p-8 md:min-h-[430px] lg:rounded-[1.75rem] lg:p-9"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-800 sm:mb-5 sm:h-14 sm:w-14 sm:text-2xl">
                  {service.icon}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{service.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:mt-3">{service.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">{service.description}</p>
                <p className="mt-5 text-base font-bold text-slate-800 sm:mt-6">{service.price}</p>
                <div className="mt-auto pt-6 sm:pt-8">
                  <Link
                    href={service.href}
                    className="block rounded-xl bg-blue-700 px-6 py-4 text-center text-lg font-semibold text-white transition group-hover:bg-blue-800"
                  >
                    {service.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-24">
        <div className="grid overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_18px_60px_rgba(15,45,80,0.08)] sm:rounded-[2rem] lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative min-h-[330px] overflow-hidden p-6 sm:min-h-[410px] sm:p-12">
            <Image
              src="/images/mydnr-how-it-works-sa.png"
              alt="South African fynbos and mountain landscape"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="absolute inset-0 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-900/10 to-transparent" />
            <div className="relative flex h-full items-end">
              <div className="max-w-[18rem] rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur sm:max-w-md sm:p-5">
                <p className="font-serif text-2xl italic leading-snug text-slate-800 sm:text-3xl">
                  “Your voice matters — even when you cannot speak for yourself.”
                </p>
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-700">How it works</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">A clear path from decision to retrieval.</h2>
            <div className="mt-7 space-y-6 sm:mt-10 sm:space-y-8">
              {[
                ["1", "Register", "Complete the registration journey and provide the required signed DNR documentation."],
                ["2", "Store securely", "Your registered DNR record is securely retained for future verification and retrieval."],
                ["3", "Retrieve when needed", "A registered document can be requested through the secure retrieval process."],
              ].map(([number, title, copy]) => (
                <div key={number} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white sm:h-11 sm:w-11">{number}</div>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1.5 text-base leading-7 text-slate-600 sm:mt-2 sm:text-lg sm:leading-8">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Revoke */}
      <section className="mx-auto max-w-[1500px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20">
        <div className="flex flex-col gap-6 rounded-[1.75rem] border border-blue-100 bg-blue-50/70 p-7 sm:rounded-[2rem] sm:p-10 md:flex-row md:items-center md:justify-between lg:p-12">
          <div className="max-w-4xl">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-700">Your decision remains yours</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:mt-4 sm:text-4xl">Changed your mind?</h2>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
              DNR wishes are deeply personal. If your wishes have changed, you can voluntarily revoke your registered DNR after your identity has been verified.
            </p>
            <p className="mt-3 text-sm font-bold text-slate-800">Free Service</p>
          </div>
          <Link
            href="/revoke"
            className="shrink-0 rounded-xl bg-blue-600 px-8 py-4 text-center text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Revoke My DNR
          </Link>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-slate-900 px-5 py-14 text-center text-white sm:px-8 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,.35),transparent_45%)]" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-base font-bold uppercase tracking-[0.2em] text-blue-300">MyDNR South Africa</p>
          <h2 className="mt-3 text-3xl font-bold sm:mt-4 sm:text-5xl">Make your wishes clear today.</h2>
          <p className="mx-auto mt-3 max-w-4xl text-lg leading-8 text-slate-300 sm:mt-4 sm:text-xl sm:leading-9">
            A simple step today can provide clarity for the people who may need it later.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-block rounded-xl bg-blue-600 px-9 py-4 font-semibold text-white shadow-lg transition hover:bg-blue-500 sm:mt-9"
          >
            Register My DNR
          </Link>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:px-8 sm:py-8 sm:text-base md:flex-row md:items-center md:justify-between lg:px-10 lg:py-10">
          <div className="flex items-center gap-3">
            <Image src="/images/mydnr-logo.png" alt="MyDNR" width={120} height={44} className="h-14 w-auto object-contain" />
            <span>Secure DNR registration & retrieval.</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-blue-700">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-700">Terms</Link>
            <Link href="/disclaimer" className="hover:text-blue-700">Disclaimer</Link>
            <Link href="/contact" className="hover:text-blue-700">Contact</Link>
            <Link href="/about" className="hover:text-blue-700">About</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
