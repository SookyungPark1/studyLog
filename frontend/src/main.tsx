import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Lesson = { id: string; title: string; subtitle: string; dialogue: string; phrase: string; translation: string; questions: {prompt:string;options:string[]}[] };
type Progress = { todayCompleted: boolean; streak: number; totalDays: number; week: {date:string;completed:boolean}[] };
async function api<T>(url:string, init?:RequestInit):Promise<T> {
  const response = await fetch('/api'+url, init);
  if (!response.ok) { const body = await response.json().catch(()=>({})); throw new Error(body.message || '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'); }
  return response.json();
}
function App() {
  const [lesson,setLesson]=useState<Lesson>(); const [progress,setProgress]=useState<Progress>();
  const [stage,setStage]=useState(-1); const [answers,setAnswers]=useState<number[]>([]);
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [audioStatus,setAudioStatus]=useState('');
  async function load() { setError(''); try { const [l,p]=await Promise.all([api<Lesson>('/lesson'),api<Progress>('/progress')]);setLesson(l);setProgress(p); } catch(e){setError((e as Error).message);} }
  useEffect(()=>{void load(); return ()=>window.speechSynthesis?.cancel();},[]);
  function listen(text:string) { if(!('speechSynthesis' in window)){setAudioStatus('이 브라우저는 음성 읽기를 지원하지 않아요. 대본으로 학습해 주세요.');return;} window.speechSynthesis.cancel(); const speech=new SpeechSynthesisUtterance(text);speech.lang='en-US';speech.rate=0.8;speech.onerror=()=>setAudioStatus('음성을 재생할 수 없어요. 기기의 영어 음성 설정을 확인해 주세요.');window.speechSynthesis.speak(speech); }
  async function complete(){if(!lesson)return;setBusy(true);setError('');try{await api('/lessons/'+lesson.id+'/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers})});setStage(4);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <><header><a href="#" onClick={e=>{e.preventDefault();setStage(-1);setError('');}}>✳ <strong>StudyLog</strong></a><span>조금씩, 오래도록.</span></header><main>
    <div className="eyebrow">YOUR DAILY ENGLISH RITUAL</div>
    <h1>작은 배움이 쌓여,<br/>영어가 일상이 되는 곳<span>.</span></h1>
    <p className="intro">완벽하지 않아도 괜찮아요. 오늘은 딱 한 걸음만.</p>
    {error&&<div role="alert" className="error">{error} <button onClick={()=>void load()}>연결 다시 확인</button></div>}
    {!lesson||!progress?<p aria-live="polite">{error?'백엔드와 MySQL 실행 상태를 확인해 주세요.':'오늘의 학습을 준비하고 있어요…'}</p>:<>
    <section className="stats"><div><b>🔥 {progress.streak}일</b><span>연속으로 쌓은 배움</span></div><div><b>🌱 {progress.totalDays}일</b><span>지금까지 함께한 날</span></div><div><b>⏱ 5분</b><span>하루의 작은 투자</span></div></section>
    {stage===-1?<div className="grid"><section className="lesson card"><span className="badge">TODAY’S LESSON · 01</span><div className="cup">☕</div><h2>{lesson.title}</h2><p>{lesson.subtitle}</p><div className="tags">듣기 → 읽기 → 말하기 → 퀴즈</div><button className="primary" onClick={()=>{setAnswers([]);setStage(0);setError('');}}>{progress.todayCompleted?'한 번 더 복습하기':'오늘의 5분 시작하기'} <span>↗</span></button>{progress.todayCompleted&&<p className="success">✓ 오늘의 목표를 달성했어요!</p>}</section><aside className="card"><span className="eyebrow">MY LITTLE STEPS</span><h2>이번 주의 발자국</h2><p>하루 쉬어도 괜찮아요.<br/>다시 시작하면 그게 꾸준함이니까요.</p><div className="week">{progress.week.map(day=><div key={day.date}><span>{new Date(day.date+'T12:00:00').toLocaleDateString('ko-KR',{weekday:'short'})}</span><b className={day.completed?'done':''} title={day.date}>{day.completed?'✓':day.date.slice(-2)}</b></div>)}</div><div className="note">🌿 비교는 잠시 내려놓고,<br/>어제의 나보다 한 문장 더.</div></aside></div>:<section className="card exercise"><div className="step">{stage<4?`${stage+1} / 4 · ${['LISTENING','READING','SPEAKING','QUICK CHECK'][stage]}`:'DAILY GOAL COMPLETE'}</div><progress max={4} value={stage+1}/>
    {stage===0&&<><h2>귀를 열고, 들어볼까요?</h2><p>카페에서 어떤 음료를 주문하는지 들어보세요.</p><button className="primary" onClick={()=>listen(lesson.dialogue)}>▶ 대화 듣기</button><details><summary>대본 펼쳐 보기</summary><pre>{lesson.dialogue}</pre></details></>}
    {stage===1&&<><h2>오늘의 한 문장</h2><blockquote>{lesson.phrase}</blockquote><p>{lesson.translation}</p><pre>{lesson.dialogue}</pre><p>“I’d like …”는 원하는 것을 정중하게 주문할 때 쓰는 표현이에요.</p></>}
    {stage===2&&<><h2>이제 내 목소리로 말해요</h2><blockquote>{lesson.phrase}</blockquote><button onClick={()=>listen(lesson.phrase)}>▶ 발음 듣기</button><p>문장을 세 번 소리 내어 읽어보세요.<br/>이번 버전은 스스로 따라 말하는 연습이며, 녹음이나 자동 평가는 하지 않아요.</p></>}
    {audioStatus&&stage<3&&<p role="status">{audioStatus}</p>}
    {stage===3&&<><h2>가볍게 확인하고 마무리!</h2>{lesson.questions.map((q,i)=><fieldset key={q.prompt}><legend>{i+1}. {q.prompt}</legend>{q.options.map((option,j)=><label className={answers[i]===j?'selected':''} key={option}><input type="radio" name={'question'+i} checked={answers[i]===j} onChange={()=>setAnswers(previous=>{const next=[...previous];next[i]=j;return next;})}/>{option}</label>)}</fieldset>)}</>}
    {stage===4?<><div className="celebrate">🌱</div><h2>오늘의 한 걸음, 완료!</h2><p>배움이 하나 더 쌓였어요. 내일도 가볍게 만나요.</p><button className="primary" onClick={()=>setStage(-1)}>나의 기록 보기</button></>:<div className="actions"><button onClick={()=>{setStage(stage-1);setError('');window.speechSynthesis?.cancel();}}>이전</button><button className="primary" disabled={busy||(stage===3&&!lesson.questions.every((_,i)=>Number.isInteger(answers[i])))} onClick={()=>{window.speechSynthesis?.cancel();setError('');stage===3?void complete():setStage(stage+1);}}>{busy?'저장 중…':stage===3?'학습 완료하기':'다음으로 →'}</button></div>}
    </section>}
    </>}
    <footer>매일의 작은 성취, StudyLog <span>하루 5분이면 충분해요.</span></footer>
  </main></>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
