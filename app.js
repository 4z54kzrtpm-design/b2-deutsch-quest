let state=JSON.parse(localStorage.getItem("b2dq_state")||'{"xp":0,"mastered":[],"wrong":[],"seen":[],"today":0,"date":"","streak":0}');
const save=()=>localStorage.setItem("b2dq_state",JSON.stringify(state));
function day(){
 const d=new Date().toLocaleDateString("sv-SE");
 if(state.date!==d){ if(state.date){let a=new Date(state.date),b=new Date(d);let diff=Math.round((b-a)/86400000);state.streak=diff===1?state.streak+1:1}else state.streak=1;state.date=d;state.today=0;save();}
}
function update(){
 day(); const vc=CARDS.filter(x=>x.type==="Vokabel").length,rc=CARDS.filter(x=>x.type==="Redemittel").length;
 document.getElementById("xp").textContent=state.xp;document.getElementById("master").textContent=state.mastered.length;
 document.getElementById("wrong").textContent=state.wrong.length;document.getElementById("streak").textContent=state.streak;
 document.getElementById("level").textContent="Lv. "+(Math.floor(state.xp/100)+1);
 document.getElementById("wrongTile").textContent="복습할 카드 "+state.wrong.length+"개";
 document.getElementById("vc").textContent=Math.min(state.mastered.filter(id=>CARDS[id]?.type==="Vokabel").length,vc);
 document.getElementById("rc").textContent=Math.min(state.mastered.filter(id=>CARDS[id]?.type==="Redemittel").length,rc);
 document.getElementById("vbar").style.width=Math.min(100,(state.mastered.filter(id=>CARDS[id]?.type==="Vokabel").length/vc)*100)+"%";
 document.getElementById("rbar").style.width=Math.min(100,(state.mastered.filter(id=>CARDS[id]?.type==="Redemittel").length/rc)*100)+"%";
 document.getElementById("statXP").textContent=state.xp;document.getElementById("statMaster").textContent=state.mastered.length;
 document.getElementById("statWrong").textContent=state.wrong.length;document.getElementById("statToday").textContent=state.today;
}
function go(id){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".nav button").forEach(b=>b.classList.remove("active"));let n=document.getElementById("n-"+id);if(n)n.classList.add("active");update();if(id==="library")renderLibrary();}
let queue=[],qi=0,currentId=null;
function startStudy(mode){
 let ids=[];
 if(mode==="wrong") ids=state.wrong.filter(id=>CARDS[id]);
 else ids=CARDS.map((c,i)=>[i,c]).filter(([i,c])=>mode==="vocab"?c.type==="Vokabel":(c.type==="Redemittel"||c.type==="Ausdruck")).map(x=>x[0]);
 ids.sort(()=>Math.random()-0.5);queue=ids.slice(0,20);qi=0;go("study");showCard();
}
function showCard(){
 currentId=queue[qi];let c=CARDS[currentId];document.getElementById("studyTag").textContent=(c.type==="Ausdruck"?"Redemittel":c.type);
 document.getElementById("front").textContent=c.front;document.getElementById("meaning").textContent=c.meaning;document.getElementById("example").textContent=c.example;
 document.getElementById("extra").textContent=c.extra||"";["meaning","example","extra"].forEach(id=>document.getElementById(id).style.display="none");
}
function reveal(){["meaning","example","extra"].forEach(id=>document.getElementById(id).style.display="block");}
function speak(){let u=new SpeechSynthesisUtterance(CARDS[currentId].front);u.lang="de-DE";speechSynthesis.speak(u);}
function rate(ok){
 day(); if(ok){if(!state.mastered.includes(currentId))state.mastered.push(currentId);state.wrong=state.wrong.filter(x=>x!==currentId);state.xp+=10}else{if(!state.wrong.includes(currentId))state.wrong.push(currentId);state.xp+=2}
 state.today++;save();qi++;if(qi>=queue.length){alert("학습 세트 완료! +XP가 저장되었습니다.");go("home")}else showCard();update();
}

let sentenceQueue=[],sentenceIndex=0,sentenceCurrent=null;
function sentenceCards(){return CARDS.filter((c,i)=>c.type==='Ausdruck'||c.type==='Redemittel').map((c)=>c)}
function startSentence(){
 const arr=sentenceCards().sort(()=>Math.random()-0.5); sentenceQueue=arr.slice(0,10); sentenceIndex=0; go('sentence'); showSentence();
}
function showSentence(){
 sentenceCurrent=sentenceQueue[sentenceIndex];
 document.getElementById('sentencePrompt').textContent='다음 표현을 사용해서 자신의 문장을 만들어 보세요.';
 document.getElementById('sentenceTarget').textContent=sentenceCurrent.front;
 document.getElementById('sentenceInput').value='';
 document.getElementById('sentenceFeedback').innerHTML='<span class="hint">가능하면 B2 수준의 자연스러운 문장으로 직접 만들어 보세요. 번역해서 쓰기보다 독일어로 바로 생각해 보세요.</span>';
 document.getElementById('modelAnswer').style.display='none';
 document.getElementById('sentenceActions').style.display='none';
 document.getElementById('sentenceInput').focus();
}
function checkSentence(){
 const input=document.getElementById('sentenceInput').value.trim();
 if(!input){document.getElementById('sentenceFeedback').innerHTML='<span class="danger">먼저 독일어 문장을 입력하세요.</span>';return;}
 const target=sentenceCurrent.front.toLowerCase().trim(); const normalized=input.toLowerCase();
 const targetCore=target.replace(/\.\.\./g,'').trim();
 const used=normalized.includes(targetCore) || (targetCore.includes('...') && targetCore.split('...').some(x=>x.trim()&&normalized.includes(x.trim())));
 document.getElementById('sentenceFeedback').innerHTML=used
   ? '<span class="sentence-good">✓ 표현을 문장에 사용했습니다.</span><br><span class="hint">이제 모범 문장과 비교해서 어순·전치사·관사·자연스러움을 스스로 확인하세요.</span>'
   : '<span class="sentence-warn">⚠️ 입력한 문장에서 목표 표현이 확인되지 않습니다.</span><br><span class="hint">표현을 그대로 넣어 문장을 다시 만들어 보세요.</span>';
 document.getElementById('modelAnswer').innerHTML='<b>모범 문장</b>'+escapeHtml(sentenceCurrent.example)+'<br><span class="hint">정답 문장과 똑같이 만들 필요는 없습니다. 의미와 문법이 자연스러우면 자신의 문장이 더 좋습니다.</span>';
 document.getElementById('modelAnswer').style.display='block';
 document.getElementById('sentenceActions').style.display='grid';
}
function rateSentence(ok){
 day(); state.today++; state.xp+=ok?15:5;
 if(ok){const id=CARDS.indexOf(sentenceCurrent);if(id>=0&&!state.mastered.includes(id))state.mastered.push(id)}
 save();update(); sentenceIndex++;
 if(sentenceIndex>=sentenceQueue.length){alert('문장 만들기 세트 완료! +XP가 저장되었습니다.');go('home')}else showSentence();
}
function speakSentence(){
 const text=document.getElementById('sentenceInput').value.trim()||sentenceCurrent?.example||''; if(!text)return;
 const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';speechSynthesis.speak(u);
}
function escapeHtml(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

let qidx=0;
function startQuiz(){qidx=0;QUESTIONS.sort(()=>Math.random()-0.5);go("quiz");showQuestion();}
function showQuestion(){
 let q=QUESTIONS[qidx%QUESTIONS.length];document.getElementById("quizTag").textContent=q.kind==="redemittel"?"Redemittel":q.kind==="reverse"?"Deutsch":"시험형";
 document.getElementById("question").textContent=q.q;let box=document.getElementById("options");box.innerHTML="";document.getElementById("feedback").textContent="";
 [...q.options].sort(()=>Math.random()-0.5).forEach(opt=>{let b=document.createElement("button");b.className="option";b.textContent=opt;b.onclick=()=>answer(b,opt,q.answer,q.card);box.appendChild(b)});
}
function answer(btn,opt,ans,card){
 document.querySelectorAll(".option").forEach(x=>x.disabled=true);
 if(opt===ans){btn.classList.add("good");state.xp+=10;state.today++;document.getElementById("feedback").innerHTML='<span class="success">정답 ✓ +10 XP</span>'}
 else{btn.classList.add("bad");state.xp+=2;state.today++;document.getElementById("feedback").innerHTML='<span class="danger">오답 — 정답: '+ans+'</span>'}
 save();update();setTimeout(()=>{qidx++;showQuestion()},850);
}
function renderLibrary(){
 let term=(document.getElementById("search").value||"").toLowerCase().trim();
 let arr=CARDS.filter(c=>!term||c.front.toLowerCase().includes(term)||c.meaning.toLowerCase().includes(term)).slice(0,100);
 document.getElementById("results").innerHTML=arr.map(c=>'<div class="row"><b>'+c.front+'</b><small>'+c.meaning+' · '+(c.type==='Ausdruck'?'Redemittel':c.type)+'</small></div>').join("")||'<div class="muted">검색 결과가 없습니다.</div>';
}
function resetData(){if(confirm("모든 학습 기록을 삭제할까요?")){localStorage.removeItem("b2dq_state");location.reload()}}
update();


// ---------- Sprechen ----------
const SPEAKING_TOPICS=[
 {topic:'Homeoffice',task:'Nennen Sie einen Vorteil und einen Nachteil des Homeoffice. Begründen Sie Ihre Meinung.',targets:['einerseits ... andererseits','meiner Ansicht nach','ein Vorteil besteht darin, dass ...']},
 {topic:'Öffentliche Verkehrsmittel',task:'Erklären Sie, warum öffentliche Verkehrsmittel wichtig sind. Nennen Sie ein Beispiel aus Ihrem Alltag.',targets:['im Vergleich zu','eine wichtige Rolle spielen','dazu beitragen, dass ...']},
 {topic:'Deutschlernen',task:'Beschreiben Sie, wie Sie Deutsch lernen und welche Methode Ihnen besonders hilft.',targets:['sich auf etwas konzentrieren','Fortschritte machen','es fällt mir schwer, zu ...']},
 {topic:'Gesundheit und Ernährung',task:'Was kann man tun, um gesund zu bleiben? Begründen Sie mindestens zwei Maßnahmen.',targets:['dafür sorgen, dass ...','auf etwas verzichten','eine wichtige Rolle spielen']},
 {topic:'Familie und Beruf',task:'Welche Schwierigkeiten können bei der Vereinbarkeit von Familie und Beruf entstehen?',targets:['die Vereinbarkeit','einerseits ... andererseits','es kommt darauf an, ob ...']},
 {topic:'Soziale Medien',task:'Welche Vorteile und Risiken haben soziale Medien? Sagen Sie Ihre Meinung.',targets:['Einfluss nehmen auf','nicht zuletzt','ich sehe das etwas anders']},
 {topic:'Umweltschutz',task:'Was kann jeder Einzelne zum Umweltschutz beitragen? Nennen Sie konkrete Beispiele.',targets:['einen Beitrag leisten','auf etwas verzichten','nachhaltig']},
 {topic:'Arbeiten in Deutschland',task:'Welche Fähigkeiten sind im Berufsleben besonders wichtig? Begründen Sie Ihre Antwort.',targets:['überzeugt sein von','übernehmen','von Vorteil sein']}
];
let speakingCurrent=null,speakingRecognition=null,speakingListening=false,speakingFinal='',speakingInterim='';
function startSpeaking(){
 speakingCurrent=SPEAKING_TOPICS[Math.floor(Math.random()*SPEAKING_TOPICS.length)];
 go('speaking'); renderSpeaking();
}
function renderSpeaking(){
 if(!speakingCurrent)return;
 document.getElementById('speakTopic').textContent=speakingCurrent.topic;
 document.getElementById('speakTask').textContent=speakingCurrent.task;
 document.getElementById('speakTarget').innerHTML='<b>추천 표현</b><br>'+speakingCurrent.targets.map(escapeHtml).join(' · ');
 document.getElementById('speakTranscript').textContent='';
 document.getElementById('speakFeedback').innerHTML='';
 document.getElementById('speakActions').style.display='none';
 document.getElementById('speakStatus').textContent='마이크 버튼을 누르고 독일어로 말하세요.';
 document.getElementById('speakStatus').classList.remove('recording');
 document.getElementById('speakRecordBtn').textContent='🎙️ 말하기 시작';
 speakingFinal='';speakingInterim='';
}
function getRecognition(){
 const C=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!C)return null;
 const r=new C();r.lang='de-DE';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
 r.onstart=()=>{speakingListening=true;document.getElementById('speakRecordBtn').textContent='⏹️ 말하기 중지';document.getElementById('speakStatus').textContent='듣고 있습니다. 자연스럽게 독일어로 계속 말하세요.';document.getElementById('speakStatus').classList.add('recording');};
 r.onresult=e=>{let finalText=speakingFinal, interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=(finalText?' ':'')+t.trim();else interim+=(interim?' ':'')+t.trim();}speakingFinal=finalText.trim();speakingInterim=interim.trim();document.getElementById('speakTranscript').textContent=(speakingFinal+(speakingInterim?' '+speakingInterim:'')).trim();};
 r.onerror=e=>{document.getElementById('speakStatus').textContent='음성 인식 오류: '+(e.error||'알 수 없는 오류')+'. 다시 시도해 보세요.';};
 r.onend=()=>{speakingListening=false;document.getElementById('speakRecordBtn').textContent='🎙️ 다시 말하기';document.getElementById('speakStatus').classList.remove('recording');};
 return r;
}
function toggleRecording(){
 if(speakingListening){speakingRecognition?.stop();return;}
 if(!('SpeechRecognition' in window||'webkitSpeechRecognition' in window)){document.getElementById('speakStatus').innerHTML='이 브라우저에서는 음성 인식을 지원하지 않습니다. <b>Chrome/Edge</b>에서 사용해 보세요. iPhone에서는 Safari의 지원 여부가 기기·버전에 따라 다를 수 있습니다.';return;}
 speakingRecognition=getRecognition();
 try{speakingRecognition.start();}catch(e){speakingRecognition=null;}
}
function clearTranscript(){speakingFinal='';speakingInterim='';document.getElementById('speakTranscript').textContent='';}
function speakTopic(){if(!speakingCurrent)return;const u=new SpeechSynthesisUtterance(speakingCurrent.task);u.lang='de-DE';speechSynthesis.cancel();speechSynthesis.speak(u);}
function finishSpeaking(){
 if(speakingListening)speakingRecognition?.stop();
 const text=(speakingFinal||document.getElementById('speakTranscript').textContent||'').trim();
 if(!text){document.getElementById('speakFeedback').innerHTML='<span class="speak-warn">먼저 20~60초 정도 독일어로 말해 보세요.</span>';return;}
 const lower=text.toLowerCase();
 const used=speakingCurrent.targets.filter(t=>{const core=t.toLowerCase().replace(/\.\.\./g,'').trim();return lower.includes(core.split('...')[0].trim())||lower.includes(core);});
 const words=text.split(/\s+/).filter(Boolean).length;
 const feedback=[];
 feedback.push(used.length?'<span class="speak-good">✓ 추천 표현 '+used.length+'개를 사용했습니다.</span>':'<span class="speak-warn">△ 추천 표현을 아직 확인하지 못했습니다.</span>');
 feedback.push(words>=45?'<span class="speak-good">✓ 충분한 길이로 말했습니다.</span>':`<span class="speak-warn">△ 현재 약 ${words}단어입니다. 45단어 이상을 목표로 해보세요.</span>`);
 feedback.push('<span class="speak-note">자동 평가는 표현 사용과 분량을 기준으로 한 간단한 자기점검입니다. 문법·발음의 정확성을 완전히 판정하는 기능은 아닙니다.</span>');
 feedback.push('<b>다시 확인할 것</b><ul><li>주제에 직접 답했는가?</li><li>이유나 예시를 덧붙였는가?</li><li>Redemittel을 자연스럽게 사용했는가?</li><li>같은 단어만 반복하지 않았는가?</li></ul>');
 document.getElementById('speakFeedback').innerHTML=feedback.join('<br>');
 document.getElementById('speakActions').style.display='grid';
 day();state.today++;state.xp+=15;save();update();
}
function repeatSpeaking(){renderSpeaking();}
