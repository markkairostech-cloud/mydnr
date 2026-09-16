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
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">IMPORTANT INFORMATION</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Medical & Legal Disclaimer</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">MyDNR is a registration and retrieval service. This page explains the boundaries of that service.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-8 rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,40,80,0.06)] sm:p-10">
          <Section title={'MyDNR is not medical advice'}>
            <p>MyDNR does not provide medical advice, diagnosis or treatment. Information on this website is general information about the MyDNR service and should not be used as a substitute for advice from an appropriately qualified healthcare professional.</p>
          </Section>
          <Section title={'MyDNR is not legal advice'}>
            <p>MyDNR does not provide legal advice. Laws, clinical policies and individual circumstances may affect how a DNR request is created, interpreted or acted upon. If you require advice about your legal rights or the legal effect of a document, consult an appropriately qualified legal professional.</p>
          </Section>
          <Section title={'Registration does not determine validity'}>
            <p>Registering a DNR document with MyDNR records and facilitates secure storage, verification and retrieval of the submitted document. Registration does not by itself establish that a DNR request is legally valid, clinically appropriate or binding on a healthcare professional.</p>
          </Section>
          <Section title={'Clinical decisions remain with healthcare professionals'}>
            <p>Decisions about resuscitation and treatment are made in the circumstances that exist at the time and remain subject to applicable law, professional standards and the clinical judgement of the healthcare professionals responsible for the person's care.</p>
          </Section>
          <Section title={'Discuss your wishes'}>
            <p>Individuals are encouraged to discuss DNR decisions and broader healthcare wishes with an appropriately qualified healthcare professional and, where appropriate, with family or loved ones. A DNR request relates specifically to resuscitation and should not be assumed to mean that all other treatment, nursing care, pain relief, comfort care or symptom management is to be withheld.</p>
          </Section>
          <Section title={'Emergencies'}>
            <p>MyDNR is not an emergency medical service. In a medical emergency, contact the appropriate emergency service or healthcare provider. Do not delay urgent care while attempting to use this website.</p>
          </Section>
          <Section title={'Questions'}>
            <p>Questions about how MyDNR stores, verifies or retrieves documents can be sent through our <Link href="/contact" className="font-semibold text-blue-700 hover:underline">Contact page</Link>.</p>
          </Section>
        </div>
      </section>
      <InfoFooter />
    </main>
  );
}
