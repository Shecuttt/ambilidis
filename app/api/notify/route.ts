import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { target, message } = await request.json();

    if (!target || !message) {
      return NextResponse.json({ error: 'Target and message are required' }, { status: 400 });
    }

    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Fonnte token not configured' }, { status: 500 });
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: new URLSearchParams({
        target: target,
        message: message,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      console.error("Fonnte API Error:", result);
      return NextResponse.json({ error: 'Failed to send message', details: result }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Notify Route Error:", error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
