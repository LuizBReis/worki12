
export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center fade-in">
            <div className="bg-white/50 p-8 rounded-2xl border border-border/50 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-accent mb-2">{title}</h2>
                <p className="text-gray-500">Esta página está em construção.</p>
            </div>
        </div>
    );
}
