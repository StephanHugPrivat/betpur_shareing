'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Check, X, Ban, Loader2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminProfile {
    id: string
    name?: string | null
    wohnung?: string | null
    status: string
    is_admin?: boolean
    created_at?: string
    items?: { count: number }[]
}

export default function AdminDashboard() {
    const [profiles, setProfiles] = useState<AdminProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        checkAdminAndLoad()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const checkAdminAndLoad = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: currentUser } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            if (!currentUser?.is_admin) {
                router.push('/marktplatz')
                return
            }

            setIsAdmin(true)
            loadData()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
        }
    }

    const loadData = async () => {
        setLoading(true)
        const { data: members, error: memError } = await supabase
            .from('profiles')
            .select('*, items(count)')
            .order('created_at', { ascending: false })

        if (memError) {
            setError(memError.message)
        } else {
            setProfiles(members || [])
        }
        setLoading(false)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        const { error: updateErr } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', id)

        if (updateErr) {
            alert("Fehler: " + updateErr.message)
        } else {
            loadData()
        }
    }

    if (loading && !isAdmin) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    if (!isAdmin && !loading) return null

    const pending = profiles.filter(p => p.status === 'pending')
    const active = profiles.filter(p => p.status === 'active')

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Admin Bereich
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Verwalte die Mitglieder der Siedlung.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">Aktive Mitglieder</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{active.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">Ausstehend</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{pending.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">Objekte Gesamt</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {active.reduce((acc, p) => acc + (p.items?.[0]?.count || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center">
                    <h2 className="font-bold text-amber-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Ausstehende Freischaltungen
                    </h2>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
                        {pending.length} neu
                    </span>
                </div>
                <div className="divide-y divide-gray-100">
                    {pending.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">Keine neuen Anfragen.</div>
                    ) : (
                        pending.map(p => (
                            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-bold text-gray-900">{p.name || 'Kein Name'}</div>
                                    <div className="text-sm text-gray-500 mt-0.5">{p.wohnung}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus(p.id, 'active')}
                                        className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        <Check className="w-4 h-4" /> Freischalten
                                    </button>
                                    <button
                                        onClick={() => updateStatus(p.id, 'inactive')}
                                        className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        <X className="w-4 h-4" /> Ablehnen
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Active Members */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        Aktive Mitglieder ({active.length})
                    </h2>
                </div>
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {active.map(p => (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div>
                                <div className="font-bold text-gray-900">{p.name || 'Kein Name'}</div>
                                <div className="text-sm text-gray-500 mt-0.5">{p.wohnung} • {p.items?.[0]?.count || 0} Objekte</div>
                            </div>
                            <button
                                onClick={() => updateStatus(p.id, 'inactive')}
                                title="Mitglied deaktivieren"
                                className="flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            >
                                <Ban className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}
