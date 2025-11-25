export interface Accessory {
  id: string
  name: string
  price: number
  size: string
  color: string
}

export const accessories: Accessory[] = [
  {
    id: 'holder_long',
    name: 'Velzo 벨조 홀더 Long',
    price: 15000,
    size: '5×8.2cm',
    color: '블랙 Black',
  },
  {
    id: 'holder_short',
    name: 'Velzo 벨조 홀더 Short',
    price: 15000,
    size: '5×5.1cm',
    color: '블랙 Black',
  },
  {
    id: 'clip_holder',
    name: 'Velzo 벨조 클립형 홀더',
    price: 8000,
    size: '4.2×3.2×4.7cm',
    color: '블랙 Black',
  },
  {
    id: 'clip',
    name: 'Velzo 벨조 클립',
    price: 5000,
    size: '4.1×2.1×1.1cm',
    color: '블랙 Black',
  },
]

