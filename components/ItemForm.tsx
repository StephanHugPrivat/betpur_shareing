'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle2, X, Image as ImageIcon } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface ItemFormData {
    id?: string
    titel?: string
    beschreibung?: string
    kategorie?: string
    standort?: string
    foto_url?: string | null
}

interface ItemFormProps {
    initialData?: ItemFormData
    onSuccess?: (itemId: string) => void
    /** If true, photo is mandatory */
    fotoRequired?: boolean
    submitLabel?: string
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function ItemForm({
    initialData,
    onSuccess,
    fotoRequired = false,
    submitLabel = 'Speichern',
}: ItemFormProps) {
    const [titel, setTitel] = useState(initialData?.titel ?? '')
    const [beschreibung, setBeschreibung] = useState(initialData?.beschreibung ?? '')
    const [kategorie, setKategorie] = useState(initialData?.kategorie ?? 'haushalt')
    const [standort, setStandort] = useState(initialData?.standort ?? '')
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.foto_url ?? null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    // ------------------------------------------------------------------
    // File selection
    // ------------------------------------------------------------------
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setPreviewUrl(URL.createObjectURL(f))
    }

    const clearFile = () => {
        setFile(null)
        // If editing, revert to original photo; otherwise clear completely
        setPreviewUrl(initialData?.foto_url ?? null)
    }

    // ------------------------------------------------------------------
    // Submit
    // ------------------------------------------------------------------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Nicht eingeloggt')

            if (fotoRequired && !file && !previewUrl) {
                throw new Error('Ein Foto ist Pflicht. Bitte ein Bild hochladen.')
            }

            let foto_url: string | null = initialData?.foto_url ?? null

            if (file) {
                let fileToCompress = file;
                const isHeic = fileToCompress.type === 'image/heic' || fileToCompress.type === 'image/heif' || fileToCompress.name.toLowerCase().endsWith('.heic') || fileToCompress.name.toLowerCase().endsWith('.heif');
                
                if (isHeic) {
                    // Dynamically import heic2any to avoid increasing the initial bundle size
                    const heic2any = (await import('heic2any')).default;
                    const convertedBlob = await heic2any({
                        blob: fileToCompress,
                        toType: 'image/jpeg',
                        quality: 0.8
                    });
                    const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                    fileToCompress = new File([singleBlob], fileToCompress.name.replace(/\.heic$|\.heif$/i, '.jpg'), { type: 'image/jpeg' });
                }

                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                    fileType: 'image/webp' as const,
                }
                const compressedFile = await imageCompression(fileToCompress, options)
                const fileName = `${user.id}/${Date.now()}.webp`

                const { error: uploadError } = await supabase.storage
                    .from('items')
                    .upload(fileName, compressedFile, { upsert: false })

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from('items')
                    .getPublicUrl(fileName)
                foto_url = publicUrlData.publicUrl
            }

            let resultId: string

            if (initialData?.id) {
                // UPDATE
                const { data, error: updateError } = await supabase
                    .from('items')
                    .update({ titel, beschreibung, kategorie, standort, foto_url })
                    .eq('id', initialData.id)
                    .eq('owner_id', user.id) // extra safety
                    .select('id')
                    .single()

                if (updateError) throw updateError
                resultId = data.id
            } else {
                // INSERT
                const { data, error: insertError } = await supabase
                    .from('items')
                    .insert({ owner_id: user.id, titel, beschreibung, kategorie, standort, foto_url })
                    .select('id')
                    .single()

                if (insertError) throw insertError
                resultId = data.id
            }

            if (onSuccess) {
                onSuccess(resultId)
            } else {
                router.push('/objekte')
                router.refresh()
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
            setError(message)
            setLoading(false)
        }
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            {/* Titel */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Titel des Gegenstands <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    required
                    value={titel}
                    onChange={(e) => setTitel(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="z.B. Schlagbohrmaschine"
                />
            </div>

            {/* Kategorie */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Kategorie
                </label>
                <select
                    value={kategorie}
                    onChange={(e) => setKategorie(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
                >
                    <option value="werkzeug">Werkzeug</option>
                    <option value="haushalt">Haushalt</option>
                    <option value="garten">Garten</option>
                    <option value="sport">Sport &amp; Freizeit</option>
                    <option value="elektronik">Elektronik</option>
                    <option value="sonstiges">Sonstiges</option>
                </select>
            </div>

            {/* Beschreibung */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Beschreibung
                    <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                    value={beschreibung}
                    onChange={(e) => setBeschreibung(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-[100px] resize-none"
                    placeholder="Besonderheiten, Zustand, Zubehör..."
                />
            </div>

            {/* Standort */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Standort
                    <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                    type="text"
                    value={standort}
                    onChange={(e) => setStandort(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="z.B. Keller Haus B, Fach 3"
                />
            </div>

            {/* Foto */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Foto
                    {fotoRequired
                        ? <span className="text-red-500 ml-1">*</span>
                        : <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
                    }
                </label>

                {previewUrl ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <Image
                            src={previewUrl}
                            alt="Vorschau"
                            fill
                            className="object-cover"
                        />
                        <button
                            type="button"
                            onClick={clearFile}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow text-gray-600 hover:text-red-600 transition-colors"
                            aria-label="Foto entfernen"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                                <span className="font-semibold text-blue-600">Klick zum Hochladen</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Wird auf max. 500 KB & 800px komprimiert</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </label>
                )}

                {file && (
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        {file.name} wird komprimiert und hochgeladen…
                    </p>
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !titel}
                className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-4 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Wird gespeichert…
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="w-5 h-5" />
                        {submitLabel}
                    </>
                )}
            </button>
        </form>
    )
}
