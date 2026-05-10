'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, EyeOff, Eye, Loader2 } from 'lucide-react'
import type { ItemCardData } from '@/components/ItemCard'

interface MeineObjekteActionsProps {
    item: ItemCardData
}

export default function MeineObjekteActions({ item }: MeineObjekteActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const isAusgeliehen = item.status === 'ausgeliehen'
    const isInaktiv = item.status === 'inaktiv'

    const handleToggleStatus = async () => {
        if (isAusgeliehen) return // Cannot deactivate while loaned

        setError(null)
        const newStatus = isInaktiv ? 'verfuegbar' : 'inaktiv'

        const { error: updateError } = await supabase
            .from('items')
            .update({ status: newStatus })
            .eq('id', item.id)

        if (updateError) {
            setError(updateError.message)
            return
        }

        startTransition(() => {
            router.refresh()
        })
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href={`/objekte/${item.id}/bearbeiten`}
                id={`bearbeiten-${item.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors"
            >
                <Pencil className="w-3.5 h-3.5" />
                Bearbeiten
            </Link>

            <button
                id={`status-toggle-${item.id}`}
                onClick={handleToggleStatus}
                disabled={isAusgeliehen || isPending}
                title={isAusgeliehen ? 'Kann nicht deaktiviert werden (ausgeliehen)' : isInaktiv ? 'Reaktivieren' : 'Deaktivieren'}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    isAusgeliehen
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : isInaktiv
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border-gray-200 hover:border-red-200'
                }`}
            >
                {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isInaktiv ? (
                    <>
                        <Eye className="w-3.5 h-3.5" />
                        Aktivieren
                    </>
                ) : (
                    <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Deaktivieren
                    </>
                )}
            </button>

            {error && (
                <p className="text-xs text-red-500 col-span-2 mt-1">{error}</p>
            )}
        </div>
    )
}
