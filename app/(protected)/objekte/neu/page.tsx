import Link from 'next/link'
import { ArrowLeft, PlusCircle } from 'lucide-react'
import ItemForm from '@/components/ItemForm'

export const metadata = {
    title: 'Neues Objekt – SiedlungsShare',
    description: 'Teile einen Gegenstand mit deiner Nachbarschaft.',
}

export default function NeuesObjektPage() {
    return (
        <div className="flex flex-col gap-6 max-w-xl">
            <Link
                href="/objekte"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium -mb-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Meine Objekte
            </Link>

            <header>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                        <PlusCircle className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Neues Objekt erfassen</h1>
                </div>
                <p className="text-gray-500 text-sm">
                    Teile einen Gegenstand mit deiner Nachbarschaft.
                    Ein Foto ist Pflicht, damit andere das Objekt gut einschätzen können.
                </p>
            </header>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <ItemForm
                    fotoRequired={true}
                    submitLabel="Objekt eintragen"
                />
            </div>
        </div>
    )
}
