import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

// Admin client for operations that bypass RLS but are manually verified
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user from httpOnly cookie
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string; // 'products' or 'stores'
    const folder = formData.get('folder') as string; // 'logo', 'banner', or null
    const storeId = formData.get('storeId') as string;

    if (!file || !bucket || !storeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Security Check: Verify that the user owns the store they are uploading to
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store || store.owner_id !== user.id) {
      console.error("Store ownership verification failed:", storeError);
      return NextResponse.json({ error: 'Forbidden: You do not own this store' }, { status: 403 });
    }

    // 3. Construct File Path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = folder 
      ? `${storeId}/${folder}_${timestamp}.${fileExt}` 
      : `${storeId}/${timestamp}.${fileExt}`;

    // 4. Upload to Storage using Admin Client
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error("Storage Proxy Upload Error:", uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // 5. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // 6. Automatically update database for stores branding
    if (bucket === 'stores') {
      const column = folder === 'logo' ? 'logo_url' : 'banner_url';
      const { error: dbError } = await supabaseAdmin
        .from('stores')
        .update({ [column]: publicUrl })
        .eq('id', storeId);
      
      if (dbError) {
        console.error("Database update failed after upload:", dbError);
      } else {
        revalidateTag('stores', { expire: 0 });
      }
    }

    return NextResponse.json({ success: true, url: publicUrl, path: fileName });

  } catch (err: any) {
    console.error("Upload API Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
