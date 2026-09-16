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
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">USING MYDNR</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Terms & Conditions</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">These terms explain the basis on which MyDNR South Africa provides its online DNR registration, verification, retrieval and revocation services.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-8 rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,40,80,0.06)] sm:p-10">
          <Section title={'About the service'}>
            <p>MyDNR provides a digital service for recording, securely storing, verifying and retrieving DNR documentation. MyDNR does not itself create a DNR decision and does not determine whether a document is legally or clinically valid.</p>
          </Section>
          <Section title={'Who operates MyDNR'}>
            <p>MyDNR South Africa is operated by <strong>[MyDNR South Africa]</strong>, registration number <strong>[To be added]</strong>, registered in <strong>[South Africa]</strong>.</p>
            <p>Physical and legal-service address: <strong>[Plot 126, Zwavelpoort, Pretoria, South Africa]</strong><br />Email: <strong>[info@mydnr.co.za]</strong><br />Telephone: <strong>[+44 7484245826]</strong></p>
          </Section>
          <Section title={'Using the service'}>
            <p>You must provide information that is accurate and complete to the best of your knowledge and may not use MyDNR to impersonate another person, submit fraudulent documents, obtain records without authority, interfere with the service, or use information obtained through MyDNR unlawfully.</p>
            <p>Where identity or authority must be verified, MyDNR may request additional information before completing a registration, retrieval or revocation.</p>
          </Section>
          <Section title={'Registration, verification, retrieval and revocation'}>
            <p>Registration records the participant's submitted DNR documentation and supporting information. The free existence check is intended only to indicate whether a record is registered for the supplied identifier and does not disclose the DNR document itself.</p>
            <p>Retrieval is subject to identity and/or authority checks. Revocation records the participant's request to revoke a registered DNR after appropriate verification. MyDNR may decline or pause a request where information is incomplete, inconsistent, suspicious or cannot reasonably be verified.</p>
          </Section>
          <Section title={'Fees and payment'}>
            <p>Current fees are displayed before a paid service is requested. At present the website advertises a registration fee of R400 and a retrieval fee of R100; the DNR existence check and revocation service are advertised as free.</p>
            <p>Payments are processed using the payment methods presented during the transaction. MyDNR should not store full payment-card details unless expressly stated.</p>
            <p><strong>Before launch:</strong> insert the final payment provider, payment timing, delivery/service timing, cancellation and refund rules. These should match the actual transaction flow.</p>
          </Section>
          <Section title={'Electronic records and communications'}>
            <p>You agree that requests, confirmations, notices and transaction records may be created and communicated electronically. Please retain copies of documents and confirmations that are important to you.</p>
          </Section>
          <Section title={'Service availability and security'}>
            <p>We aim to keep MyDNR available and secure, but online services can experience maintenance, outages, third-party failures or events outside reasonable control. We may suspend access where necessary to protect users, information or the integrity of the service.</p>
          </Section>
          <Section title={'Liability and consumer rights'}>
            <p>Nothing in these terms is intended to exclude or limit rights or remedies that cannot lawfully be excluded under South African law. Any limitation of liability in the final terms should be read subject to those rights.</p>
            <p><strong>Before launch:</strong> have the final liability, refund and consumer-rights wording reviewed against the Consumer Protection Act and Electronic Communications and Transactions Act as they apply to MyDNR's actual service model.</p>
          </Section>
          <Section title={'Intellectual property'}>
            <p>The MyDNR name, branding, website design, software and original content are owned by or licensed to the operator of MyDNR unless stated otherwise. You may use the service and documents made available to you for their intended lawful purpose.</p>
          </Section>
          <Section title={'Changes and governing law'}>
            <p>We may update these terms as the service develops. The version in force when a transaction is concluded will apply to that transaction to the extent required by law. These terms are governed by the laws of the Republic of South Africa.</p>
            <p><strong>Effective date:</strong> [01 October 2026]</p>
          </Section>
        </div>
      </section>
      <InfoFooter />
    </main>
  );
}
