type HeaderProps = {
  totalWatt: number
  belts: number
}

function Header({ totalWatt, belts }: HeaderProps) {
  return (
    <header className="sim-header">
      <div>
        <p className="eyebrow">VELZO · Belt Lighting System</p>
        <h1>VELZO Belt Lighting Simulator</h1>
        <p className="lead">
          벨조 모듈을 IronGray 벨트 위에 자유롭게 배치해 48V/100W SMPS 구성을 설계하세요.
        </p>
      </div>
      <div className="header-metrics">
        <div>
          <span className="metric-label">총 소비 전력</span>
          <strong>{totalWatt}W</strong>
        </div>
        <div>
          <span className="metric-label">SMPS 대수</span>
          <strong>{belts}대</strong>
        </div>
      </div>
    </header>
  )
}

export default Header

