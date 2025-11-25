export interface ProductSet {
  id: string
  name: string
  originalPrice: number
  discountPrice: number
  items: Array<{
    productId?: string
    accessoryId?: string
    name: string
    quantity: number
  }>
  beltLength: number // meters
}

export const productSets: ProductSet[] = [
  {
    id: 'stick_short_set',
    name: 'Velzo 파티션 스틱(Short) 세트 구성',
    originalPrice: 1165000,
    discountPrice: 799000,
    beltLength: 15,
    items: [
      { productId: 'stick_s', name: 'Velzo 스틱 조명 Short', quantity: 4 },
      { accessoryId: 'holder_short', name: 'Velzo 벨조 홀더 Short', quantity: 5 },
      { name: '1구 팬던트', quantity: 1 },
      { name: 'Velzo SMPS', quantity: 1 },
      { accessoryId: 'clip', name: 'Velzo 벨조 클립', quantity: 1 },
    ],
  },
  {
    id: 'ball_large_set',
    name: 'Velzo 구조명 (Large) 세트 구성',
    originalPrice: 570000,
    discountPrice: 399000,
    beltLength: 4,
    items: [
      { productId: 'ball_l', name: 'Velzo 구 조명 Large', quantity: 5 },
      { accessoryId: 'holder_short', name: 'Velzo 벨조 홀더 Short', quantity: 1 },
      { name: '1구 팬던트', quantity: 1 },
      { name: 'Velzo SMPS', quantity: 1 },
      { accessoryId: 'clip', name: 'Velzo 벨조 클립', quantity: 1 },
    ],
  },
  {
    id: 'half_large_set',
    name: 'Velzo 반원조명 (Large) 세트 구성',
    originalPrice: 331000,
    discountPrice: 231000,
    beltLength: 3,
    items: [
      { productId: 'half_l', name: 'Velzo 반원 조명 Large', quantity: 1 },
      { accessoryId: 'clip_holder', name: 'Velzo 벨조 클립형 홀더', quantity: 2 },
      { name: '1구 팬던트', quantity: 1 },
      { name: 'Velzo SMPS', quantity: 1 },
      { accessoryId: 'clip', name: 'Velzo 벨조 클립', quantity: 1 },
    ],
  },
  {
    id: 'shade_large_set',
    name: 'Velzo 갓조명 (Large) 세트 구성',
    originalPrice: 490000,
    discountPrice: 343000,
    beltLength: 3,
    items: [
      { productId: 'shade_l', name: 'Velzo 갓 조명 Large', quantity: 1 },
      { accessoryId: 'holder_short', name: 'Velzo 벨조 홀더 Short', quantity: 1 },
      { name: '1구 팬던트', quantity: 1 },
      { name: 'Velzo SMPS', quantity: 1 },
      { accessoryId: 'clip', name: 'Velzo 벨조 클립', quantity: 1 },
    ],
  },
  {
    id: 'stick_long_set',
    name: 'Velzo 스틱조명 (Long) 세트 구성',
    originalPrice: 790000,
    discountPrice: 553000,
    beltLength: 6.5,
    items: [
      { productId: 'stick_l', name: 'Velzo 스틱 조명 Long', quantity: 2 },
      { accessoryId: 'holder_short', name: 'Velzo 벨조 홀더 Short', quantity: 3 },
      { name: '1구 팬던트', quantity: 1 },
      { name: 'Velzo SMPS', quantity: 1 },
    ],
  },
]
