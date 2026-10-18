import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';
export default function Legal({ privacy = false }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/">
        <Logo />
      </Link>
      <h1 className="mb-8 mt-12 text-3xl font-semibold">
        {privacy ? 'Privacy information' : 'Terms of use'}
      </h1>
      <div className="space-y-6 text-sm leading-relaxed text-muted">
        {privacy ? (
          <>
            <p>
              CreatorOS stores account details and workspace records in the database configured by
              the operator of this installation. Passwords are hashed. Authentication uses HTTP-only
              cookies.
            </p>
            <p>
              If enabled, email delivery is handled by the configured email provider, social sign-in
              uses Facebook, and media files are stored in Cloudinary. Those providers
              process information needed to provide their services.
            </p>
            <p>
              Demo mode contains sample accounts and temporary data. Do not use it for confidential
              or permanent work. You can delete your account and database records from Account &
              security. Contact your installation operator about backups, uploaded assets,
              retention, or access requests.
            </p>
            <p>
              The application stores appearance and view preferences in your browser. External
              images can load from creator-supplied URLs and send standard browser request
              information to those hosts. Built-in decorative images are served locally.
            </p>
          </>
        ) : (
          <>
            <p>
              CreatorOS is a workspace for organizing your own content and business information. Use
              it lawfully and only upload content you are authorized to use.
            </p>
            <p>
              You are responsible for the accuracy of records, invoices, financial information, and
              content you enter. Stored metrics are not a guarantee of future performance.
              Scheduling a record does not publish it to social platforms.
            </p>
            <p>
              Your installation operator manages hosting, availability, backups, provider
              configuration, and account administration. There are no paid subscription commitments
              built into this installation.
            </p>
            <p>
              These terms describe this software installation. An operator offering it as a public
              service should provide their own business identity, contact information, and
              applicable service terms before launch.
            </p>
          </>
        )}
      </div>
      <Link className="btn btn-secondary mt-10" to="/">
        Back to home
      </Link>
    </main>
  );
}