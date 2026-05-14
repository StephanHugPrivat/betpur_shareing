'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { acceptLoanRequest, declineLoanRequest } from '@/app/actions/loanRequests'

export default function RequestActionButtons({ requestId }: { requestId: string }) {
    const [action, setAction] = useState<'accept' | 'decline' | null>(null)
    const [antwort, setAntwort] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!action) return

        setIsLoading(true)
        setError(null)

        try {
            if (action === 'accept') {
                await acceptLoanRequest(requestId, antwort)
            } else {
                await declineLoanRequest(requestId, antwort)
            }
            setAction(null)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
            setIsLoading(false)
        }
    }

    if (action) {
        return (
            <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {action === 'accept' ? 'Anfrage bestätigen' : 'Anfrage ablehnen'}
                </h4>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <textarea
                        value={antwort}
                        onChange={(e) => setAntwort(e.target.value)}
                        placeholder={action === 'accept' ? "Optionale Nachricht (z.B. 'Komm heute ab 18 Uhr vorbei')" : "Optionale Begründung (z.B. 'Habe es gerade selbst im Einsatz')"}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    />
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAction(null)}
                            disabled={isLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1 ${
                                action === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                            {action === 'accept' ? 'Bestätigen' : 'Ablehnen'}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 mt-1">
            <button
                onClick={() => setAction('accept')}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
            >
                <Check className="w-3.5 h-3.5" />
                Bestätigen
            </button>
            <button
                onClick={() => setAction('decline')}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
            >
                <X className="w-3.5 h-3.5" />
                Ablehnen
            </button>
        </div>
    )
}
