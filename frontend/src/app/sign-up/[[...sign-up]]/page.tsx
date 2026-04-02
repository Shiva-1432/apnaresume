import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <SignUp />
    </div>
  );
}
