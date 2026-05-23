import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel Pro: 60s, Hobby: 10s（タイムアウト対策）
export const maxDuration = 60

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
// OpenAI Vision (gpt-4o) supports JPEG / PNG / WebP / non-animated GIF
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * レシート/領収書のOCR。
 * 画像 → 生テキスト の文字起こしを OpenAI Vision (gpt-4o) で実行する。
 * 戻り値の形 `{ text, sourceFormat }` は ocr-engine.ts の下流パースで使われているため変更しない。
 * （以前は ConvertAPI を利用していたが、本実装で完全に廃止）
 */
export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // HEIC/HEIF は OpenAI Vision が受け付けないため、わかりやすいメッセージで弾く
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      return NextResponse.json(
        {
          error: 'HEIC形式は読み取れません。iPhoneの設定で「カメラ > フォーマット > 互換性優先」に変更するか、JPEG/PNGに変換してから再度アップロードしてください。',
        },
        { status: 415 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPEG / PNG / WebP / GIF のいずれかの画像をアップロードしてください。' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type
    console.log(`[ocr] file: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB, type: ${mimeType}`)

    const prompt = `このレシート・領収書・明細書の画像に書かれているテキストを、できる限り忠実にすべて文字起こししてください。

要件:
- 店名・住所・電話番号・日付・時刻・商品名・単価・数量・小計・税額・合計・支払方法（現金/クレジット/振込など）・領収印など、写っている文字をすべて含めてください。
- 「¥」マーク・カンマ・ハイフン・括弧などの記号も省略せず、原文どおりに残してください。
- 数字は半角で出力してください。
- レイアウトは保つ必要はありませんが、各情報は別々の行に分けてください。
- 文字起こし結果のテキストのみを返してください。説明・前置き・後置き・コードブロック記号は不要です。`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI Vision API error:', errText)
      return NextResponse.json({ error: 'OCR processing failed', details: errText }, { status: 502 })
    }

    const data = await response.json()
    const ocrText: string = data.choices?.[0]?.message?.content?.trim() ?? ''

    if (!ocrText) {
      return NextResponse.json({ error: 'No text could be extracted from the image' }, { status: 422 })
    }

    return NextResponse.json({ text: ocrText, sourceFormat: ext })
  } catch (err) {
    console.error('OCR route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
