import { useNavigate } from 'react-router-dom';
import { useAsaasStatus } from '../hooks/useAsaasStatus';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
    /** What action is blocked (shown in message) */
    action?: string;
    /** Override default className */
    className?: string;
}

/**
 * Banner component that shows when Asaas account is not approved.
 * Blocks access to key features (job creation, job application).
 * Returns null when account is approved (renders nothing).
 */
export default function AsaasApprovalBanner({ action = 'usar esta funcionalidade', className = '' }: Props) {
    const navigate = useNavigate();
    const { isApproved, isRejected, isNotCreated, loading } = useAsaasStatus();

    // Don't show anything if approved or still loading
    if (loading || isApproved) return null;

    const isCompanyPath = window.location.pathname.startsWith('/company');
    const statusPath = isCompanyPath ? '/company/asaas-status' : '/asaas-status';

    if (isNotCreated) {
        return (
            <div className={`bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 flex items-start gap-3 ${className}`}>
                <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                    <p className="font-bold text-sm text-orange-800">
                        Conta de pagamento não configurada
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                        Para {action}, você precisa completar o cadastro da sua conta de pagamento.
                    </p>
                </div>
                <button
                    onClick={() => navigate(statusPath)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-1 hover:bg-orange-600 transition-colors flex-shrink-0"
                >
                    Configurar <ArrowRight size={14} />
                </button>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className={`bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3 ${className}`}>
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                    <p className="font-bold text-sm text-red-800">
                        Conta de pagamento rejeitada
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        Sua conta foi rejeitada. Verifique os documentos e tente novamente para {action}.
                    </p>
                </div>
                <button
                    onClick={() => navigate(statusPath)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-1 hover:bg-red-600 transition-colors flex-shrink-0"
                >
                    Verificar <ArrowRight size={14} />
                </button>
            </div>
        );
    }

    // Pending / Awaiting Approval
    return (
        <div className={`bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-start gap-3 ${className}`}>
            <Loader2 className="text-yellow-600 flex-shrink-0 mt-0.5 animate-spin" size={20} />
            <div className="flex-1">
                <p className="font-bold text-sm text-yellow-800">
                    Conta em análise
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                    Sua conta de pagamento está sendo analisada. Algumas funcionalidades podem estar limitadas até a aprovação.
                </p>
            </div>
            <button
                onClick={() => navigate(statusPath)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-1 hover:bg-yellow-600 transition-colors flex-shrink-0"
            >
                Ver Status <ArrowRight size={14} />
            </button>
        </div>
    );
}
