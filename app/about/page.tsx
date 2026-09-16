import Image from "next/image";
import Link from "next/link";

function InfoHeader() {
  return (
    <header className="border-b border-blue-100 bg-white/95">
      <div className="mx-auto flex h-24 max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label="MyDNR home">
          <Image
            src="/images/mydnr-logo.png"
            alt="MyDNR South Africa"
            width={220}
            height={82}
            className="h-20 w-auto object-contain"
            priority
          />
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-800 transition hover:bg-blue-50"
        >
          Back to MyDNR
        </Link>
      </div>
    </header>
  );
}

function InfoFooter() {
  return (
    <footer className="border-t border-blue-100 bg-white">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <span>© 2026 MyDNR South Africa · Secure DNR registration, verification & retrieval.</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-blue-700">Privacy</Link>
          <Link href="/terms" className="hover:text-blue-700">Terms</Link>
          <Link href="/disclaimer" className="hover:text-blue-700">Disclaimer</Link>
          <Link href="/contact" className="hover:text-blue-700">Contact</Link>
          <Link href="/about" className="hover:text-blue-700">About</Link>
        </div>
      </div>
    </footer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-blue-100 pt-7 first:border-0 first:pt-0">
      <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f4f9fd] text-slate-950">
      <InfoHeader />
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#f8fbff,#eaf5fc)]">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">MYDNR SOUTH AFRICA</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">About MyDNR</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">MyDNR provides a secure place for people to record their DNR wishes so that the document can be verified and retrieved when it may be needed.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-8 rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,40,80,0.06)] sm:p-10">
          <Section title={'Why MyDNR exists'}>
            <p>Decisions about end-of-life care are deeply personal. A signed document is only useful if the right people can find it when it matters. MyDNR is designed to make the administrative part simpler: register the document, retain it securely, verify that a record exists and provide a controlled retrieval process.</p>
          </Section>
          <Section title={'What MyDNR does'}>
            <p>MyDNR supports four straightforward journeys: registering a signed DNR request, checking whether a DNR record exists for a South African ID number, requesting authorised access to a registered DNR document, and allowing a participant to revoke their registered DNR after identity verification.</p>
          </Section>
          <Section title={'What MyDNR does not do'}>
            <p>MyDNR does not make healthcare decisions, provide medical or legal advice, or independently determine the legal or clinical validity of a DNR request. Healthcare decisions remain subject to the circumstances at the time, applicable requirements and the judgement of the healthcare professionals responsible for care.</p>
          </Section>
          <Section title={'Our approach'}>
            <p>We aim to make MyDNR respectful, calm and easy to use. The service is designed around privacy, secure handling of personal information, clear verification and a simple experience for participants and authorised requesters.</p>
          </Section>
          <Section title={'South African service'}>
            <p>This version of MyDNR is designed for South Africa and uses South African identity and service flows. The platform may evolve over time, but the principle remains the same: <strong>your wishes, clearly recorded.</strong></p>
          </Section>
          <Section title={'Who operates MyDNR'}>
            <p>MyDNR South Africa is operated by <strong>[MyDNR South Africa]</strong>. Full business and support details will be published on the <Link href="/contact" className="font-semibold text-blue-700 hover:underline">Contact page</Link> before launch.</p>
          </Section>
        </div>
      </section>
      <InfoFooter />
    </main>
  );
}
