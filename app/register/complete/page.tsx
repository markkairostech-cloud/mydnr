import Image from "next/image";
import Link from "next/link";

export default function RegistrationCompletePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/mydnr-logo.png"
            alt="MyDNR South Africa"
            width={300}
            height={300}
            priority
          />
        </div>

        {/* Success Heading */}
        <div className="text-center mb-10">

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-5xl text-green-700">
                ✓
                </span>
            </div>
            </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Registration Complete
          </h1>

          <p className="text-slate-600">
            Thank you for registering a DNR request with MyDNR.
          </p>

        </div>

        {/* Confirmation Panel */}
        <div className="bg-slate-50 rounded-3xl p-10 mb-10 text-center">

          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Your DNR Request Has Been Registered
          </h2>

          <p className="text-slate-600 leading-relaxed mb-4">
            The participant's DNR request has been successfully
            registered and securely stored within the MyDNR service.
          </p>

          <p className="text-slate-600 leading-relaxed">
            A DNR record has been created and may be verified
            through the MyDNR verification and retrieval service
            when required.
          </p>

        </div>

        {/* What Happens Next */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            What Happens Next?
          </h3>

          <ul className="space-y-3 text-slate-600">

            <li>
              ✓ The participant's details have been recorded.
            </li>

            <li>
              ✓ The uploaded DNR document has been stored securely.
            </li>

            <li>
              ✓ The DNR record can now be verified using the participant's South African ID Number.
            </li>

            <li>
              ✓ A registered DNR document may be requested through the MyDNR service if required.
            </li>

          </ul>

        </div>

        {/* Important Reminder */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-10">

          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Important Reminder
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Individuals are encouraged to discuss DNR decisions
            with their healthcare providers, caregivers and loved
            ones to ensure that their wishes are understood.
          </p>

        </div>

        {/* Return Home */}
        <Link
          href="/"
          className="block w-full bg-slate-900 text-white py-4 rounded-xl text-center font-medium"
        >
          Return Home
        </Link>

      </div>
    </main>
  );
}