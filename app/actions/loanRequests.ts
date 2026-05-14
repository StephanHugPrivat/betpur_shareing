'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLoanRequest(itemId: string, nachricht: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Nicht authentifiziert')
    }

    const { error } = await supabase
        .from('loan_requests')
        .insert([
            {
                item_id: itemId,
                requester_id: user.id,
                nachricht: nachricht,
                status: 'pending'
            }
        ])

    if (error) {
        throw new Error('Fehler beim Senden der Anfrage: ' + error.message)
    }

    revalidatePath('/marktplatz')
    revalidatePath(`/marktplatz/${itemId}`)
    revalidatePath('/anfragen')
    
    return { success: true }
}

export async function acceptLoanRequest(requestId: string, antwort: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Nicht authentifiziert')
    }

    // Hole den Request, um die Item ID zu bekommen
    const { data: request, error: requestError } = await supabase
        .from('loan_requests')
        .select('item_id')
        .eq('id', requestId)
        .single()

    if (requestError || !request) {
        throw new Error('Anfrage nicht gefunden')
    }

    // Aktualisiere die Anfrage
    const { error: updateError } = await supabase
        .from('loan_requests')
        .update({ 
            status: 'accepted',
            owner_antwort: antwort,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (updateError) {
        throw new Error('Fehler beim Bestätigen der Anfrage: ' + updateError.message)
    }

    // Setze Item auf ausgeliehen
    const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'ausgeliehen' })
        .eq('id', request.item_id)

    if (itemError) {
        throw new Error('Fehler beim Aktualisieren des Objekts: ' + itemError.message)
    }

    revalidatePath('/anfragen')
    revalidatePath('/marktplatz')
    revalidatePath(`/marktplatz/${request.item_id}`)
    revalidatePath('/objekte')

    return { success: true }
}

export async function declineLoanRequest(requestId: string, antwort: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Nicht authentifiziert')
    }

    const { error } = await supabase
        .from('loan_requests')
        .update({ 
            status: 'declined',
            owner_antwort: antwort,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) {
        throw new Error('Fehler beim Ablehnen der Anfrage: ' + error.message)
    }

    revalidatePath('/anfragen')
    
    return { success: true }
}

export async function getPendingRequestsCount() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return 0
    }

    // Wir zählen alle pending Anfragen, bei denen der User der Besitzer des Items ist
    const { count, error } = await supabase
        .from('loan_requests')
        .select('id, items!inner(owner_id)', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('items.owner_id', user.id)

    if (error) {
        console.error('Error fetching pending requests count:', error)
        return 0
    }

    return count || 0
}
