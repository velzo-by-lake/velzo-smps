# 부품 이미지 추가 가이드

견적서에 부품 이미지를 표시하기 위한 가이드입니다.

## 이미지 파일 위치

부품 이미지는 다음 경로에 저장하세요:

```
public/images/accessories/
```

## 파일명 규칙

부품 ID와 동일한 파일명을 사용하세요:

| 부품 ID | 파일명 |
|---------|--------|
| `holder_long` | `holder_long.png` (또는 `.jpg`, `.webp`) |
| `holder_short` | `holder_short.png` |
| `clip_holder` | `clip_holder.png` |
| `clip` | `clip.png` |

## 이미지 형식

- **권장 형식**: PNG, JPG, WebP
- **권장 크기**: 60x60px ~ 120x120px (정사각형 권장)
- **배경**: 투명 배경(PNG) 또는 흰색 배경 권장

## 이미지 경로 설정

이미지 파일을 추가한 후, `src/data/accessories.ts` 파일에서 이미지 경로를 확인하세요:

```typescript
{
  id: 'holder_long',
  name: 'Velzo 벨조 홀더 Long',
  price: 15000,
  size: '5×8.2cm',
  color: '블랙 Black',
  image: '/images/accessories/holder_long.png', // 여기에 경로 지정
}
```

## 이미지가 없는 경우

이미지가 없는 부품은 자동으로 "부품" 텍스트 placeholder가 표시됩니다.

## 예시

1. `holder_long.png` 파일을 `public/images/accessories/` 폴더에 추가
2. `src/data/accessories.ts`에서 해당 부품의 `image` 필드 확인:
   ```typescript
   image: '/images/accessories/holder_long.png'
   ```
3. 견적서 페이지에서 이미지가 자동으로 표시됩니다.

## 주의사항

- 파일명은 대소문자를 구분합니다
- 이미지 파일이 없거나 경로가 잘못된 경우, 자동으로 placeholder가 표시됩니다
- 이미지 로드 실패 시에도 placeholder로 대체됩니다

