import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import ItemCard, { ItemCardData } from '@/components/ItemCard'
import MeineObjekteActions from './MeineObjekteActions'

export const metadata = {
    title: 'Meine Objekte – SiedlungsShare',
    description: 'Verwalte die Gegenstände, die du der Gemeinschaft zum Ausleihen anbietest.',
}

export default async function ObjektePage() {
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

    const { data: items, error } = await supabase
        .from('items')
        .select('id, titel, beschreibung, kategorie, standort, foto_url, status')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    if (error) console.error('ObjektePage fetch error:', error)

    const mapped: ItemCardData[] = (items ?? []).map((item) => ({
        id: item.id,
        titel: item.titel,
        beschreibung: item.beschreibung,
        kategorie: item.kategorie,
        standort: item.standort,
        foto_url: item.foto_url,
        status: item.status,
        owner: null,
    }))

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Meine Objekte</h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        {mapped.length === 0
                            ? 'Du hast noch keine Objekte eingestellt.'
                            : `${mapped.length} Gegenstand${mapped.length !== 1 ? 'e' : ''} eingestellt`}
                    </p>
                </div>
                <Link
                    href="/objekte/neu"
                    id="neues-objekt-btn"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                    <PlusCircle className="w-4 h-4" />
                    Neues Objekt
                </Link>
            </header>

            {mapped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <PlusCircle className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Noch nichts eingestellt</p>
                    <p className="text-gray-400 text-sm mt-1 mb-6">
                        Teile einen Gegenstand mit deiner Nachbarschaft.
                    </p>
                    <Link
                        href="/objekte/neu"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Erstes Objekt erfassen
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {mapped.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            actions={<MeineObjekteActions item={item} />}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
