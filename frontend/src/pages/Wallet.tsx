import { DollarSign, CreditCard, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';

export default function Wallet() {
    return (
        <div className="flex flex-col gap-8 pb-12 font-sans text-accent">

            <header>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Carteira</h2>
            </header>

            {/* Main Balance Card */}
            <div className="bg-black text-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-sm font-bold uppercase text-gray-400 tracking-wider">Saldo Disponível</span>
                    <h2 className="text-6xl font-black tracking-tighter text-white mt-2 mb-6">R$ 450,00</h2>

                    <div className="flex gap-4">
                        <button className="flex-1 bg-primary text-white py-4 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-center gap-2">
                            <ArrowDownLeft size={20} /> Sacar (Pix)
                        </button>
                        <button className="flex-1 bg-white/10 text-white py-4 rounded-xl font-bold uppercase hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                            Adicionar Conta
                        </button>
                    </div>
                </div>
                {/* Background Element */}
                <DollarSign size={200} className="absolute -top-10 -right-10 text-white/5 rotate-12" />
            </div>

            {/* Income/Expense Stats */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-black">
                    <div className="flex items-center gap-2 mb-2 text-green-600">
                        <ArrowDownLeft size={20} /> <span className="text-xs font-black uppercase">Entradas (Set)</span>
                    </div>
                    <h3 className="text-2xl font-black">R$ 1.250,00</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-black">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <ArrowUpRight size={20} /> <span className="text-xs font-black uppercase">Saques (Set)</span>
                    </div>
                    <h3 className="text-2xl font-black">R$ 800,00</h3>
                </div>
            </div>

            {/* Transactions List */}
            <section className="bg-white border-2 border-black rounded-2xl p-6">
                <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                    <History size={20} /> Histórico de Transações
                </h3>

                <div className="space-y-4">
                    {[
                        { title: 'Pagamento - Garçom Casamento', date: '22 Set', val: 200, type: 'in' },
                        { title: 'Saque Pix - NuBank', date: '20 Set', val: 500, type: 'out' },
                        { title: 'Pagamento - Auxiliar Restaurante', date: '18 Set', val: 150, type: 'in' },
                        { title: 'Pagamento - Promotor', date: '15 Set', val: 180, type: 'in' },
                    ].map((t, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${t.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {t.type === 'in' ? <DollarSign size={20} /> : <CreditCard size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{t.title}</h4>
                                    <p className="text-xs text-gray-400">{t.date}</p>
                                </div>
                            </div>
                            <span className={`text-lg font-black ${t.type === 'in' ? 'text-green-600' : 'text-gray-900'}`}>
                                {t.type === 'in' ? '+' : '-'} R$ {t.val}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
}
