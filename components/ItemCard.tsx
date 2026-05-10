import Image from 'next/image'
import Link from 'next/link'
import { Package, Wrench, Home, Flower2, Dumbbell, Cpu, Tag } from 'lucide-react'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export type ItemStatus = 'verfuegbar' | 'ausgeliehen' | 'inaktiv'
export type ItemKategorie = 'werkzeug' | 'haushalt' | 'garten' | 'sport' | 'elektronik' | 'sonstiges'

export interface ItemCardData {
    id: string
    titel: string
    beschreibung?: string | null
    kategorie: ItemKategorie
    standort?: string | null
    foto_url?: string | null
    status: ItemStatus
    owner?: {
        name?: string | null
        wohnung?: string | null
    } | null
}

interface ItemCardProps {
    item: ItemCardData
    /** If provided, renders action buttons instead of linking to the marketplace detail */
    actions?: React.ReactNode
    /** Link override – defaults to /marktplatz/[id] */
    href?: string
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const KATEGORIE_LABEL: Record<ItemKategorie, string> = {
    werkzeug: 'Werkzeug',
    haushalt: 'Haushalt',
    garten: 'Garten',
    sport: 'Sport',
    elektronik: 'Elektronik',
    sonstiges: 'Sonstiges',
}

const KATEGORIE_ICON: Record<ItemKategorie, React.ReactNode> = {
    werkzeug: <Wrench className="w-3 h-3" />,
    haushalt: <Home className="w-3 h-3" />,
    garten: <Flower2 className="w-3 h-3" />,
    sport: <Dumbbell className="w-3 h-3" />,
    elektronik: <Cpu className="w-3 h-3" />,
    sonstiges: <Tag className="w-3 h-3" />,
}

const KATEGORIE_COLOR: Record<ItemKategorie, string> = {
    werkzeug: 'bg-orange-50 text-orange-700 border-orange-200',
    haushalt: 'bg-blue-50 text-blue-700 border-blue-200',
    garten: 'bg-green-50 text-green-700 border-green-200',
    sport: 'bg-purple-50 text-purple-700 border-purple-200',
    elektronik: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    sonstiges: 'bg-gray-50 text-gray-600 border-gray-200',
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
    ausgeliehen: 'Ausgeliehen',
    inaktiv: 'Inaktiv',
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function ItemCard({ item, actions, href }: ItemCardProps) {
    const cardHref = href ?? `/marktplatz/${item.id}`

    const cardContent = (
        <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">
            {/* Photo */}
            <div className="relative w-full h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0">
                {item.foto_url ? (
                    <Image
                        src={item.foto_url}
                        alt={item.titel}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                    </div>
                )}

                {/* Status badge overlaid on photo */}
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${STATUS_STYLE[item.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status]}`} />
                    {STATUS_LABEL[item.status]}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {/* Category chip */}
                <div className={`inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-[11px] font-medium border mb-2 ${KATEGORIE_COLOR[item.kategorie]}`}>
                    {KATEGORIE_ICON[item.kategorie]}
                    {KATEGORIE_LABEL[item.kategorie]}
                </div>

                <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 mb-1">
                    {item.titel}
                </h3>

                {item.beschreibung && (
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-2">
                        {item.beschreibung}
                    </p>
                )}

                {item.owner && (
                    <p className="text-gray-400 text-xs mt-auto pt-2 border-t border-gray-50">
                        Von <span className="font-medium text-gray-600">{item.owner.name}</span>
                        {item.owner.wohnung && <> · {item.owner.wohnung}</>}
                    </p>
                )}

                {/* Action slot (Meine Objekte) */}
                {actions && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    )

    if (actions) {
        // In "Meine Objekte", clicking the card itself has no navigation
        return <div className="flex flex-col h-full">{cardContent}</div>
    }

    return (
        <Link href={cardHref} className="flex flex-col h-full">
            {cardContent}
        </Link>
    )
}
