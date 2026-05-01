import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// 환경변수에 API KEY가 없으면 에러가 날 수 있으므로 예외 처리
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
const FORWARD_TO_EMAIL = 'yifi1004@gmail.com'; // 회원님의 개인 이메일

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Resend Inbound Webhook Payload 파싱
    const from = payload.from || 'unknown@sender.com';
    const to = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to || 'unknown';
    const subject = payload.subject || '제목 없음';
    const text = payload.text || '내용 없음';
    const html = payload.html;

    console.log(`[메일 수신 Webhook] From: ${from}, Subject: ${subject}`);

    // 회원님의 개인 Gmail로 포워딩 발송
    const { data, error } = await resend.emails.send({
      // 발송용으로 인증된 도메인 이메일이어야 함 (Resend 대시보드에서 추가한 도메인)
      from: `다시,우리 고객센터 <support@dasisaju.com>`,
      to: FORWARD_TO_EMAIL,
      replyTo: from, // 회원님이 Gmail에서 '답장'을 누르면 바로 고객에게 답장할 수 있도록 설정
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
  } catch (error: any) {
    console.error('Inbound Webhook 처리 중 에러:', error);
    return NextResponse.json({ error: error.message || 'Webhook Error' }, { status: 500 });
  }
}
