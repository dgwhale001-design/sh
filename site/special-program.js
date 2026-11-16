/* oxlint-disable */
(function(){
  var defaultProgram={id:'prehigh-2026',name:'예비고1 영어·수학 12주 특강',startDate:'2026-11-16',totalWeeks:12,hoursPerSubject:5,warningThreshold:3,dangerThreshold:2};
  state.specialProgram=Object.assign({},defaultProgram,state.specialProgram||{});
  if(!Array.isArray(state.specialSessions))state.specialSessions=[];
  if(!Array.isArray(state.specialEvaluations))state.specialEvaluations=[];
  if(!Array.isArray(state.specialClinics))state.specialClinics=[];
  if(!Array.isArray(state.specialReports))state.specialReports=[];
  if(!Array.isArray(state.specialEnrollments))state.specialEnrollments=[];
  var specialTab='dashboard',activeSessionId='',activeReportId='',editingSessionId='';

  roleViews.admin.splice(4,0,'intensive');
  roleViews.teacher.unshift('intensive');
  titles.intensive=['예비고1 12주 특강','수업·평가·클리닉·학부모 리포트를 하나의 성장 이력으로 관리하세요.'];

  var originalShow=show;
  show=function(view){originalShow(view);if(view==='intensive')renderSpecial()};
  var originalLoadCloud=loadCloud;
  loadCloud=async function(){await originalLoadCloud();await loadSpecialCloud();if(!document.querySelector('[data-panel="intensive"]').hidden)renderSpecial()};
  var originalSanitizeTeacherMemory=sanitizeTeacherMemory;
  sanitizeTeacherMemory=function(){originalSanitizeTeacherMemory();if(currentUserRole==='teacher'){state.specialSessions=[];state.specialEvaluations=[];state.specialClinics=[];state.specialReports=[];state.specialEnrollments=[]}};

  function id(){return crypto.randomUUID?crypto.randomUUID():'00000000-0000-4000-8000-'+String(Date.now()).padStart(12,'0').slice(-12)}
  function clean(value){return String(value||'').trim()}
  function academyActiveStudents(){return students.filter(function(student){return student.status==='신규'||student.status==='재원'})}
  function activeStudents(){var enrolledIds=new Set(state.specialEnrollments.map(function(item){return item.studentId}));return academyActiveStudents().filter(function(student){return enrolledIds.has(Number(student.id))})}
  function enrollmentFor(studentId){return state.specialEnrollments.find(function(item){return item.studentId===Number(studentId)})}
  function studentName(studentId){var student=students.find(function(item){return Number(item.id)===Number(studentId)});return student?student.name:'삭제된 학생'}
  function subjectStudents(subject){return activeStudents().filter(function(student){var enrollment=enrollmentFor(student.id);return enrollment&&(enrollment.subjects===subject||enrollment.subjects==='영어·수학')})}
  function average(values){var list=values.map(Number).filter(function(value){return Number.isFinite(value)});return list.length?list.reduce(function(sum,value){return sum+value},0)/list.length:null}
  function percent(part,total){return total?Math.round(part/total*100):null}
  function formatRate(value){return value===null?'기록 없음':value+'%'}
  function formatScore(evaluation){return evaluation.testStatus==='응시'&&evaluation.testScore!==null&&evaluation.testScore!==''?evaluation.testScore+'/'+(evaluation.testMax||100):evaluation.testStatus||'미실시'}
  function statusClass(status){return status==='관리 필요'?'danger':status==='주의'?'warning':''}
  function localSave(){if(currentUserRole==='admin')save()}
  function sessionFromRow(row){return {id:row.id,subject:row.subject,sessionDate:row.session_date,weekNo:Number(row.week_no),sessionNo:Number(row.session_no),teacher:row.teacher||'',materialProgress:row.material_progress||'',goal:row.goal||'',content:row.content||'',homework:row.homework||'',testInfo:row.test_info||'',status:row.status||'정상'}}
  function evaluationFromRow(row){return {id:row.id,sessionId:row.session_id,studentId:Number(row.student_id),attendance:row.attendance,homeworkStatus:row.homework_status,progressOverride:row.progress_override||'',homeworkOverride:row.homework_override||'',achievement:Number(row.achievement),focus:Number(row.focus),testStatus:row.test_status||'미실시',testName:row.test_name||'',testScore:row.test_score===null?null:Number(row.test_score),testMax:row.test_max===null?null:Number(row.test_max),memo:row.memo||''}}
  function clinicFromRow(row){return {id:row.id,studentId:Number(row.student_id),subject:row.subject,createdDate:row.created_date,sessionId:row.session_id||'',area:row.area,cause:row.cause||'',plan:row.plan||'',teacher:row.teacher||'',plannedDate:row.planned_date||'',completedDate:row.completed_date||'',retestResult:row.retest_result||'',feedback:row.feedback||'',status:row.status}}
  function reportFromRow(row){return {id:row.id,studentId:Number(row.student_id),reportType:row.report_type,subject:row.subject,periodLabel:row.period_label,teacher:row.teacher||'',content:row.content||{},status:row.status||'초안',approvedAt:row.approved_at||'',approvedBy:row.approved_by||'',deliveredAt:row.delivered_at||'',createdAt:row.created_at||''}}

  async function loadSpecialCloud(){
    if(!cloudEnabled||!authSession)return;
    var results=await Promise.all([
      cloudOptional('special_programs?select=id,name,start_date,total_weeks,hours_per_subject,warning_threshold,danger_threshold&id=eq.prehigh-2026&limit=1'),
      cloudOptional('special_sessions?select=*&order=session_date.desc,session_no.desc&limit=300'),
      cloudOptional('special_evaluations?select=*&limit=5000'),
      cloudOptional('special_clinics?select=*&order=created_date.desc&limit=1000'),
      cloudOptional('special_reports?select=*&order=created_at.desc&limit=500'),
      cloudOptional('special_enrollments?select=*&program_id=eq.prehigh-2026&limit=1000')
    ]);
    if(results[0].ok&&results[0].data&&results[0].data[0]){var p=results[0].data[0];state.specialProgram={id:p.id,name:p.name,startDate:p.start_date,totalWeeks:Number(p.total_weeks),hoursPerSubject:Number(p.hours_per_subject),warningThreshold:Number(p.warning_threshold),dangerThreshold:Number(p.danger_threshold)}}
    if(results[1].ok)state.specialSessions=(results[1].data||[]).map(sessionFromRow);
    if(results[2].ok)state.specialEvaluations=(results[2].data||[]).map(evaluationFromRow);
    if(results[3].ok)state.specialClinics=(results[3].data||[]).map(clinicFromRow);
    if(results[4].ok)state.specialReports=(results[4].data||[]).map(reportFromRow);
    if(results[5].ok)state.specialEnrollments=(results[5].data||[]).map(function(row){return {studentId:Number(row.student_id),subjects:row.subjects,englishTeacher:row.english_teacher||'',mathTeacher:row.math_teacher||'',initialLevel:row.initial_level||'',notes:row.notes||''}});
    if(!activeSessionId&&state.specialSessions[0])activeSessionId=state.specialSessions[0].id;
    localSave();
  }

  function renderSpecial(){
    renderSpecialHeader();
    populateSpecialSelects();
    document.querySelectorAll('[data-special-tab]').forEach(function(button){button.classList.toggle('active',button.dataset.specialTab===specialTab)});
    document.querySelectorAll('.special-tab-panel').forEach(function(panel){panel.hidden=panel.id!=='special-tab-'+specialTab});
    if(specialTab==='dashboard')renderSpecialDashboard();
    if(specialTab==='sessions'){renderSessionList();renderEvaluationTable()}
    if(specialTab==='clinics')renderClinicList();
    if(specialTab==='history')renderHistory();
    if(specialTab==='reports')renderReportList();
    if(specialTab==='settings'){renderSettings();renderEnrollments()}
  }

  function renderSpecialHeader(){
    var program=state.specialProgram,start=new Date(program.startDate+'T00:00:00'),now=new Date(today+'T00:00:00'),elapsed=Math.floor((now-start)/604800000)+1,week=Math.min(Math.max(elapsed,1),program.totalWeeks),progress=Math.min(Math.max(elapsed/program.totalWeeks*100,0),100);
    document.getElementById('special-current-week').textContent=elapsed<1?'시작 전':week+'주차';
    document.getElementById('special-period-label').textContent=program.startDate.replaceAll('-','.')+' 시작 · 총 '+program.totalWeeks+'주';
    document.getElementById('special-progress-bar').style.width=progress+'%';
  }

  function populateSpecialSelects(){
    var options=activeStudents().map(function(student){var enrollment=enrollmentFor(student.id);return '<option value="'+student.id+'">'+escapeHtml(student.name)+' · '+escapeHtml(enrollment?enrollment.subjects:'과목 미설정')+'</option>'}).join('');
    ['special-clinic-student','special-history-student','special-report-student'].forEach(function(elementId){var element=document.getElementById(elementId),current=element.value;element.innerHTML=options;if(current&&students.some(function(student){return String(student.id)===current}))element.value=current});
    var weekSelect=document.getElementById('special-session-week'),selected=weekSelect.value;weekSelect.innerHTML=Array.from({length:state.specialProgram.totalWeeks},function(_,index){return '<option value="'+(index+1)+'">'+(index+1)+'주차</option>'}).join('');if(selected)weekSelect.value=selected;
    if(!document.getElementById('special-session-date').value)document.getElementById('special-session-date').value=today;
    if(!document.getElementById('special-clinic-created').value)document.getElementById('special-clinic-created').value=today;
    if(!document.getElementById('special-report-start').value)document.getElementById('special-report-start').value=state.specialProgram.startDate;
    if(!document.getElementById('special-report-end').value)document.getElementById('special-report-end').value=today;
  }

  function studentMetrics(studentId){
    var evaluations=state.specialEvaluations.filter(function(item){return item.studentId===Number(studentId)}),attended=evaluations.filter(function(item){return ['출석','지각','보강'].includes(item.attendance)}).length,homework=evaluations.filter(function(item){return item.homeworkStatus==='완료'}).length,achievement=average(evaluations.map(function(item){return item.achievement})),tests=evaluations.filter(function(item){return item.testStatus==='응시'&&item.testScore!==null}),clinics=state.specialClinics.filter(function(item){return item.studentId===Number(studentId)}),openClinics=clinics.filter(function(item){return item.status!=='완료'});
    var attendanceRate=percent(attended,evaluations.length),homeworkRate=percent(homework,evaluations.length),latestTest=tests.length?tests[tests.length-1]:null,status='정상';
    if(openClinics.length||achievement!==null&&achievement<=state.specialProgram.dangerThreshold||attendanceRate!==null&&attendanceRate<80)status='관리 필요';
    else if(achievement!==null&&achievement<state.specialProgram.warningThreshold||homeworkRate!==null&&homeworkRate<80)status='주의';
    return {evaluations:evaluations,attendanceRate:attendanceRate,homeworkRate:homeworkRate,achievement:achievement,latestTest:latestTest,clinics:clinics,openClinics:openClinics,status:status};
  }

  function renderSpecialDashboard(){
    var roster=activeStudents(),allEvaluations=state.specialEvaluations,attendanceRate=percent(allEvaluations.filter(function(item){return ['출석','지각','보강'].includes(item.attendance)}).length,allEvaluations.length),homeworkRate=percent(allEvaluations.filter(function(item){return item.homeworkStatus==='완료'}).length,allEvaluations.length),achievement=average(allEvaluations.map(function(item){return item.achievement})),openClinics=state.specialClinics.filter(function(item){return item.status!=='완료'});
    var kpis=[['등록 학생',roster.length+'명','특강 재원·신규'],['전체 출석률',formatRate(attendanceRate),'저장 평가 기준'],['과제 완료율',formatRate(homeworkRate),'완료 상태 기준'],['평균 성취도',achievement===null?'기록 없음':achievement.toFixed(1)+'/5','1~5단계'],['미완료 클리닉',openClinics.length+'건','확인 필요']];
    document.getElementById('special-kpis').innerHTML=kpis.map(function(item,index){return '<article class="card special-kpi '+(index===4&&openClinics.length?'alert':index===1&&attendanceRate>=90?'ok':'')+'"><span>'+item[0]+'</span><strong>'+item[1]+'</strong><small>'+item[2]+'</small></article>'}).join('');
    document.getElementById('special-student-status').innerHTML=roster.map(function(student){var metrics=studentMetrics(student.id),enrollment=enrollmentFor(student.id);return '<tr data-history-student="'+student.id+'"><td><button class="panel-link" type="button" data-open-history="'+student.id+'"><strong>'+escapeHtml(student.name)+'</strong></button></td><td>'+escapeHtml(enrollment?enrollment.subjects:'미설정')+'</td><td>'+formatRate(metrics.attendanceRate)+'</td><td>'+formatRate(metrics.homeworkRate)+'</td><td>'+(metrics.achievement===null?'기록 없음':metrics.achievement.toFixed(1)+'/5')+'</td><td>'+(metrics.latestTest?formatScore(metrics.latestTest):'기록 없음')+'</td><td>'+(metrics.openClinics.length?metrics.openClinics.length+'건 진행':'완료·없음')+'</td><td><span class="special-state '+statusClass(metrics.status)+'">'+metrics.status+'</span></td></tr>'}).join('')||'<tr><td colspan="8" class="special-empty">특강 설정에서 학생을 편성해주세요.</td></tr>';
    var alerts=[];roster.forEach(function(student){var metrics=studentMetrics(student.id);if(metrics.status!=='정상')alerts.push({name:student.name,text:metrics.openClinics.length?'미완료 클리닉 '+metrics.openClinics.length+'건':metrics.achievement!==null?'평균 성취도 '+metrics.achievement.toFixed(1)+'/5':'출결·과제 확인 필요'})});
    document.getElementById('special-alert-list').innerHTML=alerts.map(function(item){return '<div class="special-alert-item"><strong>'+escapeHtml(item.name)+'</strong><p>'+escapeHtml(item.text)+'</p></div>'}).join('')||'<div class="special-empty">현재 관리 우선 대상이 없습니다.</div>';
    document.querySelectorAll('[data-open-history]').forEach(function(button){button.onclick=function(){document.getElementById('special-history-student').value=button.dataset.openHistory;switchSpecialTab('history')}});
  }

  function renderSessionList(){
    var list=[].concat(state.specialSessions).sort(function(a,b){return (b.sessionDate+b.sessionNo).localeCompare(a.sessionDate+a.sessionNo)});
    document.getElementById('special-session-list').innerHTML=list.map(function(session){return '<article class="special-session-item '+(session.id===activeSessionId?'active':'')+'"><div class="special-session-head"><div><strong>'+session.weekNo+'주차 · '+escapeHtml(session.subject)+' '+session.sessionNo+'차시</strong><p>'+escapeHtml(session.sessionDate)+' · '+escapeHtml(session.teacher)+'<br>'+escapeHtml(session.materialProgress)+'</p></div><span class="special-chip">'+escapeHtml(session.status)+'</span></div><div class="special-item-actions"><button class="btn small primary" type="button" data-select-session="'+session.id+'">학생 평가</button><button class="btn small" type="button" data-edit-session="'+session.id+'">수정</button></div></article>'}).join('')||'<div class="special-empty">등록된 수업 차시가 없습니다.</div>';
    document.querySelectorAll('[data-select-session]').forEach(function(button){button.onclick=function(){activeSessionId=button.dataset.selectSession;renderSessionList();renderEvaluationTable()}});
    document.querySelectorAll('[data-edit-session]').forEach(function(button){button.onclick=function(){editSession(button.dataset.editSession)}});
  }

  function editSession(sessionId){
    var session=state.specialSessions.find(function(item){return item.id===sessionId});if(!session)return;editingSessionId=session.id;
    document.getElementById('special-session-subject').value=session.subject;document.getElementById('special-session-date').value=session.sessionDate;document.getElementById('special-session-week').value=session.weekNo;document.getElementById('special-session-number').value=session.sessionNo;document.getElementById('special-session-teacher').value=session.teacher;document.getElementById('special-session-status').value=session.status;document.getElementById('special-session-progress').value=session.materialProgress;document.getElementById('special-session-goal').value=session.goal;document.getElementById('special-session-content').value=session.content;document.getElementById('special-session-homework').value=session.homework;document.getElementById('special-session-test').value=session.testInfo;document.getElementById('special-session-submit').textContent='차시 수정 저장';document.getElementById('special-session-subject').focus()
  }

  function renderEvaluationTable(){
    var session=state.specialSessions.find(function(item){return item.id===activeSessionId}),saveButton=document.getElementById('special-save-evaluations');
    if(!session){document.getElementById('special-evaluation-caption').textContent='먼저 위에서 수업 차시를 선택하세요.';document.getElementById('special-evaluation-rows').innerHTML='<tr><td colspan="11" class="special-empty">수업 차시를 선택해주세요.</td></tr>';saveButton.disabled=true;return}
    saveButton.disabled=false;document.getElementById('special-evaluation-caption').textContent=session.weekNo+'주차 '+session.subject+' '+session.sessionNo+'차시 · '+session.sessionDate+' · '+session.materialProgress;
    var evaluations=new Map(state.specialEvaluations.filter(function(item){return item.sessionId===session.id}).map(function(item){return [item.studentId,item]}));
    document.getElementById('special-evaluation-rows').innerHTML=subjectStudents(session.subject).map(function(student){var item=evaluations.get(student.id)||{attendance:'출석',homeworkStatus:'완료',progressOverride:'',homeworkOverride:'',achievement:3,focus:3,testStatus:session.testInfo?'응시':'미실시',testScore:null,testMax:100,memo:''};return '<tr data-evaluation-student="'+student.id+'"><td><strong>'+escapeHtml(student.name)+'</strong></td><td>'+selectHtml('attendance',['출석','지각','결석','공결','보강'],item.attendance)+'</td><td>'+selectHtml('homeworkStatus',['완료','부분 완료','미완료','미제출','면제'],item.homeworkStatus)+'</td><td><input class="memo-input" data-field="progressOverride" value="'+escapeHtml(item.progressOverride||'')+'" placeholder="공통과 같으면 비움"></td><td><input class="memo-input" data-field="homeworkOverride" value="'+escapeHtml(item.homeworkOverride||'')+'" placeholder="공통과 같으면 비움"></td><td>'+selectHtml('achievement',['5','4','3','2','1'],String(item.achievement),'achievement-select')+'</td><td>'+selectHtml('focus',['5','4','3','2','1'],String(item.focus),'focus-select')+'</td><td>'+selectHtml('testStatus',['응시','미실시','결시','재시험 예정'],item.testStatus)+'</td><td><input data-field="testScore" type="number" min="0" max="1000" value="'+(item.testScore===null?'':item.testScore)+'" aria-label="'+escapeHtml(student.name)+' 테스트 점수"><input data-field="testMax" type="number" min="1" max="1000" value="'+(item.testMax||100)+'" aria-label="'+escapeHtml(student.name)+' 만점"></td><td><input class="memo-input" data-field="memo" value="'+escapeHtml(item.memo||'')+'" placeholder="잘한 점·어려운 점"></td><td><button class="btn small" type="button" data-clinic-from="'+student.id+'">등록</button></td></tr>'}).join('')||'<tr><td colspan="11" class="special-empty">이 과목을 수강하는 학생이 없습니다.</td></tr>';
    document.querySelectorAll('[data-clinic-from]').forEach(function(button){button.onclick=function(){document.getElementById('special-clinic-student').value=button.dataset.clinicFrom;document.getElementById('special-clinic-subject').value=session.subject;switchSpecialTab('clinics');document.getElementById('special-clinic-area').focus()}});
  }

  function selectHtml(field,options,value,className){
    return '<select data-field="'+field+'" class="'+(className||'')+'">'+options.map(function(option){return '<option '+(String(option)===String(value)?'selected':'')+'>'+option+'</option>'}).join('')+'</select>';
  }

  async function saveEvaluations(){
    var session=state.specialSessions.find(function(item){return item.id===activeSessionId});if(!session)return;
    var rows=Array.from(document.querySelectorAll('[data-evaluation-student]')).map(function(row){var studentId=Number(row.dataset.evaluationStudent),get=function(field){return row.querySelector('[data-field="'+field+'"]').value},existing=state.specialEvaluations.find(function(item){return item.sessionId===session.id&&item.studentId===studentId}),testStatus=get('testStatus'),score=get('testScore');return {id:existing?existing.id:id(),sessionId:session.id,studentId:studentId,attendance:get('attendance'),homeworkStatus:get('homeworkStatus'),progressOverride:clean(get('progressOverride')),homeworkOverride:clean(get('homeworkOverride')),achievement:Number(get('achievement')),focus:Number(get('focus')),testStatus:testStatus,testName:session.testInfo||'',testScore:testStatus==='응시'&&score!==''?Number(score):null,testMax:testStatus==='응시'?Number(get('testMax')||100):null,memo:clean(get('memo'))}});
    rows.forEach(function(row){state.specialEvaluations=state.specialEvaluations.filter(function(item){return !(item.sessionId===row.sessionId&&item.studentId===row.studentId)});state.specialEvaluations.push(row)});localSave();
    try{if(cloudEnabled){await cloud('special_evaluations?on_conflict=session_id,student_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.map(function(item){return {id:item.id,session_id:item.sessionId,student_id:item.studentId,attendance:item.attendance,homework_status:item.homeworkStatus,progress_override:item.progressOverride,homework_override:item.homeworkOverride,achievement:item.achievement,focus:item.focus,test_status:item.testStatus,test_name:item.testName,test_score:item.testScore,test_max:item.testMax,memo:item.memo,updated_at:new Date().toISOString()}}))})}toast(rows.length+'명의 차시 평가를 저장했습니다.');renderSpecialDashboard()}catch(error){toast('평가를 클라우드에 저장하지 못했습니다. 다시 시도해주세요.')}
  }

  function renderClinicList(){
    var filter=document.getElementById('special-clinic-filter').value,list=state.specialClinics.filter(function(item){if(filter==='전체')return true;if(filter==='완료')return item.status==='완료';return item.status!=='완료'}).sort(function(a,b){return b.createdDate.localeCompare(a.createdDate)});
    document.getElementById('special-clinic-list').innerHTML=list.map(function(item){return '<article class="special-clinic-item"><div class="special-clinic-head"><div><strong>'+escapeHtml(studentName(item.studentId))+' · '+escapeHtml(item.subject)+'</strong><p>'+escapeHtml(item.area)+'<br>'+escapeHtml(item.plan||'보충학습 내용 미입력')+'</p></div><span class="special-chip '+(item.status==='완료'?'':'open')+'">'+escapeHtml(item.status)+'</span></div><div class="special-clinic-meta"><span class="special-chip">등록 '+escapeHtml(item.createdDate)+'</span><span class="special-chip">담당 '+escapeHtml(item.teacher||'미정')+'</span>'+(item.plannedDate?'<span class="special-chip">예정 '+escapeHtml(item.plannedDate)+'</span>':'')+'</div>'+(item.retestResult?'<p><strong>재확인</strong> '+escapeHtml(item.retestResult)+'<br>'+escapeHtml(item.feedback||'')+'</p>':'')+'<div class="special-item-actions"><select data-clinic-status="'+item.id+'">'+['필요','예정','진행 중','완료','재지도 필요'].map(function(status){return '<option '+(status===item.status?'selected':'')+'>'+status+'</option>'}).join('')+'</select><button class="btn small" type="button" data-clinic-result="'+item.id+'">결과 기록</button></div></article>'}).join('')||'<div class="special-empty">조건에 맞는 클리닉이 없습니다.</div>';
    document.querySelectorAll('[data-clinic-status]').forEach(function(select){select.onchange=function(){updateClinic(select.dataset.clinicStatus,{status:select.value,completedDate:select.value==='완료'?today:''})}});
    document.querySelectorAll('[data-clinic-result]').forEach(function(button){button.onclick=function(){var result=window.prompt('재확인 테스트 결과를 입력하세요. (미실시라면 비워두세요)',''),feedback=window.prompt('클리닉 후 교사 피드백을 입력하세요.','');if(result===null||feedback===null)return;updateClinic(button.dataset.clinicResult,{status:'완료',completedDate:today,retestResult:clean(result),feedback:clean(feedback)})}});
  }

  async function updateClinic(clinicId,patch){
    var clinic=state.specialClinics.find(function(item){return item.id===clinicId});if(!clinic)return;Object.assign(clinic,patch);localSave();renderClinicList();
    try{if(cloudEnabled)await cloud('special_clinics?id=eq.'+encodeURIComponent(clinicId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:clinic.status,completed_date:clinic.completedDate||null,retest_result:clinic.retestResult||'',feedback:clinic.feedback||'',updated_at:new Date().toISOString()})});toast('클리닉 상태를 저장했습니다.')}catch(error){toast('클리닉 상태를 클라우드에 저장하지 못했습니다.')}
  }

  function renderHistory(){
    var studentId=Number(document.getElementById('special-history-student').value),subject=document.getElementById('special-history-subject').value,metrics=studentMetrics(studentId),evaluations=metrics.evaluations.filter(function(item){var session=state.specialSessions.find(function(value){return value.id===item.sessionId});return subject==='전체'||session&&session.subject===subject}),clinics=metrics.clinics.filter(function(item){return subject==='전체'||item.subject===subject}),achievement=average(evaluations.map(function(item){return item.achievement})),tests=evaluations.filter(function(item){return item.testStatus==='응시'&&item.testScore!==null});
    var byWeek=Array.from({length:state.specialProgram.totalWeeks},function(_,index){var week=index+1,values=evaluations.filter(function(item){var session=state.specialSessions.find(function(value){return value.id===item.sessionId});return session&&session.weekNo===week}).map(function(item){return item.achievement});return {week:week,value:average(values)}});
    document.getElementById('special-history-content').innerHTML='<div class="special-history-grid"><article class="card special-history-card"><span>평가 차시</span><strong>'+evaluations.length+'회</strong></article><article class="card special-history-card"><span>평균 성취도</span><strong>'+(achievement===null?'기록 없음':achievement.toFixed(1)+'/5')+'</strong></article><article class="card special-history-card"><span>테스트 응시</span><strong>'+tests.length+'회</strong></article></div><div class="special-history-columns"><article class="card"><div class="head"><div><h2>12주 성취도 변화</h2><p>주차별 저장 평가 평균</p></div></div><div class="special-bars">'+byWeek.map(function(item){return '<div><div class="special-bar-label"><span>'+item.week+'주차</span><b>'+(item.value===null?'기록 없음':item.value.toFixed(1)+'/5')+'</b></div><div class="special-bar"><i style="width:'+(item.value===null?0:item.value/5*100)+'%"></i></div></div>'}).join('')+'</div></article><article class="card"><div class="head"><div><h2>학습·클리닉 누적 이력</h2><p>수업 평가와 보충 과정을 시간순으로 확인합니다.</p></div></div><div class="special-timeline">'+historyTimeline(evaluations,clinics)+'</div></article></div>';
  }

  function historyTimeline(evaluations,clinics){
    var items=[];evaluations.forEach(function(item){var session=state.specialSessions.find(function(value){return value.id===item.sessionId});if(session)items.push({date:session.sessionDate,title:session.subject+' '+session.weekNo+'주차 '+session.sessionNo+'차시',text:'성취도 '+item.achievement+'/5 · 집중도 '+item.focus+'/5 · '+formatScore(item)+(item.memo?' · '+item.memo:'')})});clinics.forEach(function(item){items.push({date:item.createdDate,title:item.subject+' 클리닉 · '+item.status,text:item.area+(item.retestResult?' · 재확인 '+item.retestResult:'')})});return items.sort(function(a,b){return b.date.localeCompare(a.date)}).map(function(item){return '<div class="special-timeline-item"><strong>'+escapeHtml(item.date)+' · '+escapeHtml(item.title)+'</strong><p>'+escapeHtml(item.text)+'</p></div>'}).join('')||'<div class="special-empty">저장된 학습 이력이 없습니다.</div>';
  }

  function buildReport(studentId,type,subject,period,teacher,startDate,endDate){
    var metrics=studentMetrics(studentId),evaluations=metrics.evaluations.filter(function(item){var session=state.specialSessions.find(function(value){return value.id===item.sessionId});return session&&session.sessionDate>=startDate&&session.sessionDate<=endDate&&(subject==='통합'||session.subject===subject)}),sessions=evaluations.map(function(item){return state.specialSessions.find(function(session){return session.id===item.sessionId})}).filter(Boolean),clinics=metrics.clinics.filter(function(item){return item.createdDate>=startDate&&item.createdDate<=endDate&&(subject==='통합'||item.subject===subject)}),tests=evaluations.filter(function(item){return item.testStatus==='응시'&&item.testScore!==null}),strong=evaluations.filter(function(item){return item.achievement>=4&&item.memo}).map(function(item){return item.memo}),needs=clinics.map(function(item){return item.area}),plans=clinics.filter(function(item){return item.status!=='완료'&&item.plan}).map(function(item){return item.plan}),progress=Array.from(new Set(sessions.map(function(item){return item.subject+' '+item.materialProgress}).filter(Boolean)));
    return {attendance:formatRate(percent(evaluations.filter(function(item){return ['출석','지각','보강'].includes(item.attendance)}).length,evaluations.length)),homework:formatRate(percent(evaluations.filter(function(item){return item.homeworkStatus==='완료'}).length,evaluations.length)),achievement:evaluations.length?average(evaluations.map(function(item){return item.achievement})).toFixed(1)+'/5':'기록 없음',tests:tests.length?tests.map(function(item){return (item.testName||'테스트')+' '+formatScore(item)}).join(', '):'응시 기록 없음',progress:progress.length?progress.join('\n'):'저장된 진도 없음',strengths:strong.length?Array.from(new Set(strong)).join('\n'):'구체적인 강점 메모 없음',needs:needs.length?Array.from(new Set(needs)).join('\n'):'등록된 보완 항목 없음',clinic:clinics.length?clinics.map(function(item){return item.area+' · '+item.status+(item.retestResult?' · 재확인 '+item.retestResult:'')}).join('\n'):'클리닉 기록 없음',nextPlan:plans.length?Array.from(new Set(plans)).join('\n'):'등록된 다음 학습 계획 없음',teacherOpinion:'담당 교사 종합 의견을 입력해주세요.',period:period,type:type,subject:subject,teacher:teacher};
  }

  function renderReportPreview(report){
    activeReportId=report?report.id:'';
    var target=document.getElementById('special-report-preview');if(!report){target.className='special-report-preview special-empty';target.textContent='학생과 기간을 선택해 리포트 초안을 생성하세요.';return}
    var content=report.content||{};target.className='special-report-preview';target.innerHTML='<div class="special-report-head"><div><h3>'+escapeHtml(studentName(report.studentId))+' '+escapeHtml(report.reportType)+' 학습 리포트</h3><p>'+escapeHtml(report.periodLabel)+' · '+escapeHtml(report.subject)+' · 담당 '+escapeHtml(report.teacher)+'</p></div><span class="special-report-status '+(report.status==='승인'?'approved':report.status==='전달 완료'?'delivered':'')+'">'+escapeHtml(report.status)+'</span></div>'+reportField('학습 현황','출석률 '+content.attendance+' · 과제 완료율 '+content.homework+' · 평균 성취도 '+content.achievement+'\n테스트: '+content.tests)+reportField('학습 진도',content.progress)+reportField('학습 강점',content.strengths,'strengths')+reportField('보완할 부분',content.needs,'needs')+reportField('클리닉 진행 현황',content.clinic,'clinic')+reportField('다음 학습 계획',content.nextPlan,'nextPlan')+reportField('담당 교사 종합 의견',content.teacherOpinion,'teacherOpinion')+'<div class="special-item-actions"><button class="btn small" type="button" id="special-save-report-edits">수정 내용 저장</button>'+(report.status==='초안'&&currentUserRole==='admin'?'<button class="btn small primary" type="button" data-approve-report="'+report.id+'">원장 승인</button>':'')+(report.status!=='초안'?'<button class="btn small primary" type="button" data-print-report="'+report.id+'">PDF 저장</button><button class="btn small" type="button" data-copy-report="'+report.id+'">안내문 복사</button>':'')+'</div>';
    document.getElementById('special-save-report-edits').onclick=saveReportEdits;
    bindReportActions(target);
  }

  function reportField(title,text,field){return '<section '+(field?'data-report-field="'+field+'" contenteditable="true"':'')+'><h4>'+title+'</h4><p>'+escapeHtml(text||'기록 없음')+'</p></section>'}

  function renderReportList(){
    var reports=[].concat(state.specialReports).sort(function(a,b){return String(b.createdAt).localeCompare(String(a.createdAt))});
    document.getElementById('special-report-list').innerHTML=reports.map(function(report){return '<article class="special-report-item"><div class="special-report-head"><div><strong>'+escapeHtml(studentName(report.studentId))+' · '+escapeHtml(report.reportType)+'</strong><p>'+escapeHtml(report.periodLabel)+' · '+escapeHtml(report.subject)+'</p></div><span class="special-report-status '+(report.status==='승인'?'approved':report.status==='전달 완료'?'delivered':'')+'">'+escapeHtml(report.status)+'</span></div><div class="special-item-actions"><button class="btn small" type="button" data-view-report="'+report.id+'">열기</button>'+(report.status==='초안'&&currentUserRole==='admin'?'<button class="btn small primary" type="button" data-approve-report="'+report.id+'">원장 승인</button>':'')+(report.status!=='초안'?'<button class="btn small" type="button" data-print-report="'+report.id+'">PDF 저장</button><button class="btn small" type="button" data-copy-report="'+report.id+'">안내문 복사</button><button class="btn small" type="button" data-deliver-report="'+report.id+'">전달 완료</button>':'')+'</div></article>'}).join('')||'<div class="special-empty">작성된 리포트가 없습니다.</div>';
    bindReportActions(document.getElementById('special-report-list'));if(activeReportId)renderReportPreview(state.specialReports.find(function(item){return item.id===activeReportId}));
  }

  function bindReportActions(root){
    root.querySelectorAll('[data-view-report]').forEach(function(button){button.onclick=function(){renderReportPreview(state.specialReports.find(function(item){return item.id===button.dataset.viewReport}))}});
    root.querySelectorAll('[data-approve-report]').forEach(function(button){button.onclick=function(){updateReportStatus(button.dataset.approveReport,'승인')}});
    root.querySelectorAll('[data-deliver-report]').forEach(function(button){button.onclick=function(){updateReportStatus(button.dataset.deliverReport,'전달 완료')}});
    root.querySelectorAll('[data-print-report]').forEach(function(button){button.onclick=function(){printReport(button.dataset.printReport)}});
    root.querySelectorAll('[data-copy-report]').forEach(function(button){button.onclick=function(){copyReport(button.dataset.copyReport)}});
  }

  async function saveReportEdits(){
    var report=state.specialReports.find(function(item){return item.id===activeReportId});if(!report)return;document.querySelectorAll('#special-report-preview [data-report-field]').forEach(function(section){report.content[section.dataset.reportField]=clean(section.querySelector('p').innerText)});localSave();await syncReport(report);toast('리포트 수정 내용을 저장했습니다.');renderReportPreview(report)
  }

  async function updateReportStatus(reportId,status){
    if(status==='승인'&&currentUserRole!=='admin')return;var report=state.specialReports.find(function(item){return item.id===reportId});if(!report)return;report.status=status;if(status==='승인'){report.approvedAt=new Date().toISOString();report.approvedBy=currentUserName||'원장'}if(status==='전달 완료')report.deliveredAt=new Date().toISOString();localSave();await syncReport(report);toast(status==='승인'?'리포트를 승인했습니다.':'전달 완료일을 기록했습니다.');renderReportList();renderReportPreview(report)
  }

  async function syncReport(report){
    if(!cloudEnabled)return;await cloud('special_reports?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:report.id,student_id:report.studentId,report_type:report.reportType,subject:report.subject,period_label:report.periodLabel,teacher:report.teacher,content:report.content,status:report.status,approved_at:report.approvedAt||null,approved_by:report.approvedBy||'',delivered_at:report.deliveredAt||null,updated_at:new Date().toISOString()})})
  }

  function reportPlainText(report){
    var c=report.content;return '[고래영어·이든수학학원] '+studentName(report.studentId)+' '+report.reportType+' 학습 리포트\n평가 기간: '+report.periodLabel+'\n출석률 '+c.attendance+' / 과제 완료율 '+c.homework+' / 성취도 '+c.achievement+'\n\n학습 강점\n'+c.strengths+'\n\n보완할 부분\n'+c.needs+'\n\n클리닉\n'+c.clinic+'\n\n다음 학습 계획\n'+c.nextPlan+'\n\n담당 교사 의견\n'+c.teacherOpinion
  }

  async function copyReport(reportId){var report=state.specialReports.find(function(item){return item.id===reportId});if(!report)return;await navigator.clipboard.writeText(reportPlainText(report));toast('문자·카카오톡 안내문을 복사했습니다.')}

  function printReport(reportId){
    var report=state.specialReports.find(function(item){return item.id===reportId});if(!report||report.status==='초안')return;var c=report.content,popup=window.open('','_blank','width=860,height=1000');if(!popup){toast('팝업을 허용한 뒤 다시 시도해주세요.');return}var section=function(title,text){return '<section><h2>'+title+'</h2><p>'+escapeHtml(text||'기록 없음').replaceAll('\n','<br>')+'</p></section>'};popup.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>'+escapeHtml(studentName(report.studentId))+' 학습 리포트</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,\"Noto Sans KR\",sans-serif;color:#183247;margin:0}header{border-bottom:3px solid #0b4b78;padding-bottom:14px}h1{font-size:23px;margin:0 0 8px}header p{color:#62717b;margin:0;font-size:12px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.summary div{padding:12px;border-radius:9px;background:#eef5f8;font-size:12px}.summary b{display:block;margin-top:5px;font-size:17px}section{break-inside:avoid;margin-top:16px}h2{font-size:13px;color:#0b4b78;margin:0 0 7px}section p{margin:0;padding:11px 13px;border:1px solid #dce5ea;border-radius:8px;font-size:11px;line-height:1.7}footer{margin-top:22px;padding-top:10px;border-top:1px solid #dce5ea;color:#6b7982;font-size:10px}</style></head><body><header><h1>고래영어·이든수학학원 학습 리포트</h1><p>'+escapeHtml(studentName(report.studentId))+' · '+escapeHtml(report.reportType)+' · '+escapeHtml(report.periodLabel)+' · 담당 '+escapeHtml(report.teacher)+'</p></header><div class="summary"><div>출석률<b>'+c.attendance+'</b></div><div>과제 완료율<b>'+c.homework+'</b></div><div>평균 성취도<b>'+c.achievement+'</b></div></div>'+section('학습 진도',c.progress)+section('테스트 결과',c.tests)+section('학습 강점',c.strengths)+section('보완할 부분',c.needs)+section('클리닉 진행 현황',c.clinic)+section('다음 학습 계획',c.nextPlan)+section('담당 교사 종합 의견',c.teacherOpinion)+'<footer>원장 승인: '+escapeHtml(report.approvedBy||'원장')+' · '+escapeHtml((report.approvedAt||'').slice(0,10))+'</footer><script>window.onload=function(){window.print()}<\/script></body></html>');popup.document.close()
  }

  function renderSettings(){
    var p=state.specialProgram,form=document.getElementById('special-settings-form');document.getElementById('special-setting-name').value=p.name;document.getElementById('special-setting-start').value=p.startDate;document.getElementById('special-setting-weeks').value=p.totalWeeks;document.getElementById('special-setting-hours').value=p.hoursPerSubject;document.getElementById('special-setting-warning').value=p.warningThreshold;document.getElementById('special-setting-danger').value=p.dangerThreshold;form.querySelectorAll('input,button').forEach(function(element){element.disabled=currentUserRole!=='admin'})
  }

  function renderEnrollments(){
    var container=document.getElementById('special-enrollment-list');if(!container)return;
    if(currentUserRole!=='admin'){container.innerHTML='<div class="special-empty">학생 편성은 원장 관리자만 변경할 수 있습니다.</div>';return}
    container.innerHTML=academyActiveStudents().map(function(student){var enrollment=enrollmentFor(student.id)||{subjects:'영어·수학',englishTeacher:'',mathTeacher:'',initialLevel:'',notes:''},enrolled=Boolean(enrollmentFor(student.id));return '<div class="special-enrollment-row" data-enrollment-student="'+student.id+'"><strong><label><input data-enrollment-field="enabled" type="checkbox" '+(enrolled?'checked':'')+'> '+escapeHtml(student.name)+'</label><small>'+escapeHtml(studentGradeLabel(student))+'</small></strong><select data-enrollment-field="subjects"><option '+(enrollment.subjects==='영어'?'selected':'')+'>영어</option><option '+(enrollment.subjects==='수학'?'selected':'')+'>수학</option><option '+(enrollment.subjects==='영어·수학'?'selected':'')+'>영어·수학</option></select><input data-enrollment-field="englishTeacher" value="'+escapeHtml(enrollment.englishTeacher)+'" placeholder="영어 담당 교사"><input data-enrollment-field="mathTeacher" value="'+escapeHtml(enrollment.mathTeacher)+'" placeholder="수학 담당 교사"><input data-enrollment-field="initialLevel" value="'+escapeHtml(enrollment.initialLevel)+'" placeholder="현재 수준·초기 진단"><button class="btn small primary" type="button" data-save-enrollment="'+student.id+'">편성 저장</button></div>'}).join('')||'<div class="special-empty">먼저 학생 관리에서 학생을 등록해주세요.</div>';
    container.querySelectorAll('[data-save-enrollment]').forEach(function(button){button.onclick=function(){saveEnrollment(Number(button.dataset.saveEnrollment))}});
  }

  async function saveEnrollment(studentId){
    var row=document.querySelector('[data-enrollment-student="'+studentId+'"]'),get=function(field){var element=row.querySelector('[data-enrollment-field="'+field+'"]');return element.type==='checkbox'?element.checked:clean(element.value)},enabled=get('enabled'),previous=enrollmentFor(studentId);
    if(!enabled){
      state.specialEnrollments=state.specialEnrollments.filter(function(item){return item.studentId!==studentId});localSave();
      try{if(cloudEnabled)await cloud('special_enrollments?program_id=eq.'+encodeURIComponent(state.specialProgram.id)+'&student_id=eq.'+studentId,{method:'DELETE',headers:{Prefer:'return=minimal'}});toast(studentName(studentId)+' 학생을 특강 편성에서 제외했습니다.');renderSpecial()}catch{if(previous)state.specialEnrollments.push(previous);localSave();toast('특강 편성 제외를 저장하지 못했습니다.')}return
    }
    var enrollment={studentId:studentId,subjects:get('subjects'),englishTeacher:get('englishTeacher'),mathTeacher:get('mathTeacher'),initialLevel:get('initialLevel'),notes:''};state.specialEnrollments=state.specialEnrollments.filter(function(item){return item.studentId!==studentId});state.specialEnrollments.push(enrollment);localSave();
    try{if(cloudEnabled)await cloud('special_enrollments?on_conflict=program_id,student_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({program_id:state.specialProgram.id,student_id:studentId,subjects:enrollment.subjects,english_teacher:enrollment.englishTeacher,math_teacher:enrollment.mathTeacher,initial_level:enrollment.initialLevel,notes:enrollment.notes,updated_at:new Date().toISOString()})});toast(studentName(studentId)+' 학생의 특강 편성을 저장했습니다.');renderSpecial()}catch{state.specialEnrollments=state.specialEnrollments.filter(function(item){return item.studentId!==studentId});if(previous)state.specialEnrollments.push(previous);localSave();toast('특강 편성을 클라우드에 저장하지 못했습니다.')}
  }

  function switchSpecialTab(tab){specialTab=tab;renderSpecial()}
  document.querySelectorAll('[data-special-tab]').forEach(function(button){button.onclick=function(){switchSpecialTab(button.dataset.specialTab)}});
  document.getElementById('special-save-evaluations').onclick=saveEvaluations;
  document.getElementById('special-clinic-filter').onchange=renderClinicList;
  document.getElementById('special-history-student').onchange=renderHistory;
  document.getElementById('special-history-subject').onchange=renderHistory;
  document.getElementById('special-export-csv').onclick=function(){
    var rows=[['구분','학생','과목','일자','주차','차시','출결','과제','성취도','집중도','테스트','점수','클리닉 상태','메모']];
    state.specialEvaluations.forEach(function(item){var session=state.specialSessions.find(function(value){return value.id===item.sessionId});rows.push(['차시평가',studentName(item.studentId),session?session.subject:'',session?session.sessionDate:'',session?session.weekNo:'',session?session.sessionNo:'',item.attendance,item.homeworkStatus,item.achievement,item.focus,item.testStatus,formatScore(item),'',item.memo])});
    state.specialClinics.forEach(function(item){rows.push(['클리닉',studentName(item.studentId),item.subject,item.createdDate,'','','','','','','','',item.status,item.area+' / '+item.feedback])});
    var csv='\ufeff'+rows.map(function(row){return row.map(function(cell){return '"'+String(cell===null?'':cell).replaceAll('"','""')+'"'}).join(',')}).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='예비고1_12주특강_백업_'+today+'.csv';anchor.click();URL.revokeObjectURL(url);toast('특강 평가와 클리닉 CSV를 내려받았습니다.')
  };

  document.getElementById('special-session-form').onsubmit=async function(event){
    event.preventDefault();var wasEditing=Boolean(editingSessionId),previous=wasEditing?structuredClone(state.specialSessions.find(function(item){return item.id===editingSessionId})):null,session={id:editingSessionId||id(),subject:document.getElementById('special-session-subject').value,sessionDate:document.getElementById('special-session-date').value,weekNo:Number(document.getElementById('special-session-week').value),sessionNo:Number(document.getElementById('special-session-number').value),teacher:clean(document.getElementById('special-session-teacher').value),materialProgress:clean(document.getElementById('special-session-progress').value),goal:clean(document.getElementById('special-session-goal').value),content:clean(document.getElementById('special-session-content').value),homework:clean(document.getElementById('special-session-homework').value),testInfo:clean(document.getElementById('special-session-test').value),status:document.getElementById('special-session-status').value};state.specialSessions=state.specialSessions.filter(function(item){return item.id!==session.id});state.specialSessions.unshift(session);activeSessionId=session.id;localSave();
    try{if(cloudEnabled)await cloud('special_sessions?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:session.id,program_id:state.specialProgram.id,subject:session.subject,session_date:session.sessionDate,week_no:session.weekNo,session_no:session.sessionNo,teacher:session.teacher,material_progress:session.materialProgress,goal:session.goal,content:session.content,homework:session.homework,test_info:session.testInfo,status:session.status,updated_at:new Date().toISOString()})});toast(wasEditing?'차시 수정 내용을 저장했습니다.':'공통 수업 내용을 저장했습니다.');editingSessionId='';event.target.reset();document.getElementById('special-session-date').value=today;document.getElementById('special-session-submit').textContent='공통 수업 저장';renderSpecial()}catch(error){state.specialSessions=state.specialSessions.filter(function(item){return item.id!==session.id});if(previous)state.specialSessions.unshift(previous);localSave();toast('수업 내용을 클라우드에 저장하지 못했습니다.')}
  };

  document.getElementById('special-clinic-form').onsubmit=async function(event){
    event.preventDefault();var clinic={id:id(),studentId:Number(document.getElementById('special-clinic-student').value),subject:document.getElementById('special-clinic-subject').value,createdDate:document.getElementById('special-clinic-created').value,sessionId:activeSessionId||'',area:clean(document.getElementById('special-clinic-area').value),cause:clean(document.getElementById('special-clinic-cause').value),plan:clean(document.getElementById('special-clinic-plan').value),teacher:clean(document.getElementById('special-clinic-teacher').value),plannedDate:document.getElementById('special-clinic-planned').value,completedDate:'',retestResult:'',feedback:'',status:document.getElementById('special-clinic-status').value};state.specialClinics.unshift(clinic);localSave();
    try{if(cloudEnabled)await cloud('special_clinics',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:clinic.id,program_id:state.specialProgram.id,student_id:clinic.studentId,subject:clinic.subject,created_date:clinic.createdDate,session_id:clinic.sessionId||null,area:clinic.area,cause:clinic.cause,plan:clinic.plan,teacher:clinic.teacher,planned_date:clinic.plannedDate||null,status:clinic.status})});toast('개별 클리닉을 저장했습니다.');event.target.reset();document.getElementById('special-clinic-created').value=today;renderClinicList()}catch(error){state.specialClinics=state.specialClinics.filter(function(item){return item.id!==clinic.id});localSave();toast('클리닉을 클라우드에 저장하지 못했습니다.')}
  };

  document.getElementById('special-report-form').onsubmit=async function(event){
    event.preventDefault();var studentId=Number(document.getElementById('special-report-student').value),type=document.getElementById('special-report-type').value,subject=document.getElementById('special-report-subject').value,teacher=clean(document.getElementById('special-report-teacher').value),startDate=document.getElementById('special-report-start').value,endDate=document.getElementById('special-report-end').value,period=startDate+' ~ '+endDate;if(startDate>endDate){toast('평가 종료일은 시작일보다 빠를 수 없습니다.');return}var report={id:id(),studentId:studentId,reportType:type,subject:subject,periodLabel:period,teacher:teacher,content:buildReport(studentId,type,subject,period,teacher,startDate,endDate),status:'초안',approvedAt:'',approvedBy:'',deliveredAt:'',createdAt:new Date().toISOString()};state.specialReports.unshift(report);activeReportId=report.id;localSave();
    try{await syncReport(report);toast('실제 저장 기록으로 리포트 초안을 만들었습니다.');renderReportList();renderReportPreview(report)}catch(error){state.specialReports=state.specialReports.filter(function(item){return item.id!==report.id});localSave();toast('리포트 초안을 클라우드에 저장하지 못했습니다.')}
  };

  document.getElementById('special-settings-form').onsubmit=async function(event){
    event.preventDefault();var program={id:'prehigh-2026',name:clean(document.getElementById('special-setting-name').value),startDate:document.getElementById('special-setting-start').value,totalWeeks:Number(document.getElementById('special-setting-weeks').value),hoursPerSubject:Number(document.getElementById('special-setting-hours').value),warningThreshold:Number(document.getElementById('special-setting-warning').value),dangerThreshold:Number(document.getElementById('special-setting-danger').value)};state.specialProgram=program;localSave();
    try{if(cloudEnabled)await cloud('special_programs?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:program.id,name:program.name,start_date:program.startDate,total_weeks:program.totalWeeks,hours_per_subject:program.hoursPerSubject,warning_threshold:program.warningThreshold,danger_threshold:program.dangerThreshold,updated_at:new Date().toISOString()})});toast('특강 설정을 저장했습니다.');renderSpecial()}catch(error){toast('특강 설정을 클라우드에 저장하지 못했습니다.')}
  };
})();
