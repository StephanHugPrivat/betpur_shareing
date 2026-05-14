import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    ArrowLeft,
    Package,
    MapPin,
    User,
    Wrench,
    Home,
    Flower2,
    Dumbbell,
    Cpu,
    Tag,
    Clock,
    MessageCircle,
} from 'lucide-react'
import RequestButton from './RequestButton'

// ------------------------------------------------------------------
// Metadata
// ------------------------------------------------------------------
export async function generateMetadata() {
    return {
        title: 'Objekt-Detail – SiedlungsShare',
        description: 'Details zum Gegenstand in SiedlungsShare',
    }
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
type ItemStatus = 'verfuegbar' | 'ausgeliehen' | 'inaktiv'
type ItemKategorie = 'werkzeug' | 'haushalt' | 'garten' | 'sport' | 'elektronik' | 'sonstiges'

const KATEGORIE_LABEL: Record<ItemKategorie, string> = {
    werkzeug: 'Werkzeug',
    haushalt: 'Haushalt',
    garten: 'Garten',
    sport: 'Sport & Freizeit',
    elektronik: 'Elektronik',
    sonstiges: 'Sonstiges',
}

const KATEGORIE_ICON: Record<ItemKategorie, React.ReactNode> = {
    werkzeug: <Wrench className="w-4 h-4" />,
    haushalt: <Home className="w-4 h-4" />,
    garten: <Flower2 className="w-4 h-4" />,
    sport: <Dumbbell className="w-4 h-4" />,
    elektronik: <Cpu className="w-4 h-4" />,
    sonstiges: <Tag className="w-4 h-4" />,
}

const STATUS_STYLE: Record<ItemStatus, string> = {
    verfuegbar: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ausgeliehen: 'bg-amber-50 text-amber-700 border-amber-200',
    inaktiv: 'bg-gray-100 text-gray-500 border-gray-200',
}

const STATUS_DOT: Record<ItemStatus, string> = {
    verfuegbar: 'bg-emerald-500',
    ausgeliehen: 'bg-amber-500',
    inaktiv: 'bg-gray-400',
}

const STATUS_LABEL: Record<ItemStatus, string> = {
    verfuegbar: 'Verfügbar',
    ausgeliehen: 'Gerade ausgeliehen',
    inaktiv: 'Nicht verfügbar',
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default async function ItemDetailPage({ params }: { params: { id: string } }) {
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
        .select(`
            id,
            titel,
            beschreibung,
            kategorie,
            standort,
            foto_url,
            status,
            owner_id,
            created_at,
            profiles!owner_id (
                name,
                wohnung
            )
        `)
        .eq('id', params.id)
        .single()

    if (error || !item) {
        notFound()
    }

    const isOwner = item.owner_id === user.id
    const status = item.status as ItemStatus
    const kategorie = item.kategorie as ItemKategorie
    const owner = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    const canRequest = status === 'verfuegbar' && !isOwner

    let isRequested = false
    if (canRequest) {
        const { count } = await supabase
            .from('loan_requests')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', params.id)
            .eq('requester_id', user.id)
            .in('status', ['pending', 'accepted'])
        
        if (count && count > 0) isRequested = true
    }

    const formattedDate = new Date(item.created_at).toLocaleDateString('de-CH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Back */}
            <Link
                href="/marktplatz"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium -mb-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Zurück zum Marktplatz
            </Link>

            {/* Photo */}
            <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm border border-gray-100">
                {item.foto_url ? (
                    <div className="relative w-full h-72 md:h-96">
                        <Image
                            src={item.foto_url}
                            alt={item.titel}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 700px"
                        />
                    </div>
                ) : (
                    <div className="w-full h-48 flex items-center justify-center">
                        <Package className="w-20 h-20 text-gray-300" />
                    </div>
                )}
            </div>

            {/* Header card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                {/* Status + Kategorie */}
                <div className="flex items-center gap-2 mb-3">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                        {STATUS_LABEL[status]}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                        {KATEGORIE_ICON[kategorie]}
                        {KATEGORIE_LABEL[kategorie]}
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-1">{item.titel}</h1>

                <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    Eingestellt am {formattedDate}
                </div>

                {item.beschreibung && (
                    <p className="mt-4 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {item.beschreibung}
                    </p>
                )}

                {/* Meta rows */}
                <div className="mt-5 space-y-3">
                    {item.standort && (
                        <div className="flex items-start gap-3 text-sm">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Standort</p>
                                <p className="text-gray-700 font-medium">{item.standort}</p>
                            </div>
                        </div>
                    )}

                    {owner && (
                        <div className="flex items-start gap-3 text-sm">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Besitzer</p>
                                <p className="text-gray-700 font-medium">
                                    {owner.name}
                                    {owner.wohnung && (
                                        <span className="text-gray-400 font-normal"> · {owner.wohnung}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                {isOwner ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-gray-500 font-medium">Das ist dein Objekt.</p>
                        <Link
                            href={`/objekte/${item.id}/bearbeiten`}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Objekt bearbeiten
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-gray-700 font-semibold">Interesse?</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            {canRequest
                                ? 'Sende eine Anfrage an den Besitzer, um diesen Gegenstand auszuleihen.'
                                : status === 'ausgeliehen'
                                    ? 'Dieses Objekt ist gerade ausgeliehen. Schau später nochmal vorbei.'
                                    : 'Dieses Objekt ist momentan nicht verfügbar.'}
                        </p>
                        {canRequest && (
                            <RequestButton itemId={item.id} isRequested={isRequested} />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
