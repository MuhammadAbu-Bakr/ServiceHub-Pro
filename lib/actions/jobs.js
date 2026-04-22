'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ── Validation helpers ────────────────────────────────────────
function validate(fields) {
  const { title, description, category, type, location, budget_type } = fields;
  if (!title?.trim())                   return 'Job title is required.';
  if (title.trim().length < 5)          return 'Title must be at least 5 characters.';
  if (title.trim().length > 120)        return 'Title must be 120 characters or fewer.';
  if (!description?.trim())             return 'Job description is required.';
  if (description.trim().length < 50)   return 'Description must be at least 50 characters.';
  if (!category)                        return 'Please select a category.';
  if (!type)                            return 'Please select a job type.';
  if (!location)                        return 'Please select a location.';
  if (!budget_type)                     return 'Please select a budget type.';
  return null;
}

/**
 * Server Action — Create a new job posting.
 * Validates auth (must be logged-in client), then inserts into `jobs` table.
 *
 * @param {FormData} formData
 * @returns {{ success?: true, job?: object, error?: string }}
 */
export async function createJob(formData) {
  const supabase = await createClient();

  // ── 1. Verify session ────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'You must be logged in to post a job.' };
  }

  // ── 2. Verify client role ─────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Could not verify your account. Please try again.' };
  }
  if (profile.role !== 'client') {
    return { error: 'Only clients can post jobs. Freelancers can browse and apply.' };
  }

  // ── 3. Parse form fields ──────────────────────────────────
  const fields = {
    title:       formData.get('title')?.toString().trim(),
    description: formData.get('description')?.toString().trim(),
    category:    formData.get('category')?.toString(),
    type:        formData.get('type')?.toString(),
    location:    formData.get('location')?.toString(),
    budget_type: formData.get('budget_type')?.toString(),
    budget_min:  formData.get('budget_min') ? Number(formData.get('budget_min')) : null,
    budget_max:  formData.get('budget_max') ? Number(formData.get('budget_max')) : null,
    // Tags: comma-separated string → trimmed array (max 8)
    tags: formData.get('tags')
      ? formData.get('tags').toString()
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [],
  };

  // ── 4. Validate ───────────────────────────────────────────
  const validationError = validate(fields);
  if (validationError) return { error: validationError };

  // Budget sanity check
  if (fields.budget_min && fields.budget_max && fields.budget_min > fields.budget_max) {
    return { error: 'Minimum budget cannot exceed maximum budget.' };
  }

  // ── 5. Insert into Supabase ───────────────────────────────
  const { data: job, error: insertError } = await supabase
    .from('jobs')
    .insert({
      client_id:   user.id,
      title:       fields.title,
      description: fields.description,
      category:    fields.category,
      type:        fields.type,
      location:    fields.location,
      budget_min:  fields.budget_min,
      budget_max:  fields.budget_max,
      budget_type: fields.budget_type,
      tags:        fields.tags,
      status:      'open',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Job insert error:', insertError);
    return { error: 'Failed to post your job. Please try again.' };
  }

  // ── 6. Revalidate cached pages ────────────────────────────
  revalidatePath('/jobs');
  revalidatePath('/dashboard');

  return { success: true, job };
}

/**
 * Server Action — Close (archive) a job owned by the current user.
 *
 * @param {string} jobId
 * @returns {{ success?: true, error?: string }}
 */
export async function closeJob(jobId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('jobs')
    .update({ status: 'closed' })
    .eq('id', jobId)
    .eq('client_id', user.id); // ensure ownership

  if (error) return { error: 'Could not close the job.' };

  revalidatePath('/jobs');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Server Action — Delete a job owned by the current user.
 *
 * @param {string} jobId
 * @returns {{ success?: true, error?: string }}
 */
export async function deleteJob(jobId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('client_id', user.id);

  if (error) return { error: 'Could not delete the job.' };

  revalidatePath('/jobs');
  revalidatePath('/dashboard');
  return { success: true };
}
