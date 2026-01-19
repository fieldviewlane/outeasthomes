import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 leading-relaxed">
              OutEastHomes.com ("we") respects your privacy. We only collect your
              Name, Email, and Phone Number via Google Lead Forms or our website
              to facilitate a direct conversation regarding the rental of our East
              Hampton property.
            </p>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm my-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Use
              </h2>
              <p className="text-gray-600">
                We do not sell your data. We only use it to contact you regarding
                your inquiry.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm my-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Storage
              </h2>
              <p className="text-gray-600">
                Your information is stored securely and is only accessible by the
                property management.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm my-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Opt-Out
              </h2>
              <p className="text-gray-600">
                You may request the deletion of your information at any time by
                replying to our correspondence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
