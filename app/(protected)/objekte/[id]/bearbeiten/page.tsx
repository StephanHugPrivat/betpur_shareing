import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import ItemForm from '@/components/ItemForm'

export const metadata = {
    title: 'Objekt bearbeiten – SiedlungsShare',
}

export default async function BearbeitenPage({ params }: { params: { id: string } }) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: item, error } = await supabase
        .from('items')
        .select('id, titel, beschreibung, kategorie, standort, foto_url, owner_id, status')
        .eq('id', params.id)
        .single()

    if (error || !item) notFound()

    // Only the owner may edit
    if (item.owner_id !== user.id) {
        redirect('/objekte')
    }

    // Cannot edit while loaned
    const isAusgeliehen = item.status === 'ausgeliehen'

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
                        <Pencil className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Objekt bearbeiten</h1>
                </div>
                <p className="text-gray-500 text-sm">
                    Ändere die Angaben zu <span className="font-semibold text-gray-700">{item.titel}</span>.
                </p>
            </header>

            {isAusgeliehen && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
                    Dieses Objekt ist gerade ausgeliehen. Einige Angaben können trotzdem bearbeitet werden.
                </div>
            )}

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <ItemForm
                    initialData={{
                        id: item.id,
                        titel: item.titel,
                        beschreibung: item.beschreibung ?? '',
                        kategorie: item.kategorie,
                        standort: item.standort ?? '',
                        foto_url: item.foto_url,
                    }}
                    fotoRequired={false}
                    submitLabel="Änderungen speichern"
                />
            </div>
        </div>
    )
}
