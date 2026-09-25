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
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">YOUR INFORMATION MATTERS</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Privacy Notice</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">This notice explains how MyDNR South Africa handles personal information when you use our registration, verification and document-retrieval services.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-8 rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,40,80,0.06)] sm:p-10">
          <Section title={'Who is responsible for your information'}>
            <p>MyDNR South Africa is operated by <strong>[MyDNR South Africa]</strong>, the responsible party for personal information processed through this service.</p>
            <p> <strong></strong><br />Email: <strong>[info@mydnr.co.za]</strong><br />Physical address: <strong>[Plot 128, Zwavelpoort, Pretoria, South Africa]</strong></p>
          </Section>
          <Section title={'Information we may collect'}>
            <p>Depending on the service you use, we may collect identifying and contact information, South African ID details, identity-document copies, signed DNR documentation, information supplied by a person requesting a registered document, consent and declaration records, payment and transaction references, and technical or audit information needed to operate and secure the service.</p>
            <p>DNR documentation may contain information concerning health or healthcare wishes. We therefore treat the information entrusted to MyDNR as sensitive and restrict its use to the purposes for which it is required.</p>
          </Section>
          <Section title={'Why we process it'}>
            <p>We process information to register and securely retain DNR records; verify whether a record exists; authenticate and assess retrieval or revocation requests; provide authorised documents; process and reconcile payments; communicate about requests; maintain security and audit records; prevent misuse; and meet applicable legal, regulatory and record-keeping obligations.</p>
            <p>Where information is required to provide a requested service, not supplying it may mean that MyDNR cannot complete that service.</p>
          </Section>
          <Section title={'How we obtain and share information'}>
            <p>Most information is provided directly by the participant or requester. Where a person requests a document relating to another individual, information may also be supplied by that requester for verification and authorisation purposes.</p>
            <p>We may use carefully selected service providers to support hosting, storage, security, communications and payment processing. They should receive only the information necessary for their role and must handle it subject to appropriate contractual and security controls. We do not sell personal information.</p>
          </Section>
          <Section title={'Storage, security and cross-border processing'}>
            <p>MyDNR uses reasonable technical and organisational safeguards designed to protect information against loss, unauthorised access, alteration or disclosure. Access should be limited to authorised persons and activities should be logged where appropriate.</p>
            <p><strong>Before launch:</strong> confirm the countries in which MyDNR and each infrastructure provider store or process data. If personal information is transferred outside South Africa, this notice must be updated to describe that processing and the safeguards relied upon.</p>
          </Section>
          <Section title={'Retention'}>
            <p>We retain personal information only for as long as reasonably necessary for the purpose for which it was collected, to maintain the DNR service and its audit trail, or to meet legal and regulatory obligations. A revocation does not necessarily require deletion of every historical transaction or audit record where retention remains lawful or necessary.</p>
            <p><strong>Before launch:</strong> insert MyDNR's approved retention periods for DNR records, identification documents, retrieval requests, payment records and security logs.</p>
          </Section>
          <Section title={'Your rights'}>
            <p>Subject to applicable law, you may ask whether MyDNR holds personal information about you, request access to it, ask for inaccurate information to be corrected, or request deletion or restriction where appropriate. You may also object to certain processing and lodge a complaint with South Africa's Information Regulator.</p>
            <p>Requests should be sent to <strong>[info@mydnr.co.za]</strong>. We will need to verify your identity before acting on a request.</p>
          </Section>
          <Section title={'Cookies and technical information'}>
            <p>MyDNR may use essential technical storage, logs or similar technologies required for security, session management and operation of the service. If non-essential analytics, advertising or tracking technologies are introduced, this notice and the website's consent controls should be updated before they are enabled.</p>
          </Section>
          <Section title={'Updates to this notice'}>
            <p>We may update this notice when the service, our providers or applicable requirements change. The current version will be published on this page.</p>
            <p><strong>Effective date:</strong> [01 October 2026]</p>
          </Section>
        </div>
      </section>
      <InfoFooter />
    </main>
  );
}
