import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

// 환경변수에 API KEY가 없으면 에러가 날 수 있으므로 예외 처리
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
const FORWARD_TO_EMAIL = 'yifi1004@gmail.com'; // 회원님의 개인 이메일

export async function POST(request: Request) {
  try {
    // 1. Webhook 서명 검증 (보안 강화)
    const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

    // 시크릿이 설정되어 있으면 검증 수행
    if (WEBHOOK_SECRET) {
      const headerPayload = await headers();
      const svix_id = headerPayload.get("svix-id");
      const svix_timestamp = headerPayload.get("svix-timestamp");
      const svix_signature = headerPayload.get("svix-signature");

      if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: 'No svix headers' }, { status: 400 });
      }

      const body = await request.text();
      const wh = new Webhook(WEBHOOK_SECRET);

      try {
        wh.verify(body, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        });
        
        // 검증 성공 후 파싱하여 처리
        const payload = JSON.parse(body);
        return await processWebhook(payload);
      } catch (err) {
        console.error('Webhook verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // 로컬 개발 환경 등 시크릿이 없는 경우 검증 건너뜀 (배포 시에는 설정 권장)
      console.warn('RESEND_WEBHOOK_SECRET is not set. Skipping verification.');
      const payload = await request.json();
      return await processWebhook(payload);
    }
  } catch (error: any) {
    console.error('Inbound Webhook 처리 중 에러:', error);
    return NextResponse.json({ error: error.message || 'Webhook Error' }, { status: 500 });
  }
}

async function processWebhook(payload: any) {
  // Resend Inbound Webhook Payload 파싱 (실제 데이터는 payload.data 안에 들어있음)
  const emailData = payload.data || payload;

  const from = emailData.from || 'unknown@sender.com';
  const to = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to || 'unknown';
  const subject = emailData.subject || '제목 없음';
  let text = emailData.text;
  let html = emailData.html;

  // Resend 웹훅 페이로드에 본문이 누락된 경우, email_id로 직접 메일 원본을 조회합니다.
  if (!text && !html && emailData.email_id) {
    try {
      const { data: fetchedEmail } = await resend.emails.receiving.get(emailData.email_id);
      if (fetchedEmail) {
        text = fetchedEmail.text || fetchedEmail.html;
        html = fetchedEmail.html || fetchedEmail.text;
      }
    } catch (fetchErr) {
      console.error('원본 이메일 조회 실패:', fetchErr);
    }
  }

  text = text || '내용 없음';

  console.log(`[메일 수신 Webhook] From: ${from}, Subject: ${subject}`);

  // 회원님의 개인 Gmail로 포워딩 발송
  const { data, error } = await resend.emails.send({
    from: `다시,우리 고객센터 <support@dasisaju.com>`,
    to: FORWARD_TO_EMAIL,
    replyTo: from,
    subject: `[고객 문의] ${subject}`,
    html: `
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
        <p><strong>보낸 사람:</strong> ${from}</p>
        <p><strong>수신 주소:</strong> ${to}</p>
        <hr style="border: 1px solid #e5e7eb;" />
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 15px; color: #111827;">
          ${html ? html : `<p style="white-space: pre-wrap;">${text}</p>`}
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('포워딩 메일 발송 에러:', error);
    return NextResponse.json({ error: 'Failed to forward email' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Email forwarded successfully', data });
}
