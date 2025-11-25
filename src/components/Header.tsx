type HeaderProps = {
  totalWatt: number
  belts: number
}

function Header({ totalWatt, belts }: HeaderProps) {
  return (
    <>
      <div className="top-banner">
        <div className="banner-content">
          <div className="banner-links">
            <a
              href="https://www.velzo.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-link home"
            >
              <span className="link-icon">🏠</span>
              <span className="link-text">홈페이지</span>
            </a>
            <a
              href="https://naver.me/FOZMZ1F6"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-link naver"
            >
              <span className="link-icon">📍</span>
              <span className="link-text">네이버 플레이스</span>
            </a>
            <a
              href="https://www.instagram.com/velzo_light/"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-link instagram"
            >
              <span className="link-icon">📷</span>
              <span className="link-text">인스타그램</span>
            </a>
            <a
              href="https://pf.kakao.com/_ZIpxiG"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-link kakao"
            >
              <span className="link-icon">💬</span>
              <span className="link-text">카카오톡 문의</span>
            </a>
            <a
              href="https://blog.naver.com/velzo"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-link blog"
            >
              <span className="link-icon">📝</span>
              <span className="link-text">네이버 블로그</span>
            </a>
          </div>
          <a href="tel:010-7356-6036" className="phone-button">
            <span className="phone-icon">📞</span>
            <span className="phone-number">010-7356-6036</span>
          </a>
        </div>
      </div>
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
    </>
  )
}

export default Header

