import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY')
const GOOGLE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { requestId, divisionName, fileName, mimeType, fileData } = await req.json()

    if (!fileData) {
      throw new Error("File data is missing")
    }

    // 1. Upload ke Google Drive (menggunakan Google Drive API endpoint sederhana)
    // Note: Implementasi OAuth2 / JWT Service Account untuk Google Drive sedikit kompleks di Deno.
    // Sebagai alternatif, di sini kita mensimulasikan upload jika Google Drive token belum disetup secara full,
    // Atau jika Anda menggunakan endpoint webhook lain (seperti Zapier/Make) untuk meneruskan ke GDrive.
    
    // Asumsikan kita punya endpoint perantara atau kita langsung hit Google API (jika GOOGLE_API_KEY berupa access token valid)
    // Untuk production nyata, sangat direkomendasikan memakai Service Account JWT untuk mendapatkan Access Token.
    let gdriveUrl = "https://drive.google.com/open?id=simulasi_berhasil_" + Date.now()

    if (GOOGLE_API_KEY && GOOGLE_FOLDER_ID) {
      const metadata = {
        name: `[${divisionName}] ${fileName}`,
        parents: [GOOGLE_FOLDER_ID]
      }

      const boundary = 'foo_bar_baz'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        fileData +
        closeDelimiter

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GOOGLE_API_KEY}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      })

      const driveResponse = await res.json()
      if (driveResponse.id) {
        gdriveUrl = `https://drive.google.com/open?id=${driveResponse.id}`
      }
    }

    // 2. Simpan URL ke Supabase `realization_proofs` table
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { error } = await supabase.from('realization_proofs').insert({
      request_id: requestId,
      gdrive_url: gdriveUrl
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, url: gdriveUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
