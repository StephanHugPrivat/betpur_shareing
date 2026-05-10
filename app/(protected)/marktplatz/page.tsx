import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MarktplatzClient from '@/components/MarktplatzClient'
import type { ItemCardData } from '@/components/ItemCard'

export const metadata = {
    title: 'Marktplatz – SiedlungsShare',
    description: 'Entdecke Gegenstände aus deiner Nachbarschaft und leihe aus, was du brauchst.',
}

export default async function MarktplatzPage() {
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

    // Fetch all items (active + ausgeliehen + inaktiv) with owner profile
    const { data: items, error } = await supabase
        .from('items')
        .select(`
            id,
            titel,
            beschreibung,
            kategorie,
            standort,
            foto_url,
            status,
            profiles!owner_id (
                name,
                wohnung
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Marktplatz fetch error:', error)
    }

    const mapped: ItemCardData[] = (items ?? []).map((item) => ({
        id: item.id,
        titel: item.titel,
        beschreibung: item.beschreibung,
        kategorie: item.kategorie,
        standort: item.standort,
        foto_url: item.foto_url,
        status: item.status,
        owner: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
    }))

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Marktplatz</h1>
                <p className="text-gray-500 mt-2 font-medium">
                    Entdecke Gegenstände aus deiner Nachbarschaft.
                </p>
            </header>

            <MarktplatzClient items={mapped} />
        </div>
    )
}
