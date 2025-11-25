# VELZO SMPS 배포 가이드

## 🚀 자동 배포 (GitHub Actions + Supabase Storage) - 권장

### 1. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서 다음을 추가:

- `SUPABASE_URL`: Supabase 프로젝트 URL (예: `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_KEY`: Supabase Service Role Key (Settings → API → service_role key)

### 2. GitHub에 푸시

```bash
git add .
git commit -m "Add GitHub Actions deployment"
git push origin main
```

### 3. 자동 배포 확인

- GitHub 저장소 → Actions 탭에서 워크플로우 실행 확인
- `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다

### 4. 수동 배포 (로컬)

```bash
# 환경 변수 설정
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# 빌드 및 배포
npm run build
node scripts/deploy-supabase.js
```

---

## 방법 2: Vercel 배포 (Supabase 연동 가능)

1. **GitHub에 푸시**
   ```bash
   git add .
   git commit -m "Initial commit: VELZO Interactive Designer"
   git branch -M main
   git remote add origin https://github.com/velzo-by-lake/velzo-smps.git
   git push -u origin main
   ```

2. **Vercel 배포**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인
   - "New Project" 클릭
   - `velzo-smps` 저장소 선택
   - Framework Preset: **Vite** 자동 감지
   - Build Command: `npm run build` (자동)
   - Output Directory: `dist` (자동)
   - "Deploy" 클릭

3. **Supabase 연동 (선택사항)**
   - Vercel 프로젝트 설정에서 Environment Variables 추가
   - Supabase URL과 API Key 설정 가능

---

## 방법 3: Netlify 배포

1. **GitHub에 푸시** (위와 동일)

2. **Netlify 배포**
   - https://app.netlify.com 접속
   - "Add new site" → "Import an existing project"
   - GitHub 저장소 선택
   - Build command: `npm run build`
   - Publish directory: `dist`
   - "Deploy site" 클릭

---

## 로컬 테스트

```bash
npm run build
npm run preview
```

---

## Supabase Storage Public URL

배포 후 접속 URL 형식:
```
https://<project-ref>.supabase.co/storage/v1/object/public/velzo-smps/index.html
```

또는 Supabase 대시보드 → Storage → velzo-smps 버킷에서 각 파일의 Public URL 확인 가능
