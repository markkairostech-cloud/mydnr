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
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">WE'RE HERE TO HELP</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Contact MyDNR</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Contact MyDNR for questions about registration, verification, document retrieval, revocation, privacy or use of the service.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-8 rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,40,80,0.06)] sm:p-10">
          <Section title={'General support'}>
            <p>Email: <strong>[info@mydnr.co.za]</strong><br />Telephone: <strong>[+44 7484245826]</strong><br />Support hours: <strong>[09:00-17:00 South African Time]</strong></p>
            <p>Please do not send identity documents, DNR documents or other sensitive personal information by ordinary email unless MyDNR has specifically instructed you to use an approved secure channel.</p>
          </Section>
          <Section title={'Privacy and personal information'}>
            <p>For privacy questions or requests concerning your personal information, contact the MyDNR Information Officer:</p>
            <p><strong>[M Thompson CIO/CDO]</strong><br />Email: <strong>[info@mydnr.co.za]</strong></p>
          </Section>
          <Section title={'Business details'}>
            <p>MyDNR South Africa is operated by <strong>[MyDNR South Africa]</strong>.<br />Registration number: <strong>[To be added]</strong><br />Physical address: <strong>[PHYSICAL ADDRESS]</strong><br />Address for service of legal documents: <strong>[LEGAL SERVICE ADDRESS]</strong></p>
          </Section>
          <Section title={'Medical emergencies'}>
            <p><strong>MyDNR is not an emergency medical service.</strong> If someone requires urgent medical assistance, contact the appropriate emergency service or healthcare provider rather than waiting for a response from MyDNR support.</p>
          </Section>
          <Section title={'Complaints'}>
            <p>If you are unhappy with a MyDNR service, contact us first so that we can investigate the matter. Privacy complaints may also be taken to South Africa's Information Regulator where applicable.</p>
          </Section>
        </div>
      </section>
      <InfoFooter />
    </main>
  );
}
