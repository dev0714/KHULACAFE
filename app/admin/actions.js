'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { verifyToken } from '../../lib/auth'
import { supabaseAdmin } from '../../lib/supabase-admin'

async function assertAdmin() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) throw new Error('Unauthorized')
}

// ── Menu Categories ─────────────────────────────────────────────
export async function upsertCategory(data) {
  await assertAdmin()
  if (data.id) {
    await supabaseAdmin.from('menu_categories').update(data).eq('id', data.id)
  } else {
    await supabaseAdmin.from('menu_categories').insert(data)
  }
  revalidatePath('/menu')
  revalidatePath('/admin/menu')
}

export async function deleteCategory(id) {
  await assertAdmin()
  await supabaseAdmin.from('menu_categories').delete().eq('id', id)
  revalidatePath('/menu')
  revalidatePath('/admin/menu')
}

// ── Menu Items ───────────────────────────────────────────────────
export async function upsertMenuItem(data) {
  await assertAdmin()
  if (data.id) {
    await supabaseAdmin.from('menu_items').update(data).eq('id', data.id)
  } else {
    await supabaseAdmin.from('menu_items').insert(data)
  }
  revalidatePath('/menu')
  revalidatePath('/')
  revalidatePath('/admin/menu')
}

export async function deleteMenuItem(id) {
  await assertAdmin()
  await supabaseAdmin.from('menu_items').delete().eq('id', id)
  revalidatePath('/menu')
  revalidatePath('/')
  revalidatePath('/admin/menu')
}

// ── Gallery ──────────────────────────────────────────────────────
export async function upsertGalleryItem(data) {
  await assertAdmin()
  if (data.id) {
    await supabaseAdmin.from('gallery_items').update(data).eq('id', data.id)
  } else {
    await supabaseAdmin.from('gallery_items').insert(data)
  }
  revalidatePath('/gallery')
  revalidatePath('/')
  revalidatePath('/admin/gallery')
}

export async function deleteGalleryItem(id) {
  await assertAdmin()
  await supabaseAdmin.from('gallery_items').delete().eq('id', id)
  revalidatePath('/gallery')
  revalidatePath('/')
  revalidatePath('/admin/gallery')
}

// ── Loyalty Config ───────────────────────────────────────────────
export async function updateLoyaltyConfig(data) {
  await assertAdmin()
  await supabaseAdmin.from('loyalty_config').update(data).eq('id', 1)
  revalidatePath('/loyalty')
  revalidatePath('/admin/loyalty')
}

// ── Booking Occasions ────────────────────────────────────────────
export async function upsertOccasion(data) {
  await assertAdmin()
  if (data.id) {
    await supabaseAdmin.from('booking_occasions').update(data).eq('id', data.id)
  } else {
    await supabaseAdmin.from('booking_occasions').insert(data)
  }
  revalidatePath('/book')
  revalidatePath('/admin/bookings')
}

export async function deleteOccasion(id) {
  await assertAdmin()
  await supabaseAdmin.from('booking_occasions').delete().eq('id', id)
  revalidatePath('/book')
  revalidatePath('/admin/bookings')
}

// ── Booking Add-ons ──────────────────────────────────────────────
export async function upsertAddon(data) {
  await assertAdmin()
  if (data.id) {
    await supabaseAdmin.from('booking_addons').update(data).eq('id', data.id)
  } else {
    await supabaseAdmin.from('booking_addons').insert(data)
  }
  revalidatePath('/book')
  revalidatePath('/admin/bookings')
}

export async function deleteAddon(id) {
  await assertAdmin()
  await supabaseAdmin.from('booking_addons').delete().eq('id', id)
  revalidatePath('/book')
  revalidatePath('/admin/bookings')
}
