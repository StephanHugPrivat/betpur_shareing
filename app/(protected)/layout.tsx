import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Search, PlusCircle, UserCircle, LogOut, Shield } from 'lucide-react'
import { getPendingRequestsCount } from '@/app/actions/loanRequests'

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
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

    if (!user) {
        redirect('/login')
    }

    // Fetch profile status
    const { data: profile } = await supabase
        .from('profiles')
        .select('status, is_admin')
        .eq('id', user.id)
        .single()

    if (!profile || profile.status === 'pending') {
        // Falls Session existiert aber noch pending/inactive, logout force
        await supabase.auth.signOut()
        redirect('/login?error=account_pending')
    }

    // Check onboarding (mindestens 1 Item)
    const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

    if (count === 0) {
        // Server-side redirect works safely inside Layout if you are not already in onboarding
        // BUT we are in (protected) layout. We can just render onboarding instead if count is 0?
        // Oder ein Redirect auf /onboarding, falls onboarding auf gleicher hierarchie ist.
        // Let's redirect to standard Next.js /onboarding outside of (protected)
        redirect('/onboarding')
    }

    // Fetch pending requests for badge
    const pendingCount = await getPendingRequestsCount()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-50">
                <h1 className="font-bold text-xl text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">Betpur Share</h1>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </header>

            {/* Sidebar Navigation */}
            <nav className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen">
                <div className="p-6">
                    <h1 className="font-bold text-2xl text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
                        Betpur Share
                    </h1>
                </div>
                <div className="flex-1 px-4 space-y-2">
                    <Link href="/marktplatz" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <Search className="w-5 h-5 text-gray-500" />
                        Marktplatz
                    </Link>
                    <Link href="/objekte" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <Package className="w-5 h-5 text-gray-500" />
                        Meine Objekte
                    </Link>
                    <Link href="/objekte/neu" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <PlusCircle className="w-5 h-5 text-gray-500" />
                        Neues Objekt
                    </Link>
                    <Link href="/anfragen" className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <div className="flex items-center gap-3">
                            <UserCircle className="w-5 h-5 text-gray-500" />
                            Anfragen
                        </div>
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {pendingCount}
                            </span>
                        )}
                    </Link>

                    {profile.is_admin && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-medium transition-colors mt-4">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Admin Bereich
                        </Link>
                    )}

                </div>

                <div className="p-4 border-t border-gray-100">
                    <form action="/auth/signout" method="post">
                        <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors">
                            <LogOut className="w-5 h-5" />
                            Abmelden
                        </button>
                    </form>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-50 pb-safe">
                <Link href="/marktplatz" className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                    <Search className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Suchen</span>
                </Link>
                <Link href="/objekte/neu" className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                    <PlusCircle className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Erfassen</span>
                </Link>
                <Link href="/objekte" className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                    <Package className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Meine</span>
                </Link>
                <Link href="/anfragen" className="flex-1 py-3 relative flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                    <UserCircle className="w-6 h-6" />
                    {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-white">
                            {pendingCount}
                        </span>
                    )}
                    <span className="text-[10px] font-medium">Anfragen</span>
                </Link>
            </nav>
        </div>
    )
}
