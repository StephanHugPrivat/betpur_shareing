export default function MarktplatzPage() {
    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Marktplatz</h1>
                <p className="text-gray-500 mt-2 font-medium">Entdecke Gegenstände aus deiner Nachbarschaft.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder cards */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-center">
                    <p className="text-gray-500">Hier werden bald Gegenstände erscheinen.</p>
                </div>
            </div>
        </div>
    )
}
