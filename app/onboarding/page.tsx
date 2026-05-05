'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'

export default function OnboardingPage() {
    const [titel, setTitel] = useState('')
    const [beschreibung, setBeschreibung] = useState('')
    const [kategorie, setKategorie] = useState('haushalt')
    const [standort, setStandort] = useState('')
    const [file, setFile] = useState<File | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Nicht eingeloggt")

            let foto_url = null

            if (file) {
                // Compress image
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                    fileType: 'image/webp'
                }
                const compressedFile = await imageCompression(file, options)
                const fileName = `${user.id}/${Date.now()}.webp`

                const { error: uploadError } = await supabase.storage
                    .from('items')
                    .upload(fileName, compressedFile, { upsert: false })

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage.from('items').getPublicUrl(fileName)
                foto_url = publicUrlData.publicUrl
            }

            const { error: insertError } = await supabase.from('items').insert({
                owner_id: user.id,
                titel,
                beschreibung,
                kategorie,
                standort,
                foto_url
            })

            if (insertError) throw insertError

            router.push('/marktplatz')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 relative overflow-hidden">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 relative z-10 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="text-blue-600 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
                        Dein erstes Objekt
                    </h1>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">
                        Um SiedlungsShare nutzen zu können, musst du mindestens einen Gegenstand aus deinem Besitz der Gemeinschaft zum Ausleihen anbieten.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Titel des Gegenstands</label>
                        <input
                            type="text"
                            required
                            value={titel}
                            onChange={(e) => setTitel(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="z.B. Schlagbohrmaschine"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Kategorie</label>
                        <select
                            value={kategorie}
                            onChange={(e) => setKategorie(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
                        >
                            <option value="werkzeug">Werkzeug</option>
                            <option value="haushalt">Haushalt</option>
                            <option value="garten">Garten</option>
                            <option value="sport">Sport & Freizeit</option>
                            <option value="elektronik">Elektronik</option>
                            <option value="sonstiges">Sonstiges</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Beschreibung (Optional)</label>
                        <textarea
                            value={beschreibung}
                            onChange={(e) => setBeschreibung(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-[100px]"
                            placeholder="Besonderheiten, Zustand, Zubehör..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Rauer Standort (Optional)</label>
                        <input
                            type="text"
                            value={standort}
                            onChange={(e) => setStandort(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="z.B. Keller Haus B, Fach 3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Foto (Optional)</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {file ? (
                                        <div className="text-center">
                                            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                            <p className="text-sm font-semibold text-gray-700">{file.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500"><span className="font-semibold">Klick zum Hochladen</span></p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !titel}
                        className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        <span className="flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Objekt eintragen & Loslegen'}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    )
}
