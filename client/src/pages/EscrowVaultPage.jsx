import { EscrowVaultManager } from '../features/escrow/components/EscrowVaultManager';
import { PageBackground } from '../config/pageBackgrounds';

export default function EscrowVaultPage() {
  return (
    <div className="space-y-6">
      <PageBackground page="finance" />
      <EscrowVaultManager />
    </div>
  );
}
