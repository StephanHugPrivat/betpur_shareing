'use client'

import { useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { createLoanRequest } from '@/app/actions/loanRequests'

export default function RequestButton({ itemId, isRequested }: { itemId: string, isRequested: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [nachricht, setNachricht] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    if (isRequested || success) {
        return (
            <button
                disabled
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold cursor-not-allowed border border-emerald-200"
            >
                <MessageCircle className="w-4 h-4" />
                Anfrage gesendet
            </button>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await createLoanRequest(itemId, nachricht)
            setSuccess(true)
            setIsOpen(false)
        } catch (err: any) {
            setError(err.message || 'Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
                <MessageCircle className="w-4 h-4" />
                Ausleihen anfragen
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Ausleihen anfragen</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Schreibe eine kurze Nachricht an den Besitzer.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="nachricht" className="text-sm font-medium text-gray-700">
                                    Nachricht (optional)
                                </label>
                                <textarea
                                    id="nachricht"
                                    value={nachricht}
                                    onChange={(e) => setNachricht(e.target.value)}
                                    placeholder="Ich brauche es für..."
                                    rows={4}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Senden...
                                        </>
                                    ) : (
                                        'Senden'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
