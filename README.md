# 부경사업단 업무앱 V3

Supabase + Netlify 온라인 데이터 연동 준비버전입니다.

## 포함 기능
- 메인 앱 메뉴
- 가동관리(FC 이미지전송)
- 가동관리(지점/매니저 실적)
- 대리점관리
- 관리자 엑셀 업로드 화면
- Supabase 데이터 저장 테이블 SQL
- 업로드 데이터 확인 화면

## 사용 순서
1. Supabase 프로젝트 생성
2. supabase_schema.sql 실행
3. supabase-config.js에 URL / anon key 입력
4. GitHub에 전체 파일 업로드
5. Netlify 자동 배포 확인
6. admin.html에서 엑셀 업로드 테스트

## 중요
현재 기존 대시보드 3개는 기존 정적 HTML 엔진을 유지합니다.
관리자 업로드 데이터가 실제 대시보드 그래프에 자동 반영되려면 다음 단계에서 각 대시보드 엔진을 Supabase 조회형으로 변환해야 합니다.
