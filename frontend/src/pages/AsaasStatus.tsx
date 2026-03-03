import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsaasStatus } from '../hooks/useAsaasStatus';
import {
    CheckCircle2, Clock, AlertCircle, XCircle, ExternalLink,
    RefreshCw, Loader2, ArrowRight, FileText, Shield, CreditCard, Building2
} from 'lucide-react';

const STATUS_CONFIG = {
    APPROVED: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Aprovado', border: 'border-green-200' },
    AWAITING_APPROVAL: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Em Análise', border: 'border-yellow-200' },
    PENDING: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Pendente', border: 'border-orange-200' },
    REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejeitado', border: 'border-red-200' },
    NOT_CREATED: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Não Criada', border: 'border-gray-200' },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: any; description: string }> = {
    commercialInfo: { label: 'Dados Comerciais', icon: Building2, description: 'Nome, CPF/CNPJ, endereço e dados financeiros' },
    bankAccountInfo: { label: 'Dados Bancários', icon: CreditCard, description: 'Conta bancária para recebimento' },
    documentation: { label: 'Documentação', icon: FileText, description: 'RG/CNH, selfie, contrato social, etc.' },
    general: { label: 'Aprovação Geral', icon: Shield, description: 'Status geral da conta na plataforma' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
    IDENTIFICATION: 'Documento de Identidade (RG/CNH)',
    IDENTIFICATION_SELFIE: 'Selfie com Documento',
    SOCIAL_CONTRACT: 'Contrato Social',
    MEI_CERTIFICATE: 'Certificado MEI',
    MINUTES_OF_CONSTITUTION: 'Ata de Constituição',
    MINUTES_OF_ELECTION: 'Ata de Eleição',
    POWER_OF_ATTORNEY: 'Procuração',
    ENTREPRENEUR_REQUIREMENT: 'Requerimento de Empresário',
    INVOICE: 'Nota Fiscal',
    CUSTOM: 'Documento Personalizado',
    ALLOW_BANK_ACCOUNT_DEPOSIT_STATEMENT: 'Comprovante Bancário',
    EMANCIPATION_OF_MINORS: 'Emancipação de Menores',
};

export default function AsaasStatus() {
    const navigate = useNavigate();
    const { status, pendingDocuments, loading, isApproved, refreshStatus } = useAsaasStatus();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshStatus();
        setRefreshing(false);
    };

    const getStatusConfig = (value: string) => {
        return STATUS_CONFIG[value as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
    };

    const allApproved = isApproved;
    const generalConfig = getStatusConfig(status.general);
    const GeneralIcon = generalConfig.icon;

    return (
        <div className="min-h-screen bg-[#F4F4F0] p-6 font-sans text-accent">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Status da Conta</h1>
                    <p className="text-gray-500 font-medium">Acompanhe a aprovação da sua conta de pagamento</p>
                </div>

                {/* General Status Card */}
                <div className={`border-2 border-black rounded-2xl p-8 text-center space-y-4 ${allApproved ? 'bg-green-50' : 'bg-white'} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                    <div className={`mx-auto w-20 h-20 rounded-full ${generalConfig.bg} flex items-center justify-center`}>
                        <GeneralIcon size={40} className={generalConfig.color} />
                    </div>
                    <h2 className="text-2xl font-black uppercase">{generalConfig.label}</h2>
                    <p className="text-gray-500 font-medium">
                        {allApproved
                            ? 'Sua conta está totalmente aprovada! Você pode usar todas as funcionalidades.'
                            : 'Sua conta está sendo analisada. Complete os itens pendentes abaixo.'}
                    </p>
                    {allApproved && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-black uppercase inline-flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            Ir para o Dashboard <ArrowRight size={20} />
                        </button>
                    )}
                </div>

                {/* Status Checklist */}
                <div className="bg-white border-2 border-black rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase mb-2">Checklist de Aprovação</h3>

                    {Object.entries(CATEGORY_LABELS).map(([key, config]) => {
                        const value = status[key as keyof typeof status] || 'PENDING';
                        const statusCfg = getStatusConfig(value);
                        const Icon = statusCfg.icon;
                        const CategoryIcon = config.icon;

                        return (
                            <div key={key} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${statusCfg.border} transition-all`}>
                                <div className={`w-10 h-10 rounded-full ${statusCfg.bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={20} className={statusCfg.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <CategoryIcon size={16} className="text-gray-400" />
                                        <span className="font-bold text-sm">{config.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
                                </div>
                                <span className={`text-xs font-black uppercase ${statusCfg.color}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Pending Documents */}
                {pendingDocuments.length > 0 && (
                    <div className="bg-white border-2 border-black rounded-2xl p-6 space-y-4">
                        <h3 className="text-lg font-black uppercase mb-2 flex items-center gap-2">
                            <FileText size={20} /> Documentos Pendentes
                        </h3>
                        <p className="text-sm text-gray-500">
                            Envie os documentos abaixo clicando no botão. Você será redirecionado para a página segura do Asaas.
                        </p>

                        <div className="space-y-3">
                            {pendingDocuments.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-black transition-all">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${doc.status === 'APPROVED' ? 'bg-green-100' :
                                            doc.status === 'PENDING' ? 'bg-yellow-100' :
                                                doc.status === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'
                                        }`}>
                                        <FileText size={20} className={
                                            doc.status === 'APPROVED' ? 'text-green-600' :
                                                doc.status === 'PENDING' ? 'text-yellow-600' :
                                                    doc.status === 'REJECTED' ? 'text-red-600' : 'text-gray-400'
                                        } />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-bold text-sm block">
                                            {DOC_TYPE_LABELS[doc.type] || doc.title || doc.type}
                                        </span>
                                        {doc.description && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.description}</p>
                                        )}
                                    </div>
                                    {doc.status === 'NOT_SENT' && doc.onboardingUrl ? (
                                        <a
                                            href={doc.onboardingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-black text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-1 hover:bg-primary transition-colors flex-shrink-0"
                                        >
                                            Enviar <ExternalLink size={14} />
                                        </a>
                                    ) : (
                                        <span className={`text-xs font-bold uppercase ${doc.status === 'APPROVED' ? 'text-green-600' :
                                                doc.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {doc.status === 'APPROVED' ? 'Aprovado' :
                                                doc.status === 'PENDING' ? 'Em análise' : 'Rejeitado'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Refresh Button */}
                <div className="text-center space-y-4">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className="bg-white border-2 border-black px-6 py-3 rounded-xl font-bold uppercase inline-flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {refreshing ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <RefreshCw size={18} />
                        )}
                        Atualizar Status
                    </button>

                    {!allApproved && (
                        <p className="text-xs text-gray-400">
                            A análise pode levar de algumas horas a 2 dias úteis.
                        </p>
                    )}
                </div>

                {/* Skip to Dashboard */}
                <div className="text-center pb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 font-bold text-sm underline decoration-1 hover:text-black transition-colors"
                    >
                        Ir para o Dashboard (funcionalidades limitadas)
                    </button>
                </div>
            </div>
        </div>
    );
}
