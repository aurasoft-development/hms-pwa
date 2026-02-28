import { LoginForm } from '../molecules/LoginForm';
import { Card } from '../atoms/Card';
import { Building2 } from 'lucide-react';
import { theme } from '../utils/theme';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center relative min-h-screen w-full overflow-hidden bg-[#ECF3F3]">
      {/* Background decoration */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20" style={{
          background: theme.colors.gradients.accent,
          transform: 'translate(30%, -30%)',
        }}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20" style={{
          background: theme.colors.gradients.primary,
          transform: 'translate(-30%, 30%)',
        }}></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg" style={{
            background: theme.colors.gradients.accent,
          }}>
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>Hotel Management</h1>
          <p className="text-lg" style={{ color: theme.colors.text.secondary }}>Sign in to your account</p>
        </div>
        <LoginForm />
      </Card>
    </div>
  );
}

