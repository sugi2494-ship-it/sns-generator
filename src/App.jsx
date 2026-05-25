import { useState, useRef } from "react";

// ─────────────────────────────────────────────
// 핵심: 블로그 프롬프트를 스토리텔링형으로 완전히 새로 씀
// ─────────────────────────────────────────────
const TONES = {
  warm:        "따뜻하고 친근한 언니 같은 말투 — '~해요', '~거든요', '솔직히 말하면' 같은 자연스러운 표현 사용",
  elegant:     "세련되고 신뢰감 있는 전문가 말투 — 간결하고 품격 있게, 하지만 딱딱하지 않게",
  friendly:    "동생한테 카톡 보내듯 편한 말투 — '완전', '진짜', '꿀팁' 같은 자연스러운 구어체",
  educational: "친절한 강사 말투 — 단계별로 쉽게 설명해주는 느낌, 전문 용어는 바로 풀어서 설명",
};
const TONE_LABELS = {
  warm:        "🌸 친근한 언니 말투",
  elegant:     "✨ 세련된 전문가",
  friendly:    "💬 편한 친구 말투",
  educational: "📚 친절한 강사",
};

const BLOG_PROMPT = (keyword, tone, hasImages, imageCount) => `
당신은 네이버 블로그에서 월 10만 뷰를 기록하는 퍼스널컬러 전문 블로거입니다.
PBS COLOR LAB 대표로서 20년 이상 색채 교육·컨설팅을 해온 실제 경험을 바탕으로 글을 씁니다.

주제: "${keyword}"
말투: ${tone}
${hasImages ? `이미지 ${imageCount}장이 첨부됨 — 본문에서 [이미지1: 설명], [이미지2: 설명] 형식으로 적절히 배치` : ""}

━━━━━ 블로그 글 작성 원칙 ━━━━━

【제목】
- 숫자 + 핵심키워드 + 감성/궁금증 유발 조합
- 예시 스타일: "가을 웜톤인데 옷 살 때마다 실패했던 이유 (3가지)", "퍼스널컬러 진단 받고 나서 가장 놀랐던 것", "30대 넘어서 갑자기 안 어울리는 색이 생긴 이유"

【후킹 오프닝 — 가장 중요!】
독자가 첫 3줄을 읽고 '나 얘기잖아...' 하고 느끼게 만드세요.
방식 중 하나 선택:
① 실패 경험형: "분명히 예쁜 색인데 막상 입으면 왠지 칙칙해 보이는 경험, 한 번쯤 있으시죠?"
② 충격 사실형: "사실 그 옷이 안 어울리는 게 아니에요. 색이 나를 죽이고 있는 거예요."
③ 공감 질문형: "쇼핑몰에서 예뻐서 샀는데 집에서 입어보면 분명히 달라 보이는 거, 저만 그런 거 아니죠?"
→ 오프닝은 반드시 2~3문장, 마지막 문장은 '이번 글에서 알려드릴게요' 식으로 자연스럽게 연결

【본론 구성】
★ 소제목 3~4개 포함
- 각 소제목 아래 구체적 내용 (추상적 설명 금지)
- 반드시 포함할 것: 실제 사례, 구체적 색상명/아이템명, "저도 처음엔~", "고객분들이 가장 많이 하시는 실수가~" 같은 경험 기반 멘트
- 숫자, 비교, Before/After 표현 적극 활용
- 중간중간 "✔", "→", "💡" 같은 이모지로 읽기 편하게

【마무리 CTA】
- "PBS COLOR LAB에서 퍼스널컬러 진단을 받아보시면~" 식으로 자연스럽게 연결
- 독자가 다음 행동을 하고 싶게 만드는 문장으로 마무리
- 댓글 유도 질문 1개로 끝내기

총 글자 수: 900~1100자 (충분히 구체적으로)

━━━━━ 출력 형식 (태그 정확히 포함) ━━━━━

[BLOG_TITLE]
제목

[BLOG_HOOK]
후킹 오프닝 (2~3문장)

[BLOG_BODY]
본론 + 마무리 (소제목★ 포함)
`;

const INSTA_PROMPT = (keyword, tone, hasImages, imageCount) => `
당신은 팔로워 3만명의 퍼스널컬러 인스타그램 계정 운영자입니다.
PBS COLOR LAB 브랜드로 활동하며, 30~50대 여성들이 열정적으로 반응하는 콘텐츠를 만듭니다.

주제: "${keyword}"
말투: ${tone}
${hasImages ? `이미지 ${imageCount}장 첨부됨` : ""}

인스타그램 캡션 작성 원칙:
- 첫 줄: 스크롤 멈추게 하는 한 문장 (이모지 시작, 충격/공감/궁금증 중 하나)
- 2~4줄: 핵심 가치를 짧고 임팩트 있게
- 줄바꿈 많이 → 모바일에서 읽기 쉽게
- 마지막: 저장 유도 또는 댓글 유도 CTA

[INSTA_CAPTION]
캡션 내용

[INSTA_HASHTAGS]
해시태그 22~25개 (한국어+영어 혼합, 띄어쓰기로 구분)
`;

export default function App() {
  const [keyword, setKeyword]   = useState("");
  const [channels, setChannels] = useState(new Set(["blog", "insta"]));
  const [tone, setTone]         = useState("warm");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState({});
  const [images, setImages]     = useState([]);
  const fileRef = useRef();

  function toggleChannel(ch) {
    setChannels(prev => {
      const next = new Set(prev);
      if (next.has(ch)) { if (next.size === 1) return prev; next.delete(ch); } else next.add(ch);
      return next;
    });
  }

  function copyText(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 2500);
    });
  }

  async function handleImages(files) {
    const arr = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
      arr.push({ name: file.name, dataUrl, base64: dataUrl.split(",")[1], mime: file.type });
    }
    setImages(prev => [...prev, ...arr].slice(0, 5));
  }

  async function generate() {
    if (!keyword.trim()) return;
    setLoading(true); setError(""); setResult(null);

    const wantBlog  = channels.has("blog");
    const wantInsta = channels.has("insta");
    const hasImages = images.length > 0;
    const toneDesc  = TONES[tone];

    async function callAPI(promptText) {
      const contentParts = [{ type: "text", text: promptText }];
      if (hasImages) images.forEach(img => contentParts.push({ type: "image", source: { type: "base64", media_type: img.mime, data: img.base64 } }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, messages: [{ role: "user", content: contentParts }] }),
      });
      const data = await res.json();
      return data.content[0].text;
    }

    try {
      let blogTitle = "", blogHook = "", blogBody = "", instaCaption = "", instaHashtags = "";

      if (wantBlog && wantInsta) {
        // 두 채널 동시 생성
        const fullPrompt = BLOG_PROMPT(keyword, toneDesc, hasImages, images.length) + "\n\n" + INSTA_PROMPT(keyword, toneDesc, hasImages, images.length);
        const text = await callAPI(fullPrompt);
        blogTitle     = (text.match(/\[BLOG_TITLE\]\s*([\s\S]*?)(?=\[BLOG_HOOK\])/)    || [])[1]?.trim() || "";
        blogHook      = (text.match(/\[BLOG_HOOK\]\s*([\s\S]*?)(?=\[BLOG_BODY\])/)     || [])[1]?.trim() || "";
        blogBody      = (text.match(/\[BLOG_BODY\]\s*([\s\S]*?)(?=\[INSTA_CAPTION\]|$)/)|| [])[1]?.trim() || "";
        instaCaption  = (text.match(/\[INSTA_CAPTION\]\s*([\s\S]*?)(?=\[INSTA_HASHTAGS\])/) || [])[1]?.trim() || "";
        instaHashtags = (text.match(/\[INSTA_HASHTAGS\]\s*([\s\S]*?)$/) || [])[1]?.trim() || "";
      } else if (wantBlog) {
        const text = await callAPI(BLOG_PROMPT(keyword, toneDesc, hasImages, images.length));
        blogTitle = (text.match(/\[BLOG_TITLE\]\s*([\s\S]*?)(?=\[BLOG_HOOK\])/)  || [])[1]?.trim() || "";
        blogHook  = (text.match(/\[BLOG_HOOK\]\s*([\s\S]*?)(?=\[BLOG_BODY\])/)   || [])[1]?.trim() || "";
        blogBody  = (text.match(/\[BLOG_BODY\]\s*([\s\S]*?)$/) || [])[1]?.trim() || "";
      } else {
        const text = await callAPI(INSTA_PROMPT(keyword, toneDesc, hasImages, images.length));
        instaCaption  = (text.match(/\[INSTA_CAPTION\]\s*([\s\S]*?)(?=\[INSTA_HASHTAGS\])/) || [])[1]?.trim() || "";
        instaHashtags = (text.match(/\[INSTA_HASHTAGS\]\s*([\s\S]*?)$/) || [])[1]?.trim() || "";
      }

      setResult({ blogTitle, blogHook, blogBody, instaCaption, instaHashtags });
    } catch (e) {
      setError("오류가 발생했어요. 잠시 후 다시 시도해주세요. (" + e.message + ")");
    } finally {
      setLoading(false);
    }
  }

  function renderBlogBody(text) {
    return text.split(/(\[이미지\d+:[^\]]+\])/g).map((part, i) => {
      if (/^\[이미지(\d+):/.test(part)) {
        const num = parseInt(part.match(/\[이미지(\d+):/)[1]) - 1;
        const img = images[num];
        return (
          <span key={i} style={{ display: "block", margin: "16px 0" }}>
            {img && <img src={img.dataUrl} alt="" style={{ width: "100%", maxWidth: 440, borderRadius: 10, border: "1px solid #f0dcea", display: "block", marginBottom: 8 }} />}
            <span style={{ display: "inline-block", background: "#fff0f8", border: "1px solid #f0dcea", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#E91E8C", fontStyle: "italic" }}>📷 {part}</span>
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  const disabled = loading || !keyword.trim();

  return (
    <div style={{ fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", backgroundColor: "#fdf8fc", minHeight: "100vh", paddingBottom: 60 }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(12px);} to {opacity:1;transform:translateY(0);} }
        textarea { outline: none; }
        textarea:focus { border-color: #E91E8C !important; }
        .gen-btn:not(:disabled):hover { background:#c91577 !important; box-shadow:0 6px 20px rgba(233,30,140,.3); transform:translateY(-1px); }
        .copy-btn:hover { border-color:#E91E8C !important; color:#E91E8C !important; }
        .drop-zone:hover { border-color:#E91E8C !important; background:#fff5fb !important; }
        @media(max-width:600px){
          .result-grid { flex-direction: column !important; }
          .main-pad { padding: 16px 12px !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ background:"#fff", borderBottom:"1px solid #f0dcea", padding:"14px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ width:36, height:36, background:"#E91E8C", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ color:"#fff", fontStyle:"italic", fontWeight:700, fontSize:15 }}>P</span>
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a1018" }}>PBS COLOR LAB · SNS 콘텐츠 생성기</div>
          <div style={{ fontSize:10, color:"#8a7080", letterSpacing:"0.06em", textTransform:"uppercase" }}>AI-Powered Content Automation</div>
        </div>
      </div>

      <div className="main-pad" style={{ maxWidth:820, margin:"0 auto", padding:"24px 18px" }}>

        {/* ── INPUT CARD ── */}
        <div style={{ background:"#fff", border:"1px solid #f0dcea", borderRadius:16, padding:"22px 20px", marginBottom:20, boxShadow:"0 2px 20px rgba(233,30,140,.06)" }}>

          {/* ① KEYWORD */}
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#E91E8C", marginBottom:8 }}>① 주제 / 키워드 입력</div>
          <textarea value={keyword} onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();generate();} }}
            placeholder="예) 가을 딥다크 퍼스널컬러 코디, 오행 목(木) 타입 스타일링, 퍼스널컬러 진단 후기..."
            rows={2}
            style={{ width:"100%", border:"1.5px solid #f0dcea", borderRadius:10, padding:"12px 15px", fontSize:15, color:"#1a1018", background:"#fdf8fc", resize:"vertical", marginBottom:18, fontFamily:"inherit", display:"block" }} />

          {/* ② IMAGE */}
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#E91E8C", marginBottom:8 }}>
            ② 사진 첨부 <span style={{ color:"#c4a8bb", fontWeight:400, textTransform:"none", letterSpacing:0, fontSize:12 }}>(선택 · 최대 5장 · AI가 글에 자동 배치)</span>
          </div>
          <div className="drop-zone" onClick={() => fileRef.current.click()}
            onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleImages(e.dataTransfer.files);}}
            style={{ border:"2px dashed #f0dcea", borderRadius:12, padding:"16px 14px", textAlign:"center", cursor:"pointer", marginBottom:14, background:"#fdf0f8", transition:"all .2s" }}>
            <div style={{ fontSize:24, marginBottom:4 }}>📷</div>
            <div style={{ fontSize:13, color:"#8a7080" }}>클릭하거나 사진을 끌어다 놓으세요</div>
            <div style={{ fontSize:11, color:"#c4a8bb", marginTop:3 }}>코디 사진, 색상 카드, 진단 현장 사진 등</div>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:"none" }} onChange={e=>handleImages(e.target.files)} />

          {images.length > 0 && (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
              {images.map((img,i) => (
                <div key={i} style={{ position:"relative" }}>
                  <img src={img.dataUrl} alt="" style={{ width:68, height:68, objectFit:"cover", borderRadius:8, border:"2px solid #f0dcea", display:"block" }} />
                  <button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))}
                    style={{ position:"absolute", top:-6, right:-6, width:20, height:20, background:"#E91E8C", color:"#fff", border:"none", borderRadius:"50%", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* ③ CHANNEL */}
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#E91E8C", marginBottom:8 }}>③ 채널 선택</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
            {[["blog","📝 네이버 블로그"],["insta","📸 인스타그램"]].map(([ch,label]) => (
              <button key={ch} onClick={()=>toggleChannel(ch)}
                style={{ padding:"10px 18px", border:`1.5px solid ${channels.has(ch)?"#E91E8C":"#f0dcea"}`, borderRadius:50, background:channels.has(ch)?"#E91E8C":"#fff", color:channels.has(ch)?"#fff":"#4a3a45", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ④ TONE */}
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#E91E8C", marginBottom:8 }}>④ 말투 선택</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:22 }}>
            {Object.entries(TONE_LABELS).map(([k,v]) => (
              <button key={k} onClick={()=>setTone(k)}
                style={{ padding:"8px 14px", border:`1.5px solid ${tone===k?"#E91E8C":"#f0dcea"}`, borderRadius:50, background:tone===k?"#E91E8C":"#fff", color:tone===k?"#fff":"#8a7080", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:tone===k?700:400 }}>
                {v}
              </button>
            ))}
          </div>

          {/* GENERATE */}
          <button className="gen-btn" disabled={disabled} onClick={generate}
            style={{ width:"100%", padding:16, background:disabled?"#e0b8d3":"#E91E8C", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:disabled?"not-allowed":"pointer", letterSpacing:"0.04em", fontFamily:"inherit", transition:"all .2s" }}>
            {loading ? "✦ 콘텐츠 생성 중..." : "✨  콘텐츠 자동 생성하기"}
          </button>
          {!keyword.trim() && <div style={{ textAlign:"center", fontSize:11, color:"#c4a8bb", marginTop:8 }}>↑ 키워드를 먼저 입력해주세요</div>}
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ textAlign:"center", padding:"44px 20px", background:"#fff", borderRadius:16, border:"1px solid #f0dcea" }}>
            <div style={{ width:38, height:38, border:"3px solid #f9d6ec", borderTopColor:"#E91E8C", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 14px" }} />
            <div style={{ fontSize:14, color:"#8a7080" }}>{images.length>0?`사진 ${images.length}장 분석 + 콘텐츠 작성 중...`:"스토리텔링 블로그 글 작성 중..."}</div>
          </div>
        )}

        {error && <div style={{ textAlign:"center", padding:24, color:"#c91577", fontSize:13, background:"#fff0f8", borderRadius:12, border:"1px solid #f0dcea" }}>{error}</div>}

        {/* ── RESULTS ── */}
        {result && (
          <div style={{ animation:"fadeUp .4s ease" }}>

            {/* BLOG */}
            {result.blogBody && (
              <div style={{ background:"#fff", border:"1px solid #f0dcea", borderRadius:16, overflow:"hidden", marginBottom:18, boxShadow:"0 2px 20px rgba(233,30,140,.05)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #f0dcea", background:"#fdf0f8" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#E91E8C" }}>📝 블로그 글</span>
                    <span style={{ background:"#E91E8C", color:"#fff", fontSize:10, padding:"2px 9px", borderRadius:20, fontWeight:600 }}>네이버 블로그</span>
                  </div>
                  <button className="copy-btn" onClick={()=>copyText("blog",`${result.blogTitle}\n\n${result.blogHook}\n\n${result.blogBody}`)}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 13px", background:copied.blog?"#E91E8C":"#fff", border:`1.5px solid ${copied.blog?"#E91E8C":"#f0dcea"}`, borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:copied.blog?"#fff":"#4a3a45", fontFamily:"inherit" }}>
                    {copied.blog?"✅ 복사 완료":"📋 복사"}
                  </button>
                </div>
                <div style={{ padding:"20px 20px" }}>
                  <div style={{ fontWeight:700, fontSize:17, color:"#1a1018", marginBottom:14, lineHeight:1.55 }}>{result.blogTitle}</div>

                  {result.blogHook && (
                    <div style={{ background:"#fff8fd", borderLeft:"3px solid #E91E8C", borderRadius:"0 10px 10px 0", padding:"14px 16px", marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#E91E8C", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>✦ 후킹 오프닝</div>
                      <div style={{ fontSize:15, fontWeight:600, color:"#1a1018", lineHeight:1.8, whiteSpace:"pre-wrap", fontStyle:"italic" }}>{result.blogHook}</div>
                    </div>
                  )}

                  <div style={{ height:1, background:"#f0dcea", margin:"4px 0 16px" }} />
                  <div style={{ fontSize:14, lineHeight:2, color:"#4a3a45", whiteSpace:"pre-wrap" }}>{renderBlogBody(result.blogBody)}</div>
                </div>
              </div>
            )}

            {/* INSTA */}
            {result.instaCaption && (
              <div style={{ background:"#fff", border:"1px solid #f0dcea", borderRadius:16, overflow:"hidden", marginBottom:18, boxShadow:"0 2px 20px rgba(233,30,140,.05)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #f0dcea", background:"#fdf0f8" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#E91E8C" }}>📸 인스타그램</span>
                    <span style={{ background:"#E91E8C", color:"#fff", fontSize:10, padding:"2px 9px", borderRadius:20, fontWeight:600 }}>Instagram</span>
                  </div>
                  <button className="copy-btn" onClick={()=>copyText("insta",`${result.instaCaption}\n\n${result.instaHashtags}`)}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 13px", background:copied.insta?"#E91E8C":"#fff", border:`1.5px solid ${copied.insta?"#E91E8C":"#f0dcea"}`, borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:copied.insta?"#fff":"#4a3a45", fontFamily:"inherit" }}>
                    {copied.insta?"✅ 복사 완료":"📋 복사"}
                  </button>
                </div>
                <div style={{ padding:"20px 20px" }}>
                  <div style={{ background:"linear-gradient(135deg,#fdf0f8,#fff5fc)", border:"1px solid #f0dcea", borderRadius:12, padding:16, marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8a7080", marginBottom:8 }}>캡션</div>
                    <div style={{ fontSize:14, lineHeight:1.85, color:"#4a3a45", whiteSpace:"pre-wrap" }}>{result.instaCaption}</div>
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8a7080", marginBottom:10 }}>해시태그</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {result.instaHashtags.split(/\s+/).filter(t=>t.startsWith("#")).map((t,i) => (
                      <span key={i} style={{ fontSize:12, color:"#E91E8C", background:"#fdf0f8", padding:"4px 11px", borderRadius:20, fontWeight:500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !result && !error && (
          <div style={{ textAlign:"center", padding:"44px 20px", background:"#fff", borderRadius:16, border:"1px solid #f0dcea" }}>
            <div style={{ fontSize:44, marginBottom:12 }}>🎨</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#4a3a45", marginBottom:8 }}>PBS COLOR LAB 콘텐츠를 만들어보세요</div>
            <div style={{ fontSize:13, lineHeight:1.75, color:"#8a7080" }}>
              키워드 입력 + 사진 첨부 →<br />공감 블로그 글 + 인스타 캡션이 동시에 완성됩니다
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
