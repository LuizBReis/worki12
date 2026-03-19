import { useState, useEffect } from 'react';
import { WalletService } from '../services/walletService';
import { Loader2, X, ExternalLink, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { supabase } from '../lib/supabase';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { value: 'PIX', label: 'PIX', icon: Smartphone, tag: 'Instantaneo' },
    { value: 'CREDIT_CARD', label: 'Cartao de Credito', icon: CreditCard, tag: 'Imediato' },
    { value: 'BOLETO', label: 'Boleto Bancario', icon: Landmark, tag: '1-3 dias' },
    { value: 'UNDEFINED', label: 'Escolher depois', icon: Wallet, tag: 'Na fatura' },
];

const SERVICE_FEE_PCT = 0.08;
const PROCESSING_FEE = 4.00;
const MIN_DEPOSIT = 50;

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
    const { addToast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [billingType, setBillingType] = useState<string>('PIX');
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userDoc, setUserDoc] = useState<{ name: string; cpfCnpj: string } | null>(null);
    const trapRef = useFocusTrap(isOpen);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setBillingType('PIX');
            setInvoiceUrl(null);

            (async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const userType = user.user_metadata?.user_type;
                if (userType === 'hire') {
                    let { data } = await supabase.from('companies').select('name, cnpj').eq('owner_id', user.id).single();
                    if (!data) {
                        ({ data } = await supabase.from('companies').select('name, cnpj').eq('id', user.id).single());
                    }
                    if (data) setUserDoc({ name: data.name || '', cpfCnpj: data.cnpj || '' });
                } else {
                    const { data } = await supabase.from('workers').select('full_name, cpf').eq('id', user.id).single();
                    if (data) setUserDoc({ name: data.full_name || '', cpfCnpj: data.cpf || '' });
                }
            })();
        }
    }, [isOpen, trapRef]);

    if (!isOpen) return null;

    const depositVal = parseFloat(amount.replace(',', '.')) || 0;
    const serviceFee = parseFloat((depositVal * SERVICE_FEE_PCT).toFixed(2));
    const creditAmount = depositVal > 0 ? Math.max(0, parseFloat((depositVal - serviceFee - PROCESSING_FEE).toFixed(2))) : 0;
    const isValid = depositVal >= MIN_DEPOSIT && depositVal <= 50000;

    const handleInitiate = async () => {
        if (!isValid) {
            addToast(`Valor minimo: R$ ${MIN_DEPOSIT},00`, 'error');
            return;
        }
        if (!userDoc?.cpfCnpj) {
            addToast('CPF ou CNPJ nao encontrado. Atualize seu perfil.', 'error');
            return;
        }

        setLoading(true);
        const result = await WalletService.createDeposit({
            amount: depositVal,
            name: userDoc.name,
            cpfCnpj: userDoc.cpfCnpj,
            billingType,
        });
        setLoading(false);

        if (result.invoiceUrl || result.pixQrCodeUrl) {
            setInvoiceUrl(result.invoiceUrl || result.pixQrCodeUrl || null);
        } else {
            addToast(result.error || 'Erro ao gerar fatura', 'error');
        }
    };

    const handleClose = () => {
        if (invoiceUrl) onSuccess();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }}
        >
            <div
                ref={trapRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="deposit-title"
                className="bg-white rounded-2xl w-full max-w-[440px] relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl overflow-hidden"
            >
                {/* Header — compact, Stripe-like */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 id="deposit-title" className="text-lg font-bold text-gray-900">Adicionar creditos</h3>
                    <button
                        onClick={handleClose}
                        aria-label="Fechar"
                        className="text-gray-400 hover:text-gray-900 transition-colors w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                {!invoiceUrl ? (
                    <div className="p-6 space-y-5">

                        {/* Amount input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Valor</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">R$</span>
                                <input
                                    type="number"
                                    aria-label="Valor do deposito"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min={MIN_DEPOSIT}
                                    className="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 focus:border-black focus:ring-1 focus:ring-black outline-none font-bold text-xl text-gray-900 transition-all placeholder:text-gray-300 placeholder:font-normal"
                                    placeholder={`${MIN_DEPOSIT},00`}
                                    autoFocus
                                />
                            </div>
                            {depositVal > 0 && depositVal < MIN_DEPOSIT && (
                                <p className="text-xs text-red-500 mt-1 font-medium">Minimo R$ {MIN_DEPOSIT},00</p>
                            )}
                        </div>

                        {/* Payment method tabs — Stripe style */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Forma de pagamento</label>
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                {PAYMENT_METHODS.map(method => {
                                    const Icon = method.icon;
                                    const selected = billingType === method.value;
                                    return (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setBillingType(method.value)}
                                            className={`flex-1 py-2 px-1 rounded-md text-center transition-all ${
                                                selected
                                                    ? 'bg-white shadow-sm text-gray-900 font-bold'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <Icon size={18} className="mx-auto mb-0.5" />
                                            <span className="text-[10px] block leading-tight">{method.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                                {PAYMENT_METHODS.find(m => m.value === billingType)?.tag}
                            </p>
                        </div>

                        {/* Fee breakdown — only shows when amount is valid */}
                        {isValid && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    <div className="flex justify-between px-4 py-2.5 text-sm">
                                        <span className="text-gray-500">Deposito</span>
                                        <span className="font-semibold text-gray-900">R$ {depositVal.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2.5 text-sm">
                                        <span className="text-gray-500">Taxa Worki (8%)</span>
                                        <span className="font-semibold text-gray-500">- R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2.5 text-sm">
                                        <span className="text-gray-500">Operador financeiro</span>
                                        <span className="font-semibold text-gray-500">- R$ {PROCESSING_FEE.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                                    <span className="font-bold text-gray-900">Credito no saldo</span>
                                    <span className="font-bold text-lg text-green-600">R$ {creditAmount.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                        )}

                        {/* Info text */}
                        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                            Ao contratar, o valor debitado e exatamente o orcamento do job. Sem custos extras.
                        </p>

                        {/* Submit button */}
                        <button
                            onClick={handleInitiate}
                            disabled={loading || !isValid}
                            className="w-full bg-black text-white py-3.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>Pagar R$ {depositVal > 0 ? depositVal.toFixed(2).replace('.', ',') : '0,00'}</>
                            )}
                        </button>

                        <p className="text-[10px] text-gray-300 text-center">
                            Pagamento processado com seguranca pelo Asaas
                        </p>
                    </div>
                ) : (
                    /* Success state */
                    <div className="p-6 space-y-5">
                        <div className="text-center py-2">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Fatura gerada</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Clique abaixo para abrir e pagar. O credito sera adicionado automaticamente apos a confirmacao.
                            </p>
                        </div>

                        <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-black text-white py-3.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all flex justify-center items-center gap-2"
                        >
                            <ExternalLink size={16} />
                            Abrir fatura de pagamento
                        </a>

                        <button
                            onClick={handleClose}
                            className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Ja paguei / Fechar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
