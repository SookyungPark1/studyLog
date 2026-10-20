# StudyLog 🌱

하루 5분, 조금씩 오래 배우는 영어 학습 웹앱입니다.
Java 17 + Spring Boot 3 / React + TypeScript + Vite / MySQL 8.4를 사용합니다.

## 첫 버전 기능

- 카페 주문 상황: 듣기 → 읽기 → 따라 말하기 → 퀴즈
- 브라우저 영어 음성 읽기(TTS). 기기에 영어 음성이 필요할 수 있습니다.
- 서버에서 퀴즈 정답 확인 후 MySQL에 학습 완료 저장
- 한국 시간 기준 하루 한 번 기록, 연속 학습일, 최근 7일 달력
- 같은 날 복습해도 학습일 중복 집계 방지
- 반응형 화면, 요청 실패 안내 및 재시도

현재 **로컬 개인 사용 MVP**입니다. 로그인과 사용자 구분이 없어 모든 접속자가 기록을 공유합니다.
외부에 공개하기 전에 인증·사용자별 데이터 분리·접근 제어가 필요합니다.
말하기는 따라 읽기 방식이며 녹음·발음 채점, 알림, 자동 복습 스케줄은 아직 없습니다.
학습 자료는 이 프로젝트용 예시이며 다른 학습 서비스의 콘텐츠를 복제하지 않았습니다.

## 준비물

- IntelliJ IDEA, JDK 17 이상
- Node.js 22.12 이상 (또는 지원되는 최신 LTS)
- Docker Desktop / Docker Compose (MySQL용)
- 처음 실행할 때 의존성을 다운로드할 인터넷 연결

## IntelliJ에서 실행

### 1. 코드 받기

GitHub에 올라간 `feat/studylog-web` 브랜치를 체크아웃하고 프로젝트 폴더를 엽니다.
기존 클론에서는 변경 사항을 보관한 후 `git fetch origin` 및 `git switch --track origin/feat/studylog-web`을 사용합니다.
이미 해당 로컬 브랜치가 있다면 `git switch feat/studylog-web` 후 `git pull --ff-only`하세요.

### 2. MySQL 실행

루트의 `.env.example`을 `.env`로 복사하고 **두 비밀번호를 각각 변경**하세요.
`.env`는 Git에서 제외됩니다. IntelliJ가 이 파일을 자동으로 읽지는 않습니다.

```sh
docker compose up -d --wait
```

기존 MySQL을 사용한다면 `studylog` 데이터베이스와 전용 사용자를 만들고 아래 연결 설정을 맞추세요.
Docker의 3306 포트와 충돌하면 기존 MySQL을 중지하거나 Compose 포트 및 `DB_URL`을 함께 변경하세요.
MySQL 볼륨에 이미 데이터가 있으면 `.env` 변경만으로 DB 비밀번호가 바뀌지는 않습니다.

### 3. Spring Boot 실행

IntelliJ에서 `backend/pom.xml`을 Maven 프로젝트로 불러오고 JDK 17 이상을 선택하세요.
`StudyLogApplication` 실행 구성의 환경 변수에 다음을 설정합니다.

```text
DB_PASSWORD=<.env에 정한 DB_PASSWORD>
```

기본값은 `DB_USER=studylog`, `DB_URL=jdbc:mysql://localhost:3306/studylog?connectionTimeZone=Asia/Seoul`입니다.
필요할 때 실행 구성에서 덮어쓸 수 있습니다. 실행하면 Flyway가 테이블을 생성합니다.

터미널에서는 `backend`에서 실행합니다.

```sh
# DB_PASSWORD를 현재 셸에 안전하게 설정한 후
./mvnw spring-boot:run
# Windows PowerShell / 명령 프롬프트
.\mvnw.cmd spring-boot:run
```

### 4. React 실행

별도 IntelliJ 터미널에서:

```sh
cd frontend
npm ci
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다. `/api` 요청은 Vite가 8080의 Spring Boot로 전달합니다.
첫 퀴즈를 마치고 페이지를 새로고침해도 완료 표시가 유지되면 정상입니다.
듣기가 안 들리면 브라우저·운영체제의 영어 음성 설정을 확인하거나 대본을 펼쳐 학습하세요.

## 검증

```sh
cd backend
./mvnw test package
# 별도 터미널
cd frontend
npm ci
npm run build
```

단위 테스트는 연속 학습일 계산과 오답 저장 방지를 검사합니다.
실제 MySQL 통합 확인은 DB와 백엔드를 실행한 뒤 저장소 루트에서:

```sh
python3 scripts/smoke.py
```

이 검사는 정답/오답 제출, 하루 중복 기록 방지, 진도 조회를 확인하며 **오늘의 학습 기록을 생성**합니다.
프론트 빌드 결과는 `frontend/dist`, 백엔드 결과는 `backend/target`입니다.
현재는 개발 서버 실행 구성입니다. 운영 배포 설정은 포함하지 않습니다.

## 종료

React와 Spring Boot 터미널에서 Ctrl+C, DB는 `docker compose stop`으로 중지합니다.
`docker compose down`도 볼륨 데이터를 보존합니다. `down -v`는 학습 데이터를 삭제하므로 주의하세요.
