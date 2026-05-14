import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, Package } from 'lucide-react'
import RequestActionButtons from './RequestActionButtons'

export async function generateMetadata() {
    return {
        title: 'Anfragen – SiedlungsShare',
        description: 'Deine gesendeten und erhaltenen Anfragen',
    }
}

export default async function AnfragenPage() {
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

    // 1. Erhaltene Anfragen (Ich bin Besitzer des Objekts)
    const { data: erhalteneAnfragen } = await supabase
        .from('loan_requests')
        .select(`
            id,
            nachricht,
            status,
            owner_antwort,
            created_at,
            items!inner(id, titel, foto_url, owner_id),
            profiles!requester_id(name)
        `)
        .eq('items.owner_id', user.id)
        .order('created_at', { ascending: false })

    // 2. Gesendete Anfragen (Ich bin Anfragesteller)
    const { data: gesendeteAnfragen } = await supabase
        .from('loan_requests')
        .select(`
            id,
            nachricht,
            status,
            owner_antwort,
            created_at,
            items!inner(id, titel, foto_url, profiles!owner_id(name))
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'accepted') {
            return (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bestätigt
                </span>
            )
        }
        if (status === 'declined') {
            return (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                    <XCircle className="w-3.5 h-3.5" /> Abgelehnt
                </span>
            )
        }
        return (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <Clock className="w-3.5 h-3.5" /> Ausstehend
            </span>
        )
    }

    return (
        <div className="flex flex-col gap-8 max-w-2xl pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Anfragen</h1>
                <p className="text-gray-500 text-sm">Verwalte deine Ausleihen und Anfragen.</p>
            </div>

            {/* Erhaltene Anfragen */}
            <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    Erhaltene Anfragen
                    {erhalteneAnfragen?.filter(r => r.status === 'pending').length ? (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {erhalteneAnfragen.filter(r => r.status === 'pending').length} neu
                        </span>
                    ) : null}
                </h2>

                <div className="flex flex-col gap-4">
                    {!erhalteneAnfragen?.length ? (
                        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            Niemand hat bisher etwas von dir angefragt.
                        </p>
                    ) : (
                        erhalteneAnfragen.map((req: unknown) => {
                            const typedReq = req as { id: string, status: string, nachricht: string, owner_antwort: string, profiles: unknown, items: unknown }
                            const requesterName = Array.isArray(typedReq.profiles) ? (typedReq.profiles[0] as {name: string})?.name : (typedReq.profiles as {name: string})?.name
                            const item = Array.isArray(typedReq.items) ? (typedReq.items[0] as {id: string, titel: string, foto_url: string}) : (typedReq.items as {id: string, titel: string, foto_url: string})

                            return (
                                <div key={typedReq.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative border border-gray-200">
                                        {item?.foto_url ? (
                                            <Image src={item.foto_url} alt={item.titel} fill className="object-cover" sizes="64px" />
                                        ) : (
                                            <Package className="w-6 h-6 m-auto mt-5 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-1">
                                            <Link href={`/marktplatz/${item?.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                                                {item?.titel}
                                            </Link>
                                            <StatusBadge status={typedReq.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">Angefragt von <span className="font-medium text-gray-700">{requesterName}</span></p>
                                        
                                        {typedReq.nachricht && (
                                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-3 border border-gray-100">
                                                <span className="text-xs font-semibold text-gray-400 block mb-1">Nachricht:</span>
                                                &quot;{typedReq.nachricht}&quot;
                                            </div>
                                        )}

                                        {typedReq.status === 'pending' && (
                                            <RequestActionButtons requestId={typedReq.id} />
                                        )}
                                        {typedReq.owner_antwort && typedReq.status !== 'pending' && (
                                            <div className="bg-indigo-50/50 rounded-lg p-3 text-sm text-gray-600 border border-indigo-100/50">
                                                <span className="text-xs font-semibold text-indigo-400 block mb-1">Deine Antwort:</span>
                                                &quot;{typedReq.owner_antwort}&quot;
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>

            {/* Gesendete Anfragen */}
            <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Meine Anfragen</h2>

                <div className="flex flex-col gap-4">
                    {!gesendeteAnfragen?.length ? (
                        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            Du hast noch keine Gegenstände angefragt.
                        </p>
                    ) : (
                        gesendeteAnfragen.map((req: unknown) => {
                            const typedReq = req as { id: string, status: string, nachricht: string, owner_antwort: string, profiles: unknown, items: unknown }
                            const item = Array.isArray(typedReq.items) ? (typedReq.items[0] as {id: string, titel: string, foto_url: string, profiles: unknown}) : (typedReq.items as {id: string, titel: string, foto_url: string, profiles: unknown})
                            const ownerProfile = Array.isArray(item?.profiles) ? (item.profiles[0] as {name: string}) : (item?.profiles as {name: string})
                            const ownerName = ownerProfile?.name

                            return (
                                <div key={typedReq.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 opacity-90 hover:opacity-100 transition-opacity">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative border border-gray-200">
                                        {item?.foto_url ? (
                                            <Image src={item.foto_url} alt={item.titel} fill className="object-cover" sizes="64px" />
                                        ) : (
                                            <Package className="w-6 h-6 m-auto mt-5 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-1">
                                            <Link href={`/marktplatz/${item?.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                                                {item?.titel}
                                            </Link>
                                            <StatusBadge status={typedReq.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">Besitzer: <span className="font-medium text-gray-700">{ownerName}</span></p>
                                        
                                        {typedReq.owner_antwort && (
                                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-2 border border-gray-100">
                                                <span className="text-xs font-semibold text-gray-400 block mb-1">Antwort von {ownerName}:</span>
                                                &quot;{typedReq.owner_antwort}&quot;
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>
        </div>
    )
}
