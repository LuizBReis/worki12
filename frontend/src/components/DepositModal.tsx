import { useState } from 'react';
import { WalletService } from '../services/walletService';
import { Loader2, X, ExternalLink, QrCode } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
    const { addToast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [pixUrl, setPixUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleInitiate = async () => {
        const value = parseFloat(amount.replace(',', '.'));
        if (!value || value < 5) {
            addToast('O valor mínimo para depósito é R$ 5,00', 'error');
            return;
        }
        if (value > 50000) {
            addToast('O valor máximo para depósito é R$ 50.000,00', 'error');
            return;
        }

        setLoading(true);
        // Calls the backend to generate the Asaas PIX charge and split
        const result = await WalletService.createDeposit({ amount: value });
        setLoading(false);

        if (result.pixQrCodeUrl) {
            setPixUrl(result.pixQrCodeUrl);
            addToast('Cobrança gerada com sucesso!', 'success');
        } else {
            addToast(result.error || 'Erro ao iniciar depósito', 'error');
        }
    };

    const handleClose = () => {
        if (pixUrl) {
            onSuccess(); // We trigger success to refresh list or assume pending
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm border border-blue-100">
                        <QrCode size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase text-gray-900 tracking-tight text-center">Adicionar Créditos</h3>
                    <p className="text-sm font-medium text-gray-500 text-center mt-2 max-w-[280px]">
                        Compre créditos pagando no PIX, Boleto ou Cartão de Crédito. O saldo entra assim que o pagamento for aprovado.
                    </p>
                </div>

                {!pixUrl ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Valor do Depósito (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:border-black focus:ring-0 outline-none font-black text-2xl text-gray-900 transition-all placeholder:text-gray-300"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 mt-3 flex items-start gap-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5 shrink-0"></span>
                                <span>O valor total depositado sera adicionado ao seu saldo. A taxa da plataforma e cobrada apenas no momento do saque.</span>
                            </p>
                        </div>
                        <button
                            onClick={handleInitiate}
                            disabled={loading || !amount}
                            className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-xl shadow-black/10 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Gerar Fatura (PIX, Boleto ou Cartão)'}

                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 font-bold text-sm">
                            <p>Fatura gerada com sucesso!</p>
                            <p className="text-xs font-medium text-emerald-600/80 mt-1">Abra o link para pagar usando PIX, Boleto ou Cartão. O saldo será adicionado após a leitura do Asaas.</p>
                        </div>

                        <a
                            href={pixUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-xl shadow-blue-600/20"
                        >
                            <ExternalLink size={18} />
                            Abrir Fatura Asaas
                        </a>

                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-3 text-sm font-bold uppercase text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Já Paguei / Fechar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
