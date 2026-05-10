'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import ItemCard, { ItemCardData, ItemKategorie } from '@/components/ItemCard'

// ------------------------------------------------------------------
// Category filter config
// ------------------------------------------------------------------
type KategorieFilter = ItemKategorie | 'alle'

const KATEGORIEN: { value: KategorieFilter; label: string }[] = [
    { value: 'alle', label: 'Alle' },
    { value: 'werkzeug', label: 'Werkzeug' },
    { value: 'haushalt', label: 'Haushalt' },
    { value: 'garten', label: 'Garten' },
    { value: 'sport', label: 'Sport' },
    { value: 'elektronik', label: 'Elektronik' },
    { value: 'sonstiges', label: 'Sonstiges' },
]

// ------------------------------------------------------------------
// Props
// ------------------------------------------------------------------
interface MarktplatzClientProps {
    items: ItemCardData[]
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function MarktplatzClient({ items }: MarktplatzClientProps) {
    const [query, setQuery] = useState('')
    const [kategorie, setKategorie] = useState<KategorieFilter>('alle')
    const [showInaktiv, setShowInaktiv] = useState(false)

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim()
        return items.filter((item) => {
            if (!showInaktiv && item.status === 'inaktiv') return false
            if (kategorie !== 'alle' && item.kategorie !== kategorie) return false
            if (q) {
                const haystack = [item.titel, item.beschreibung, item.owner?.name]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                return haystack.includes(q)
            }
            return true
        })
    }, [items, query, kategorie, showInaktiv])

    return (
        <div className="flex flex-col gap-6">
            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5 pointer-events-none" />
                <input
                    id="marktplatz-search"
                    type="search"
                    placeholder="Suche nach Gegenstand, Beschreibung oder Besitzer…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-sm"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Suche löschen"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {KATEGORIEN.map((k) => (
                    <button
                        key={k.value}
                        id={`filter-${k.value}`}
                        onClick={() => setKategorie(k.value)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                            kategorie === k.value
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {k.label}
                    </button>
                ))}

                <button
                    id="filter-inaktiv-toggle"
                    onClick={() => setShowInaktiv((v) => !v)}
                    className={`ml-auto px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                        showInaktiv
                            ? 'bg-gray-200 text-gray-700 border-gray-300'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                    }`}
                >
                    Inaktive anzeigen
                </button>
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-400 -mt-2">
                {filtered.length === 0
                    ? 'Keine Gegenstände gefunden'
                    : `${filtered.length} Gegenstand${filtered.length !== 1 ? 'e' : ''}`}
                {query && <> für &bdquo;<span className="font-medium text-gray-600">{query}</span>&ldquo;</>}
            </p>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <Search className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Keine Treffer</p>
                    <p className="text-gray-400 text-sm mt-1">Versuche einen anderen Suchbegriff oder Filter.</p>
                    {(query || kategorie !== 'alle') && (
                        <button
                            onClick={() => { setQuery(''); setKategorie('alle') }}
                            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                        >
                            Filter zurücksetzen
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
