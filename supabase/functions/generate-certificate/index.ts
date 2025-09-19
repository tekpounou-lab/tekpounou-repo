import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { course_id, student_id } = await req.json()

    // Verify the student has completed the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*, course:courses(title, teacher:users(profiles(display_name)))')
      .eq('student_id', student_id || user.id)
      .eq('course_id', course_id)
      .eq('completed', true)
      .single()

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: 'Course not completed or enrollment not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get student profile
    const { data: studentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', student_id || user.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Student profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate certificate HTML
    const certificateHtml = generateCertificateHtml({
      studentName: studentProfile.display_name || 'Student',
      courseName: enrollment.course.title,
      teacherName: enrollment.course.teacher?.profiles?.display_name || 'Teacher',
      completionDate: new Date(enrollment.completed_at).toLocaleDateString(),
      certificateId: `CERT-${course_id.slice(0, 8)}-${(student_id || user.id).slice(0, 8)}`
    })

    // In a real implementation, you would convert HTML to PDF here
    // For now, we'll return the HTML and handle PDF generation on the client
    
    // Save certificate record
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        student_id: student_id || user.id,
        course_id: course_id,
        issue_date: new Date().toISOString(),
        certificate_url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/certificates/cert-${Date.now()}.pdf`
      })
      .select()
      .single()

    if (certError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save certificate record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificate: certificate,
        html: certificateHtml
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateCertificateHtml(data: {
  studentName: string
  courseName: string
  teacherName: string
  completionDate: string
  certificateId: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificate of Completion</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
        
        body {
          font-family: 'Roboto', sans-serif;
          margin: 0;
          padding: 40px;
          background: linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .certificate {
          background: white;
          padding: 60px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 800px;
          width: 100%;
          text-align: center;
          position: relative;
          border: 8px solid #FF6B6B;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: linear-gradient(45deg, #FF6B6B, #FF2D95, #913D88);
          border-radius: 24px;
          z-index: -1;
        }
        
        .header {
          margin-bottom: 40px;
        }
        
        .logo {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #FF6B6B, #FF2D95);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        
        .title {
          font-size: 36px;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }
        
        .subtitle {
          font-size: 18px;
          color: #666;
          font-weight: 300;
        }
        
        .content {
          margin: 40px 0;
        }
        
        .recipient {
          font-size: 28px;
          font-weight: 700;
          color: #FF2D95;
          margin: 20px 0;
          border-bottom: 2px solid #FF6B6B;
          display: inline-block;
          padding-bottom: 5px;
        }
        
        .course {
          font-size: 24px;
          font-weight: 400;
          color: #333;
          margin: 20px 0;
        }
        
        .details {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          font-size: 14px;
          color: #666;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #ccc;
          margin-top: 40px;
          padding-top: 10px;
          font-weight: 400;
        }
        
        .certificate-id {
          font-family: monospace;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <div class="logo">Tek Pou Nou</div>
          <div class="title">Certificate of Completion</div>
          <div class="subtitle">Sètifika Fini</div>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #666;">This is to certify that</p>
          <div class="recipient">${data.studentName}</div>
          <p style="font-size: 18px; color: #666;">has successfully completed the course</p>
          <div class="course">"${data.courseName}"</div>
          <p style="font-size: 16px; color: #666; margin-top: 30px;">
            Awarded on ${data.completionDate}
          </p>
        </div>
        
        <div class="details">
          <div class="signature">
            <div class="signature-line">
              ${data.teacherName}<br>
              <small>Course Instructor</small>
            </div>
          </div>
          <div>
            <div class="certificate-id">
              Certificate ID: ${data.certificateId}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
